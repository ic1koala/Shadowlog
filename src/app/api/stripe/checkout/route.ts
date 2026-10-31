import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/stripe-server";
import { checkRateLimit } from "@/lib/security/rate-limiter";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

function resolveSafeOrigin(rawOrigin: string | null): string {
  const defaultOrigin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  if (!rawOrigin) return defaultOrigin;
  try {
    const parsed = new URL(rawOrigin);
    if (
      parsed.origin === process.env.NEXT_PUBLIC_APP_URL ||
      parsed.hostname === "localhost" ||
      parsed.hostname === "127.0.0.1" ||
      parsed.hostname === "shadowlog.app" ||
      parsed.hostname.endsWith(".shadowlog.app") ||
      parsed.hostname.endsWith(".vercel.app")
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
    const { plan = "pro", email: bodyEmail } = body as { plan?: "base" | "pro"; email?: string };

    // 1. Identify logged-in user if available
    let userId: string | null = null;
    let userEmail: string | null = bodyEmail || null;
    let existingCustomerId: string | null = null;

    try {
      const supabase = await createServerSupabase();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        userId = user.id;
        userEmail = user.email || bodyEmail || null;

        // Check if customer ID already exists in profiles
        const adminDb = getSupabaseAdmin();
        const { data: profile } = await adminDb
          .from("profiles")
          .select("stripe_customer_id")
          .eq("id", user.id)
          .maybeSingle();

        if (profile?.stripe_customer_id) {
          existingCustomerId = profile.stripe_customer_id;
        }
      }
    } catch (authErr) {
      console.warn("Failed to retrieve auth user in stripe-checkout:", authErr);
    }

    const stripe = getStripeServer();

    const safePlan: "base" | "pro" = plan === "base" ? "base" : "pro";
    const isBase = safePlan === "base";
    const unitAmount = isBase ? 500 : 1000;
    const productName = isBase
      ? "ShadowLog ベースプラン (月額)"
      : "ShadowLog Proプラン (月額)";
    const productDesc = isBase
      ? "短文シャドーイング（完全無制限）＆弱点カルテ"
      : "長文スピーチモード（60〜90語）＆業界別生成＆完全無制限練習";

    const origin = resolveSafeOrigin(req.headers.get("origin"));

    // Build session params
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sessionParams: any = {
      payment_method_types: ["card"],
      managed_payments: { enabled: false },
      billing_address_collection: "auto",
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
      allow_promotion_codes: true,
      success_url: `${origin}/practice?upgrade=success&plan=${safePlan}`,
      cancel_url: `${origin}/settings?upgrade=cancel`,
      metadata: {
        userId: userId || "",
        plan: safePlan,
      },
      subscription_data: {
        metadata: {
          userId: userId || "",
          plan: safePlan,
        },
      },
    };

    if (existingCustomerId) {
      sessionParams.customer = existingCustomerId;
    } else if (userEmail) {
      sessionParams.customer_email = userEmail;
    }

    if (userId) {
      sessionParams.client_reference_id = userId;
    }

    const session = await stripe.checkout.sessions.create(sessionParams);

    return NextResponse.json({ url: session.url });
  } catch (error: unknown) {
    console.error("Stripe Checkout Error:", error);
    return NextResponse.json(
      { error: "決済セッションの作成中にエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
