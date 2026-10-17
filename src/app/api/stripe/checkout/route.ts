import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/stripe-server";
import { checkRateLimit } from "@/lib/security/rate-limiter";

function resolveSafeOrigin(rawOrigin: string | null): string {
  const defaultOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!rawOrigin) return defaultOrigin;
  try {
    const parsed = new URL(rawOrigin);
    if (
      parsed.origin === process.env.NEXT_PUBLIC_APP_URL ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname.endsWith(".vercel.app") ||
      parsed.hostname.includes("shadowlog")
    ) {
      return parsed.origin;
    }
  } catch {
    // ignore invalid URL
  }
  return defaultOrigin;
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, {
      keyPrefix: "api:stripe-checkout",
      limit: 10,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "リクエスト回数の上限に達しました。しばらく時間をおいてから再試行してください。" },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { plan = "pro", email } = body as { plan?: "base" | "pro"; email?: string };

    const stripe = getStripeServer();

    const isBase = plan === "base";
    const unitAmount = isBase ? 500 : 1000;
    const productName = isBase
      ? "ShadowLog ベースプラン (月額)"
      : "ShadowLog Proプラン (月額)";
    const productDesc = isBase
      ? "短文シャドーイング（無制限）＆弱点カルテ"
      : "長文スピーチモード（60〜90語）＆業界別生成＆無制限練習";

    const origin = resolveSafeOrigin(req.headers.get("origin"));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      billing_address_collection: "auto",
      customer_email: email || undefined,
      line_items: [
        {
          price_data: {
            currency: "jpy",
            product_data: {
              name: productName,
              description: productDesc,
            },
            unit_amount: unitAmount,
            recurring: {
              interval: "month",
            },
          },
          quantity: 1,
        },
      ],
      mode: "subscription",
      success_url: `${origin}/practice?upgrade=success&plan=${plan}`,
      cancel_url: `${origin}/practice?upgrade=cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe Checkout Error:", error);
    const msg = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
