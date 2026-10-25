import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe/stripe-server";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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
      parsed.hostname === "shadowlog.app" ||
      parsed.hostname.endsWith(".shadowlog.app") ||
      parsed.hostname.endsWith(".vercel.app")
    ) {
      return parsed.origin;
    }
  } catch {
    // ignore
  }
  return defaultOrigin;
}

export async function POST(req: NextRequest) {
  try {
    const rateLimit = checkRateLimit(req, {
      keyPrefix: "api:stripe-portal",
      limit: 10,
      windowMs: 60_000,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "リクエスト回数の上限に達しました。しばらく時間をおいてから再試行してください。" },
        { status: 429 }
      );
    }

    const supabase = await createServerSupabase();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "カスタマーポータルを利用するにはログインが必要です。" },
        { status: 401 }
      );
    }

    const adminDb = getSupabaseAdmin();
    const { data: profile, error: profileError } = await adminDb
      .from("profiles")
      .select("stripe_customer_id, plan")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError || !profile?.stripe_customer_id) {
      return NextResponse.json(
        {
          error:
            "有効なお支払い情報が見つかりません。有料プランの決済が完了していないか、招待VIPアカウントのためカスタマーポータルの対象外です。",
        },
        { status: 400 }
      );
    }

    const stripe = getStripeServer();
    const origin = resolveSafeOrigin(req.headers.get("origin"));

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${origin}/settings`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: unknown) {
    console.error("Stripe Customer Portal Error:", error);
    return NextResponse.json(
      { error: "カスタマーポータルの起動中にエラーが発生しました。時間をおいて再度お試しください。" },
      { status: 500 }
    );
  }
}
