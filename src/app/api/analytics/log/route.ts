import { NextRequest, NextResponse } from "next/server";

interface DailyMetrics {
  date: string; // YYYY-MM-DD
  pv: number;
  uuSet: Set<string>;
  paths: Record<string, number>;
  userTypes: Record<string, number>;
}

// In-memory analytics store for serverless resilience
const analyticsStore = new Map<string, DailyMetrics>();

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
    const metrics = getOrCreateDailyMetrics(today);

    // Record PV
    metrics.pv += 1;
    // Record UU
    metrics.uuSet.add(visitorKey);
    // Record Path count
    metrics.paths[path] = (metrics.paths[path] || 0) + 1;
    // Record User type
    metrics.userTypes[userType] = (metrics.userTypes[userType] || 0) + 1;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Analytics log error:", error);
    return NextResponse.json({ success: false }, { status: 200 });
  }
}

export async function GET() {
  try {
    const today = getTodayKey();
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

    // Top paths across all tracked days
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
    });
  } catch (error) {
    console.error("GET /api/analytics/log error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
