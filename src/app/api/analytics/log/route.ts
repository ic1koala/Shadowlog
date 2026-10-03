import { NextRequest, NextResponse } from "next/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient as createServerSupabase } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin-checker";

interface DailyMetrics {
  date: string; // YYYY-MM-DD
  pv: number;
  uuSet: Set<string>;
  paths: Record<string, number>;
  userTypes: Record<string, number>;
}

// In-memory analytics store for serverless resilience and fallback
const analyticsStore = new Map<string, DailyMetrics>();

function isSupabaseConfigured(): boolean {
  const url =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "";
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "";
  return Boolean(url && key && !url.includes("placeholder-project") && !key.includes("placeholder"));
}

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://placeholder-project.supabase.co";

  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getTodayKey(): string {
  const now = new Date();
  const jstOffset = 9 * 60; // JST (UTC+9)
  const jstDate = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);
  const year = jstDate.getFullYear();
  const month = String(jstDate.getMonth() + 1).padStart(2, "0");
  const day = String(jstDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getOrCreateDailyMetrics(dateKey: string): DailyMetrics {
  let record = analyticsStore.get(dateKey);
  if (!record) {
    record = {
      date: dateKey,
      pv: 0,
      uuSet: new Set<string>(),
      paths: {},
      userTypes: {},
    };
    analyticsStore.set(dateKey, record);
  }
  return record;
}

export async function POST(req: NextRequest) {
  try {
    let body: { path?: string; referrer?: string; userType?: string; visitorId?: string } = {};
    try {
      body = await req.json();
    } catch {
      // ignore JSON parse error, allow beacon text
    }

    const path = typeof body.path === "string" ? body.path.split("?")[0] : "/";
    const userType = typeof body.userType === "string" ? body.userType : "guest";

    // Derive visitor identifier from client-generated visitorId, or ip/user-agent
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const userAgent = req.headers.get("user-agent") || "";
    const visitorKey = body.visitorId || `${ip}_${userAgent.slice(0, 30)}`;

    const today = getTodayKey();

    // 1. Always record into in-memory store for fallback & serverless resilience
    const metrics = getOrCreateDailyMetrics(today);
    metrics.pv += 1;
    metrics.uuSet.add(visitorKey);
    metrics.paths[path] = (metrics.paths[path] || 0) + 1;
    metrics.userTypes[userType] = (metrics.userTypes[userType] || 0) + 1;

    // 2. Persist to Supabase daily_analytics table if configured
    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data: existing, error: fetchErr } = await supabaseAdmin
          .from("daily_analytics")
          .select("pv, uu_count, visitors, paths, user_types")
          .eq("date", today)
          .maybeSingle();

        if (!fetchErr && existing) {
          const currentVisitors: string[] = Array.isArray(existing.visitors)
            ? [...existing.visitors]
            : [];
          if (!currentVisitors.includes(visitorKey)) {
            currentVisitors.push(visitorKey);
          }

          const currentPaths: Record<string, number> =
            existing.paths && typeof existing.paths === "object"
              ? { ...(existing.paths as Record<string, number>) }
              : {};
          currentPaths[path] = (currentPaths[path] || 0) + 1;

          const currentUserTypes: Record<string, number> =
            existing.user_types && typeof existing.user_types === "object"
              ? { ...(existing.user_types as Record<string, number>) }
              : {};
          currentUserTypes[userType] = (currentUserTypes[userType] || 0) + 1;

          const updatedPv = (existing.pv || 0) + 1;
          const updatedUu = currentVisitors.length;

          const { error: updateErr } = await supabaseAdmin
            .from("daily_analytics")
            .update({
              pv: updatedPv,
              uu_count: updatedUu,
              visitors: currentVisitors,
              paths: currentPaths,
              user_types: currentUserTypes,
              updated_at: new Date().toISOString(),
            })
            .eq("date", today);

          if (updateErr) {
            console.warn("Supabase daily_analytics update error:", updateErr.message);
          }
        } else {
          // Record does not exist yet for today, insert new row
          const { error: insertErr } = await supabaseAdmin
            .from("daily_analytics")
            .insert({
              date: today,
              pv: 1,
              uu_count: 1,
              visitors: [visitorKey],
              paths: { [path]: 1 },
              user_types: { [userType]: 1 },
              updated_at: new Date().toISOString(),
            });

          if (insertErr) {
            // If concurrent insert occurred, try upsert
            const { error: upsertErr } = await supabaseAdmin
              .from("daily_analytics")
              .upsert({
                date: today,
                pv: metrics.pv,
                uu_count: metrics.uuSet.size,
                visitors: Array.from(metrics.uuSet),
                paths: metrics.paths,
                user_types: metrics.userTypes,
                updated_at: new Date().toISOString(),
              });
            if (upsertErr) {
              console.warn("Supabase daily_analytics insert/upsert error:", upsertErr.message);
            }
          }
        }
      } catch (supabaseErr) {
        console.warn("Supabase persistence failed, safely fell back to memory:", supabaseErr);
      }
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Analytics log error:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

export async function GET() {
  try {
    if (process.env.NODE_ENV !== "test") {
      let authorized = false;
      try {
        const supabase = await createServerSupabase();
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (user?.email && isAdminEmail(user.email)) {
          authorized = true;
        }
      } catch {}
      if (!authorized) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const today = getTodayKey();

    // 1. Attempt to fetch from Supabase daily_analytics if configured
    if (isSupabaseConfigured()) {
      try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
          .from("daily_analytics")
          .select("date, pv, uu_count, visitors, paths, user_types")
          .order("date", { ascending: false })
          .limit(30);

        if (!error && data && data.length > 0) {
          const dbMap = new Map<string, {
            date: string;
            pv: number;
            uu_count: number;
            visitors: string[];
            paths: Record<string, number>;
            user_types: Record<string, number>;
          }>();

          data.forEach((row) => {
            dbMap.set(row.date, row);
          });

          // Prepare past 14 days summary
          const past14Days: { date: string; pv: number; uu: number }[] = [];
          const now = new Date();
          const jstOffset = 9 * 60;
          const jstNow = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);

          for (let i = 13; i >= 0; i--) {
            const d = new Date(jstNow);
            d.setDate(jstNow.getDate() - i);
            const y = d.getFullYear();
            const m = String(d.getMonth() + 1).padStart(2, "0");
            const day = String(d.getDate()).padStart(2, "0");
            const key = `${y}-${m}-${day}`;
            const rec = dbMap.get(key);
            past14Days.push({
              date: `${m}/${day}`,
              pv: rec?.pv || 0,
              uu: rec?.uu_count || (Array.isArray(rec?.visitors) ? rec.visitors.length : 0),
            });
          }

          // Top paths and user types across all tracked days in DB
          const totalPathCounts: Record<string, number> = {};
          const totalUserTypes: Record<string, number> = {};

          data.forEach((rec) => {
            if (rec.paths && typeof rec.paths === "object") {
              Object.entries(rec.paths).forEach(([p, count]) => {
                totalPathCounts[p] = (totalPathCounts[p] || 0) + (typeof count === "number" ? count : 0);
              });
            }
            if (rec.user_types && typeof rec.user_types === "object") {
              Object.entries(rec.user_types).forEach(([u, count]) => {
                totalUserTypes[u] = (totalUserTypes[u] || 0) + (typeof count === "number" ? count : 0);
              });
            }
          });

          const pathRanking = Object.entries(totalPathCounts)
            .map(([path, count]) => ({ path, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

          const todayRecord = dbMap.get(today);

          return NextResponse.json({
            today: {
              date: today,
              pv: todayRecord?.pv || 0,
              uu: todayRecord?.uu_count || (Array.isArray(todayRecord?.visitors) ? todayRecord.visitors.length : 0),
            },
            past14Days,
            pathRanking,
            userTypes: totalUserTypes,
            totalPv: Object.values(totalPathCounts).reduce((sum, n) => sum + n, 0),
            source: "supabase",
          });
        }
      } catch (supabaseErr) {
        console.warn("Supabase GET analytics failed, falling back to in-memory:", supabaseErr);
      }
    }

    // 2. Fallback to in-memory analytics store
    const todayRecord = getOrCreateDailyMetrics(today);

    // Prepare past 14 days summary
    const past14Days: { date: string; pv: number; uu: number }[] = [];
    const now = new Date();
    const jstOffset = 9 * 60;
    const jstNow = new Date(now.getTime() + (jstOffset + now.getTimezoneOffset()) * 60000);

    for (let i = 13; i >= 0; i--) {
      const d = new Date(jstNow);
      d.setDate(jstNow.getDate() - i);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      const key = `${y}-${m}-${day}`;
      const rec = analyticsStore.get(key);
      past14Days.push({
        date: `${m}/${day}`,
        pv: rec?.pv || 0,
        uu: rec?.uuSet.size || 0,
      });
    }

    // Top paths across all tracked days in memory
    const totalPathCounts: Record<string, number> = {};
    const totalUserTypes: Record<string, number> = {};

    analyticsStore.forEach((rec) => {
      Object.entries(rec.paths).forEach(([p, count]) => {
        totalPathCounts[p] = (totalPathCounts[p] || 0) + count;
      });
      Object.entries(rec.userTypes).forEach(([u, count]) => {
        totalUserTypes[u] = (totalUserTypes[u] || 0) + count;
      });
    });

    const pathRanking = Object.entries(totalPathCounts)
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return NextResponse.json({
      today: {
        date: today,
        pv: todayRecord.pv,
        uu: todayRecord.uuSet.size,
      },
      past14Days,
      pathRanking,
      userTypes: totalUserTypes,
      totalPv: Object.values(totalPathCounts).reduce((sum, n) => sum + n, 0),
      source: "memory",
    });
  } catch (error) {
    console.error("GET /api/analytics/log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
