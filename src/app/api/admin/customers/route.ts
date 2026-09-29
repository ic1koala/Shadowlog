import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin-checker";
import { getVipType, VipType } from "@/lib/auth/vip-checker";

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

export interface CustomerSummary {
  id: string;
  email: string;
  plan: "free" | "base" | "pro";
  vip_type?: VipType;
  created_at: string;
  tickets_used: number;
  pro_trials_used: number;
  practice_count: number;
  last_practiced_at: string | null;
  today_practice_count: number;
  active_days: number;
  daily_average_practice: number;
  projected_monthly_practices: number;
  projected_monthly_cost: number;
  breakeven_daily_limit: number;
  cost_risk_status: "safe" | "warning" | "danger" | "free";
}

export interface AdminCustomerResponse {
  customers: CustomerSummary[];
  kpi: {
    totalCustomers: number;
    newCustomersThisWeek: number;
    totalPracticeSessions: number;
    paidOrProCount: number;
    proPlanCount: number;
    basePlanCount: number;
    freePlanCount: number;
    overallDailyAverage: number;
    topUserDailyCount: number;
    warningAccountCount: number;
    waitlistCount?: number;
  };
}

export async function GET(req: NextRequest) {
  try {
    // 1. Authenticate Request
    let requesterEmail: string | null = null;

    // Check for test override (enabled in test environment only)
    if (process.env.NODE_ENV === "test") {
      const mockEmail = req.headers.get("x-mock-admin-email");
      if (mockEmail) {
        requesterEmail = mockEmail;
      }
    }

    // Check Authorization header for Bearer token if provided
    const authHeader = req.headers.get("authorization");
    if (!requesterEmail && authHeader && authHeader.startsWith("Bearer ")) {
      const token = authHeader.replace("Bearer ", "").trim();
      const supabaseAdmin = getSupabaseAdmin();
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (!userError && userData?.user?.email) {
        requesterEmail = userData.user.email;
      }
    }

    // Check session cookies via Server Supabase client
    if (!requesterEmail) {
      try {
        const supabase = await createServerSupabase();
        const { data: { user }, error: sessionError } = await supabase.auth.getUser();
        if (!sessionError && user?.email) {
          requesterEmail = user.email;
        }
      } catch (e) {
        // Cookie parsing or session error
        console.warn("[Admin API] Failed to retrieve session from cookies:", e);
      }
    }

    // 2. Authorize requester as Admin
    if (!requesterEmail || !isAdminEmail(requesterEmail)) {
      return NextResponse.json(
        { error: "Forbidden: 管理者権限が必要です。" },
        { status: 403 }
      );
    }

    // 3. Fetch Data using Supabase Admin
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, plan, created_at, updated_at")
      .order("created_at", { ascending: false });

    if (profilesError) {
      console.error("[Admin API] Error fetching profiles:", profilesError);
    }

    // Fetch user tickets
    const { data: tickets, error: ticketsError } = await supabaseAdmin
      .from("user_tickets")
      .select("user_id, tickets_used, pro_trials_used, daily_practice_count, last_practice_date");

    if (ticketsError) {
      console.error("[Admin API] Error fetching user_tickets:", ticketsError);
    }

    // Fetch practice sessions
    const { data: sessions, error: sessionsError } = await supabaseAdmin
      .from("practice_sessions")
      .select("id, user_id, created_at")
      .order("created_at", { ascending: false });

    if (sessionsError) {
      console.error("[Admin API] Error fetching practice_sessions:", sessionsError);
    }

    // Attempt to list auth users to capture anyone not yet in profiles table
    let authUsers: Array<{ id: string; email?: string; created_at: string }> = [];
    try {
      const { data: authData } = await supabaseAdmin.auth.admin.listUsers({ perPage: 1000 });
      if (authData?.users) {
        authUsers = authData.users;
      }
    } catch {
      // Ignored if service role key lacks permissions or placeholder
    }

    // Build Lookups
    const ticketMap = new Map<string, { tickets_used: number; pro_trials_used: number }>();
    (tickets || []).forEach((t) => {
      ticketMap.set(t.user_id, {
        tickets_used: t.tickets_used ?? 0,
        pro_trials_used: t.pro_trials_used ?? 0,
      });
    });

    // Helper to format ISO date string to JST YYYY-MM-DD
    function getJSTDateString(dateInput: Date | string): string {
      const d = typeof dateInput === "string" ? new Date(dateInput) : dateInput;
      return new Intl.DateTimeFormat("en-CA", {
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      }).format(d);
    }

    const todayJST = getJSTDateString(new Date());

    interface UserSessionStats {
      count: number;
      lastPracticedAt: string | null;
      todayCount: number;
      dateSet: Set<string>;
    }

    const sessionStatsMap = new Map<string, UserSessionStats>();
    let totalPracticeSessions = 0;
    (sessions || []).forEach((s) => {
      totalPracticeSessions++;
      if (!s.user_id) return;
      const current = sessionStatsMap.get(s.user_id) || {
        count: 0,
        lastPracticedAt: null,
        todayCount: 0,
        dateSet: new Set<string>(),
      };
      current.count += 1;
      if (!current.lastPracticedAt || new Date(s.created_at) > new Date(current.lastPracticedAt)) {
        current.lastPracticedAt = s.created_at;
      }
      const sessionJSTDate = getJSTDateString(s.created_at);
      current.dateSet.add(sessionJSTDate);
      if (sessionJSTDate === todayJST) {
        current.todayCount += 1;
      }
      sessionStatsMap.set(s.user_id, current);
    });

    function calculateUsageAndRisk(
      plan: "free" | "base" | "pro",
      practiceCount: number,
      todayCount: number,
      uniqueDaysCount: number
    ) {
      const active_days = Math.max(1, uniqueDaysCount);
      const daily_average_practice =
        practiceCount > 0
          ? Math.round((practiceCount / active_days) * 10) / 10
          : 0;
      const projected_monthly_practices = Math.round(daily_average_practice * 30);
      const projected_monthly_cost = Math.round(projected_monthly_practices * 0.322);

      let breakeven_daily_limit = 0;
      let cost_risk_status: "safe" | "warning" | "danger" | "free" = "free";

      if (plan === "pro") {
        breakeven_daily_limit = 147;
        const ratio = daily_average_practice / breakeven_daily_limit;
        if (ratio >= 0.8) {
          cost_risk_status = "danger";
        } else if (ratio >= 0.5) {
          cost_risk_status = "warning";
        } else {
          cost_risk_status = "safe";
        }
      } else if (plan === "base") {
        breakeven_daily_limit = 50;
        const ratio = daily_average_practice / breakeven_daily_limit;
        if (ratio >= 0.8) {
          cost_risk_status = "danger";
        } else if (ratio >= 0.5) {
          cost_risk_status = "warning";
        } else {
          cost_risk_status = "safe";
        }
      } else {
        breakeven_daily_limit = 0;
        cost_risk_status = "free";
      }

      return {
        today_practice_count: todayCount,
        active_days,
        daily_average_practice,
        projected_monthly_practices,
        projected_monthly_cost,
        breakeven_daily_limit,
        cost_risk_status,
      };
    }

    // Merge profiles and authUsers
    const userMap = new Map<string, CustomerSummary>();

    // 1. Process profiles table records
    (profiles || []).forEach((p) => {
      const t = ticketMap.get(p.id);
      const s = sessionStatsMap.get(p.id);
      const vipType = getVipType({
        email: p.email,
        registeredAt: p.created_at,
      });
      const planVal: "free" | "base" | "pro" =
        p.plan === "pro" || p.plan === "base" ? p.plan : "free";
      const effectivePlan = isAdminEmail(p.email) ? "pro" : planVal;
      const metrics = calculateUsageAndRisk(
        effectivePlan,
        s?.count ?? 0,
        s?.todayCount ?? 0,
        s?.dateSet.size ?? 0
      );

      userMap.set(p.id, {
        id: p.id,
        email: p.email || "(メールアドレス未設定)",
        plan: effectivePlan,
        vip_type: vipType,
        created_at: p.created_at || new Date().toISOString(),
        tickets_used: t?.tickets_used ?? 0,
        pro_trials_used: t?.pro_trials_used ?? 0,
        practice_count: s?.count ?? 0,
        last_practiced_at: s?.lastPracticedAt ?? null,
        ...metrics,
      });
    });

    // 2. Include any auth users missing from profiles
    authUsers.forEach((u) => {
      if (!userMap.has(u.id)) {
        const t = ticketMap.get(u.id);
        const s = sessionStatsMap.get(u.id);
        const email = u.email || "(メールアドレス未設定)";
        const vipType = getVipType({
          email,
          registeredAt: u.created_at,
        });
        const isVip = vipType !== null;
        const effectivePlan = isAdminEmail(email) || isVip ? "pro" : "free";
        const metrics = calculateUsageAndRisk(
          effectivePlan,
          s?.count ?? 0,
          s?.todayCount ?? 0,
          s?.dateSet.size ?? 0
        );

        userMap.set(u.id, {
          id: u.id,
          email,
          plan: effectivePlan,
          vip_type: vipType,
          created_at: u.created_at || new Date().toISOString(),
          tickets_used: t?.tickets_used ?? 0,
          pro_trials_used: t?.pro_trials_used ?? 0,
          practice_count: s?.count ?? 0,
          last_practiced_at: s?.lastPracticedAt ?? null,
          ...metrics,
        });
      }
    });

    const customers = Array.from(userMap.values()).sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    // 4. Calculate KPIs
    const oneWeekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const totalCustomers = customers.length;
    const newCustomersThisWeek = customers.filter(
      (c) => new Date(c.created_at) >= oneWeekAgo
    ).length;
    const paidOrProCount = customers.filter(
      (c) => c.plan === "pro" || c.plan === "base"
    ).length;
    const proPlanCount = customers.filter((c) => c.plan === "pro").length;
    const basePlanCount = customers.filter((c) => c.plan === "base").length;
    const freePlanCount = customers.filter((c) => c.plan === "free").length;

    const activeUsers = customers.filter((c) => c.practice_count > 0);
    const overallDailyAverage =
      activeUsers.length > 0
        ? Math.round(
            (activeUsers.reduce((sum, c) => sum + c.daily_average_practice, 0) /
              activeUsers.length) *
              10
          ) / 10
        : 0;

    const topUserDailyCount =
      customers.length > 0
        ? Math.max(...customers.map((c) => c.daily_average_practice), 0)
        : 0;

    const warningAccountCount = customers.filter(
      (c) => c.cost_risk_status === "warning" || c.cost_risk_status === "danger"
    ).length;

    // Fetch waitlist subscribers count
    let waitlistCount = 0;
    try {
      const { count: wCount, data: wData, error: wError } = await supabaseAdmin
        .from("waitlist_subscribers")
        .select("id", { count: "exact" });
      if (!wError) {
        waitlistCount =
          typeof wCount === "number"
            ? wCount
            : Array.isArray(wData)
            ? wData.length
            : 0;
      }
    } catch {
      // Ignored if waitlist table is not yet created
    }

    const responseData: AdminCustomerResponse = {
      customers,
      kpi: {
        totalCustomers,
        newCustomersThisWeek,
        totalPracticeSessions,
        paidOrProCount,
        proPlanCount,
        basePlanCount,
        freePlanCount,
        overallDailyAverage,
        topUserDailyCount,
        warningAccountCount,
        waitlistCount,
      },
    };

    return NextResponse.json(responseData, { status: 200 });
  } catch (error) {
    console.error("[Admin API] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
