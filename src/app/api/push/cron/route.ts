import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin-checker";
import {
  getJstDateString,
  getJstTimeString,
  isValidReminderTime,
} from "@/lib/notifications/push-manager";

export const dynamic = "force-dynamic";

function getAdminClient() {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_URL ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!url || !key) return null;
  return createSupabaseAdmin(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function isAuthorizedCronOrAdmin(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email && isAdminEmail(user.email)) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

/**
 * Smart Web Push Reminder Cron Endpoint (FB-033).
 * Finds enabled subscriptions matching targetTime (JST) and skips any user
 * who has already completed >= 1 practice session today (JST).
 */
async function handleReminderCron(req: NextRequest) {
  const authorized = await isAuthorizedCronOrAdmin(req);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayJst = getJstDateString(now);
  const urlParams = new URL(req.url).searchParams;
  const requestedTime = urlParams.get("time");
  const targetTime =
    requestedTime && isValidReminderTime(requestedTime)
      ? requestedTime
      : getJstTimeString(now);

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({
      ok: true,
      todayJst,
      targetTime,
      eligibleCount: 0,
      skippedPracticedCount: 0,
      note: "Supabase admin client not configured",
    });
  }

  try {
    // 1. Fetch active subscriptions for targetTime not yet notified today
    const { data: subs, error: subError } = await admin
      .from("push_subscriptions")
      .select("*")
      .eq("enabled", true)
      .eq("reminder_time", targetTime);

    if (subError || !subs) {
      return NextResponse.json({
        ok: true,
        todayJst,
        targetTime,
        eligibleCount: 0,
        skippedPracticedCount: 0,
      });
    }

    // 2. Check which users have already practiced today in JST (UTC+9)
    const jstDayStartUtc = new Date(`${todayJst}T00:00:00+09:00`).toISOString();
    const userIds = Array.from(
      new Set(
        subs
          .map((s: { user_id?: string | null }) => s.user_id)
          .filter((id): id is string => Boolean(id))
      )
    );

    const practicedUserIds = new Set<string>();
    if (userIds.length > 0) {
      const { data: todaySessions } = await admin
        .from("practice_sessions")
        .select("user_id")
        .in("user_id", userIds)
        .gte("created_at", jstDayStartUtc);

      for (const row of todaySessions || []) {
        if (row.user_id) {
          practicedUserIds.add(row.user_id);
        }
      }
    }

    let eligibleCount = 0;
    let skippedPracticedCount = 0;
    const notifiedIds: string[] = [];

    for (const sub of subs) {
      if (sub.last_notified_date === todayJst) {
        continue;
      }
      if (
        sub.smart_skip_if_practiced !== false &&
        sub.user_id &&
        practicedUserIds.has(sub.user_id)
      ) {
        skippedPracticedCount++;
        continue;
      }
      eligibleCount++;
      if (sub.id) {
        notifiedIds.push(sub.id);
      }
    }

    if (notifiedIds.length > 0) {
      await admin
        .from("push_subscriptions")
        .update({
          last_notified_date: todayJst,
          updated_at: new Date().toISOString(),
        })
        .in("id", notifiedIds);
    }

    return NextResponse.json({
      ok: true,
      todayJst,
      targetTime,
      eligibleCount,
      skippedPracticedCount,
    });
  } catch (err) {
    console.warn("Reminder cron error:", err);
    return NextResponse.json({
      ok: true,
      todayJst,
      targetTime,
      eligibleCount: 0,
      skippedPracticedCount: 0,
    });
  }
}

export async function GET(req: NextRequest) {
  return handleReminderCron(req);
}

export async function POST(req: NextRequest) {
  return handleReminderCron(req);
}
