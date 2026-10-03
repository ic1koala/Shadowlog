import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin-checker";

interface WaitlistSubscriber {
  id: string;
  email: string;
  status: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

// In-memory fallback store for serverless/development resilience
const memoryWaitlist = new Map<string, WaitlistSubscriber>();

function isSupabaseConfigured(): boolean {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return Boolean(
    url && key && !url.includes("placeholder-project") && !key.includes("placeholder")
  );
}

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://placeholder-project.supabase.co";

  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL || "ShadowLog 運営事務局 <onboarding@resend.dev>";

export async function POST(req: NextRequest) {
  try {
    let body: { email?: string; metadata?: Record<string, unknown> } = {};
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "無効なリクエストです（JSONの解析に失敗しました）。" },
        { status: 400 }
      );
    }

    const rawEmail = typeof body.email === "string" ? body.email.trim() : "";
    if (!rawEmail) {
      return NextResponse.json(
        { error: "メールアドレスを入力してください。" },
        { status: 400 }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(rawEmail)) {
      return NextResponse.json(
        { error: "有効なメールアドレス形式を入力してください。" },
        { status: 400 }
      );
    }

    const normalizedEmail = rawEmail.toLowerCase();
    const clientIp =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const metadata = {
      ...(body.metadata || {}),
      ip: clientIp,
      userAgent,
      registeredAt: new Date().toISOString(),
    };

    let isDuplicate = false;
    let savedSubscriber: WaitlistSubscriber | null = null;

    // 1. Supabase persistence
    if (isSupabaseConfigured()) {
      try {
        const supabase = getSupabaseAdmin();

        // Check if already registered
        const { data: existing } = await supabase
          .from("waitlist_subscribers")
          .select("id, email, status, metadata, created_at")
          .eq("email", normalizedEmail)
          .maybeSingle();

        if (existing) {
          isDuplicate = true;
          savedSubscriber = existing as WaitlistSubscriber;
        } else {
          const { data: inserted, error: insertError } = await supabase
            .from("waitlist_subscribers")
            .insert({
              email: normalizedEmail,
              status: "pending",
              metadata,
            })
            .select()
            .single();

          if (insertError) {
            if (insertError.code === "23505") {
              isDuplicate = true;
            } else {
              console.warn("Supabase waitlist insert error:", insertError.message);
            }
          } else if (inserted) {
            savedSubscriber = inserted as WaitlistSubscriber;
          }
        }
      } catch (dbErr) {
        console.warn("Supabase waitlist connection error, falling back to memory:", dbErr);
      }
    }

    // 2. Memory store sync
    if (memoryWaitlist.has(normalizedEmail)) {
      isDuplicate = true;
      if (!savedSubscriber) {
        savedSubscriber = memoryWaitlist.get(normalizedEmail)!;
      }
    } else {
      if (!savedSubscriber) {
        savedSubscriber = {
          id: `waitlist-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          email: normalizedEmail,
          status: "pending",
          metadata,
          created_at: new Date().toISOString(),
        };
      }
      memoryWaitlist.set(normalizedEmail, savedSubscriber);
    }

    // 3. Send confirmation / coupon email via Resend (Only for new subscribers)
    if (!isDuplicate) {
      try {
        const resend = getResendClient();
        if (resend) {
          const emailText = `ShadowLogのウェイティングリストにご登録いただき、誠にありがとうございます。

私たちは「気軽な価格で、生活に英語を発する機会を。」をテーマに、最新の音声AIを活用した次世代シャドーイング習慣化アプリを開発しています。

2026年11月の正式リリース日に、アプリのご案内とともに【14日間無料体験クーポンコード】をお届けいたします。

リリースまで楽しみにお待ちいただけますと幸いです。

──────────────────────
■ 特典内容: 正式リリース時 14日間無料体験クーポン
■ リリース予定: 2026年11月
──────────────────────
※本メールに心当たりがない場合や登録解除をご希望の場合は、本メールへご返信ください。
ShadowLog 開発チーム`;

          await resend.emails.send({
            from: FROM_EMAIL,
            to: normalizedEmail,
            subject: "【ShadowLog】事前登録ありがとうございます（14日間無料体験クーポン付き）",
            text: emailText,
          });
        } else {
          console.info(
            "[Waitlist] RESEND_API_KEY not configured. Skipping confirmation email to:",
            normalizedEmail
          );
        }
      } catch (emailErr) {
        console.warn("Resend email delivery failed:", emailErr);
      }
    }

    if (isDuplicate) {
      return NextResponse.json(
        {
          success: true,
          alreadyRegistered: true,
          message:
            "すでにご登録いただいております！11月のリリース時にクーポンをお届けしますので楽しみにお待ちください。",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        alreadyRegistered: false,
        message: "🎉 事前登録が完了しました！確認メールをお送りしました。",
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("POST /api/waitlist error:", error);
    return NextResponse.json(
      { error: "事前登録の処理中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  try {
    // Check if requester is admin
    let userIsAdmin = false;
    const mockAdminHeader = req.headers.get("x-mock-admin-email");
    if (mockAdminHeader && isAdminEmail(mockAdminHeader)) {
      userIsAdmin = true;
    }

    if (!userIsAdmin) {
      try {
        const supabase = await createServerSupabase();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email && isAdminEmail(user.email)) {
          userIsAdmin = true;
        }
      } catch {
        // Not authenticated or server supabase error
      }
    }

    let subscribers: WaitlistSubscriber[] = [];
    let count = 0;
    let profileCount = 0;
    const VIP_MAX_LIMIT = 20;

    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const [waitlistRes, profilesRes] = await Promise.all([
          supabaseAdmin
            .from("waitlist_subscribers")
            .select("id, email, status, metadata, created_at", { count: "exact" })
            .order("created_at", { ascending: false }),
          supabaseAdmin
            .from("profiles")
            .select("id", { count: "exact", head: true }),
        ]);

        if (!waitlistRes.error && waitlistRes.data) {
          subscribers = waitlistRes.data as WaitlistSubscriber[];
          count = waitlistRes.count ?? waitlistRes.data.length;
        } else {
          subscribers = Array.from(memoryWaitlist.values());
          count = subscribers.length;
        }

        if (!profilesRes.error && typeof profilesRes.count === "number") {
          profileCount = profilesRes.count;
        }
      } catch {
        subscribers = Array.from(memoryWaitlist.values());
        count = subscribers.length;
      }
    } else {
      subscribers = Array.from(memoryWaitlist.values());
      count = subscribers.length;
    }

    const vipCount = Math.min(VIP_MAX_LIMIT, Math.max(count + profileCount, count));
    const vipRemaining = Math.max(0, VIP_MAX_LIMIT - vipCount);

    // If admin, return full list + count; otherwise return count only for public/landing display
    if (userIsAdmin) {
      return NextResponse.json({
        count,
        vipLimit: VIP_MAX_LIMIT,
        vipCount,
        vipRemaining,
        subscribers,
        isAdmin: true,
      });
    }

    return NextResponse.json({
      count,
      vipLimit: VIP_MAX_LIMIT,
      vipCount,
      vipRemaining,
      isAdmin: false,
    });
  } catch (error) {
    console.error("GET /api/waitlist error:", error);
    return NextResponse.json(
      { error: "ウェイティングリストの取得に失敗しました。" },
      { status: 500 }
    );
  }
}
