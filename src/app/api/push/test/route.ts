import { NextRequest, NextResponse } from "next/server";
import { sendWebPushNotification } from "@/lib/notifications/web-push-server";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, "push-test", 10, 60_000);
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Too many test requests. Please wait a minute." },
      {
        status: 429,
        headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
      }
    );
  }

  try {
    const body = await req.json().catch(() => ({}));
    const subscription = body.subscription;
    if (!subscription || typeof subscription !== "object" || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Valid subscription object with endpoint is required" },
        { status: 400 }
      );
    }

    const title =
      typeof body.title === "string" && body.title.trim()
        ? body.title.trim().slice(0, 100)
        : "🔥 ShadowLog リマインドテスト";
    const messageBody =
      typeof body.body === "string" && body.body.trim()
        ? body.body.trim().slice(0, 200)
        : "バックグラウンド通知はバッチリです！アプリを閉じていても指定時刻にお知らせします🎧";

    const result = await sendWebPushNotification(
      {
        endpoint: subscription.endpoint,
        keys: subscription.keys,
      },
      {
        title,
        body: messageBody,
        url: "/practice",
        tag: "shadowlog-test-notification",
      }
    );

    return NextResponse.json({
      ok: result.success,
      expired: result.expired,
      error: result.error,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Internal Server Error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
