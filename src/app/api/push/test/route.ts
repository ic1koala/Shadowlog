import { NextRequest, NextResponse } from "next/server";
import { sendWebPushNotification } from "@/lib/notifications/web-push-server";
import { checkRateLimit } from "@/lib/security/rate-limiter";

export const dynamic = "force-dynamic";

function isValidPushEndpoint(endpoint: unknown): endpoint is string {
  if (typeof endpoint !== "string" || !endpoint.trim()) return false;
  try {
    const parsed = new URL(endpoint.trim());
    if (parsed.protocol !== "https:") return false;
    const host = parsed.hostname.toLowerCase();
    if (
      host === "localhost" ||
      host === "127.0.0.1" ||
      host === "0.0.0.0" ||
      host === "[::1]" ||
      /^127\./.test(host) ||
      /^10\./.test(host) ||
      /^192\.168\./.test(host) ||
      /^169\.254\./.test(host) ||
      /^172\.(1[6-9]|2\d|3[0-1])\./.test(host)
    ) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

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
    if (!subscription || typeof subscription !== "object" || !isValidPushEndpoint(subscription.endpoint)) {
      return NextResponse.json(
        { error: "Valid HTTPS subscription endpoint is required" },
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
    console.error("Push Test Error:", err);
    return NextResponse.json({ ok: false, error: "テスト通知の送信に失敗しました。" }, { status: 500 });
  }
}
