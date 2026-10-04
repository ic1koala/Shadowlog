import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseAdmin } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isValidReminderTime } from "@/lib/notifications/push-manager";
import { checkRateLimit } from "@/lib/security/rate-limiter";

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

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, "push-subscribe", 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const endpoint =
      typeof body.endpoint === "string" ? body.endpoint.trim() : "";
    const reminderTime =
      typeof body.reminderTime === "string" &&
      isValidReminderTime(body.reminderTime)
        ? body.reminderTime
        : "21:00";
    const smartSkipIfPracticed =
      body.smartSkipIfPracticed !== undefined
        ? Boolean(body.smartSkipIfPracticed)
        : true;
    const p256dh =
      typeof body.keys?.p256dh === "string" ? body.keys.p256dh : null;
    const auth = typeof body.keys?.auth === "string" ? body.keys.auth : null;
    const userAgent =
      typeof body.userAgent === "string"
        ? body.userAgent.slice(0, 500)
        : null;

    if (!endpoint) {
      return NextResponse.json(
        { error: "Subscription endpoint is required" },
        { status: 400 }
      );
    }

    let userId: string | null = null;
    try {
      const serverSupabase = await createServerClient();
      const {
        data: { user },
      } = await serverSupabase.auth.getUser();
      userId = user?.id ?? null;
    } catch {
      // Guest user or offline environment
    }

    const admin = getAdminClient();
    if (!admin) {
      // Graceful fallback when Supabase service role key or table is not configured
      return NextResponse.json({
        ok: true,
        persisted: false,
        reminderTime,
        smartSkipIfPracticed,
      });
    }

    const { error } = await admin.from("push_subscriptions").upsert(
      {
        user_id: userId,
        endpoint,
        p256dh,
        auth,
        reminder_time: reminderTime,
        smart_skip_if_practiced: smartSkipIfPracticed,
        enabled: true,
        user_agent: userAgent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "endpoint" }
    );

    if (error) {
      // Graceful 200 fallback if table has not been migrated yet
      console.warn("push_subscriptions upsert fallback:", error.message);
      return NextResponse.json({
        ok: true,
        persisted: false,
        reminderTime,
        smartSkipIfPracticed,
      });
    }

    return NextResponse.json({
      ok: true,
      persisted: true,
      reminderTime,
      smartSkipIfPracticed,
    });
  } catch (err) {
    console.warn("POST /api/push/subscribe fallback:", err);
    return NextResponse.json({ ok: true, persisted: false });
  }
}

export async function DELETE(req: NextRequest) {
  const rateLimit = checkRateLimit(req, "push-subscribe", 20, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const endpoint =
      typeof body.endpoint === "string" ? body.endpoint.trim() : "";

    const admin = getAdminClient();
    if (!admin || !endpoint) {
      return NextResponse.json({ ok: true, disabled: true });
    }

    await admin
      .from("push_subscriptions")
      .update({ enabled: false, updated_at: new Date().toISOString() })
      .eq("endpoint", endpoint);

    return NextResponse.json({ ok: true, disabled: true });
  } catch {
    return NextResponse.json({ ok: true, disabled: true });
  }
}
