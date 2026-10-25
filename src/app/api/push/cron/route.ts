import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin-checker";
import { sendWebPushNotification } from "@/lib/notifications/web-push-server";
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
    process.env.SUPABASE_URL ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
    "";
  if (!url || !key) return null;
  return createSupabaseAdmin(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function isAuthorizedCronOrAdmin(req: NextRequest): Promise<boolean> {
  const cronSecret =
    process.env.CRON_SECRET ||
    (process.env.NODE_ENV !== "production" ? "shadowlog_push_cron_secret_2026" : "");
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // Allow localhost / internal environment calls in development
  const host = req.headers.get("host") || "";
  if (
    process.env.NODE_ENV === "development" &&
    (host.includes("localhost") || host.includes("127.0.0.1"))
  ) {
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
 * Smart Web Push Reminder Cron Endpoint (FB-033 / FB-064).
 * Finds enabled subscriptions matching target time (JST), sends real Web Push notifications
 * via Apple / Google push services using VAPID, and skips any user
 * who has already completed >= 1 practice session today (JST).
 */
async function handleReminderCron(req: NextRequest) {
  const authorized = await isAuthorizedCronOrAdmin(req);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayJst = getJstDateString(now);
  const currentJstTime = getJstTimeString(now);
  const urlParams = new URL(req.url).searchParams;
  const requestedTime = urlParams.get("time");
  const targetTime =
    requestedTime && isValidReminderTime(requestedTime)
      ? requestedTime
      : currentJstTime;

  const admin = getAdminClient();
  if (!admin) {
    return NextResponse.json({
      ok: true,
      todayJst,
      targetTime,
      eligibleCount: 0,
      sentCount: 0,
      skippedPracticedCount: 0,
      note: "Supabase admin client not configured",
    });
  }

  try {
    // 1. Fetch active subscriptions not yet notified today
    let query = admin
      .from("push_subscriptions")
      .select("*")
      .eq("enabled", true);

    if (requestedTime && isValidReminderTime(requestedTime)) {
      query = query.eq("reminder_time", requestedTime);
    }

    const { data: subs, error: subError } = await query;

    if (subError || !subs || subs.length === 0) {
      return NextResponse.json({
        ok: true,
        todayJst,
        targetTime,
        eligibleCount: 0,
        sentCount: 0,
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

    const [curH, curM] = currentJstTime.split(":").map(Number);
    const curMinutes = (curH ?? 0) * 60 + (curM ?? 0);

    let eligibleCount = 0;
    let sentCount = 0;
    let skippedPracticedCount = 0;
    const notifiedIds: string[] = [];
    const expiredIds: string[] = [];

    for (const sub of subs) {
      // Skip if already notified today
      if (sub.last_notified_date === todayJst) {
        continue;
      }

      // Check reminder time match when time was not explicitly requested
      if (!requestedTime) {
        if (!sub.reminder_time || !isValidReminderTime(sub.reminder_time)) {
          continue;
        }
        const [subH, subM] = sub.reminder_time.split(":").map(Number);
        const subMinutes = (subH ?? 0) * 60 + (subM ?? 0);
        const diff = curMinutes - subMinutes;
        // Fire if scheduled time was reached within the last 30 minutes
        if (diff < 0 || diff > 30) {
          continue;
        }
      }

      // Smart habit skip: skip if user has already practiced today
      if (
        sub.smart_skip_if_practiced !== false &&
        sub.user_id &&
        practicedUserIds.has(sub.user_id)
      ) {
        skippedPracticedCount++;
        continue;
      }

      eligibleCount++;

      // Send real Web Push if HTTPS endpoint and valid keys exist
      if (
        sub.endpoint &&
        sub.endpoint.startsWith("https://") &&
        sub.p256dh &&
        sub.auth
      ) {
        try {
          const pushResult = await sendWebPushNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            {
              title: "🔥 ShadowLog 今日の1文シャドーイング",
              body: "まだ今日のシャドーイングが完了していません。1文だけ声に出してストリークを繋ぎましょう🎧",
              url: "/practice",
              tag: `shadowlog-reminder-${todayJst}`,
            }
          );

          if (pushResult.expired) {
            if (sub.id) expiredIds.push(sub.id);
            continue;
          }

          if (pushResult.success) {
            sentCount++;
            if (sub.id) notifiedIds.push(sub.id);
          }
        } catch (pushErr) {
          console.warn("Failed to dispatch push to endpoint:", pushErr);
        }
      } else if (sub.id) {
        // Fallback marker for local mock endpoints in tests
        notifiedIds.push(sub.id);
      }
    }

    // Deactivate expired push subscriptions
    if (expiredIds.length > 0) {
      await admin
        .from("push_subscriptions")
        .update({ enabled: false, updated_at: new Date().toISOString() })
        .in("id", expiredIds);
    }

    // Mark successfully notified subscriptions
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
      sentCount,
      skippedPracticedCount,
      expiredCount: expiredIds.length,
    });
  } catch (err) {
    console.warn("Reminder cron error:", err);
    return NextResponse.json({
      ok: true,
      todayJst,
      targetTime,
      eligibleCount: 0,
      sentCount: 0,
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
