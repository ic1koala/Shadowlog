import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/stripe-server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { plan = "pro", email } = body as { plan?: "base" | "pro"; email?: string };

    const stripe = getStripeServer();

    const isBase = plan === "base";
    const unitAmount = isBase ? 500 : 1480;
    const productName = isBase
      ? "ShadowLog ベースプラン (月額)"
      : "ShadowLog Proプラン (月額)";
    const productDesc = isBase
      ? "短文シャドーイング（1日30回まで）＆弱点カルテ"
      : "長文スピーチモード（60〜90語）＆業界別生成＆無制限練習";

    const origin = req.headers.get("origin") || "http://localhost:3000";

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
