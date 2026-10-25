import { NextRequest, NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { isAdminEmail } from "@/lib/auth/admin-checker";
import { getQueue } from "@/lib/threads/publisher";
import { getThreadsUserId, getThreadsAccessToken } from "@/lib/threads/constants";

export const dynamic = "force-dynamic";

export interface ThreadsPostInsight {
  id: string;
  text: string;
  timestamp: string;
  permalink?: string;
  media_type?: string;
  views: number;
  likes: number;
  replies: number;
  reposts: number;
  quotes: number;
}

export interface ThreadsAccountInsights {
  viewsDaily: Array<{ date: string; value: number }>;
  totalViews: number;
  totalLikes: number;
  totalReplies: number;
  totalReposts: number;
  totalQuotes: number;
}

export interface ThreadsProfileInfo {
  id: string;
  username: string;
  threads_profile_picture_url?: string;
  threads_biography?: string;
}

export interface ThreadsPerformanceResponse {
  ok: boolean;
  profile: ThreadsProfileInfo;
  accountInsights: ThreadsAccountInsights;
  posts: ThreadsPostInsight[];
  queueSummary: {
    totalQueue: number;
    pendingCount: number;
    publishedCount: number;
    skippedCount: number;
    failedCount: number;
    nextScheduledPost?: {
      id: string;
      text: string;
      scheduledAt: string;
    } | null;
  };
  fetchedAt: string;
}

// In-memory cache for 15 seconds to prevent hitting Threads API rate limits
let cachedData: ThreadsPerformanceResponse | null = null;
let lastCacheTime = 0;
const CACHE_TTL_MS = 15 * 1000;

function getSupabaseAdmin() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_SUPABASE_URL ||
    process.env.SUPABASE_URL ||
    "https://placeholder-project.supabase.co";

  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    "placeholder-key";

  return createSupabaseClient(supabaseUrl, supabaseServiceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

async function isAuthorizedAdmin(req: NextRequest): Promise<boolean> {
  // Test mock
  if (process.env.NODE_ENV === "test") {
    const mockEmail = req.headers.get("x-mock-admin-email");
    if (mockEmail && isAdminEmail(mockEmail)) return true;
  }

  // 1. Quick-login admin header or query param (for mobile Safari & dashboard requests)
  const quickEmail =
    req.headers.get("x-admin-quick-email") || req.nextUrl.searchParams.get("quick_admin");
  if (quickEmail && isAdminEmail(quickEmail)) {
    return true;
  }

  // 2. Cron secret
  const authHeader = req.headers.get("authorization");
  const cronSecret =
    process.env.CRON_SECRET ||
    (process.env.NODE_ENV !== "production" ? "shadowlog_push_cron_secret_2026" : "");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

  // 3. Bearer user access token from Supabase client
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.replace("Bearer ", "").trim();
    try {
      const supabaseAdmin = getSupabaseAdmin();
      const { data: userData, error: userError } = await supabaseAdmin.auth.getUser(token);
      if (!userError && userData?.user?.email && isAdminEmail(userData.user.email)) {
        return true;
      }
    } catch {
      // ignore
    }
  }

  // 4. Session cookies via Server Supabase client
  try {
    const supabase = await createServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user?.email && isAdminEmail(user.email)) {
      return true;
    }
  } catch {
    // ignore
  }

  return false;
}

const NO_CACHE_HEADERS = {
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
  Pragma: "no-cache",
  Expires: "0",
};

export async function GET(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: NO_CACHE_HEADERS });
  }

  const { searchParams } = new URL(req.url);
  const forceRefresh = searchParams.get("refresh") === "true";

  const now = Date.now();
  if (!forceRefresh && cachedData && now - lastCacheTime < CACHE_TTL_MS) {
    return NextResponse.json(cachedData, { headers: NO_CACHE_HEADERS });
  }

  const userId = getThreadsUserId();
  const token = getThreadsAccessToken();

  if (!userId || !token) {
    return NextResponse.json(
      { error: "Threads API credentials not configured in environment" },
      { status: 500 }
    );
  }

  try {
    // 1. Fetch Profile Info
    const profilePromise = fetch(
      `https://graph.threads.net/v1.0/me?fields=id,username,threads_profile_picture_url,threads_biography&access_token=${token}`
    ).then((r) => r.json());

    // 2. Fetch Account-level Insights
    const accountInsightsPromise = fetch(
      `https://graph.threads.net/v1.0/${userId}/threads_insights?metric=views,likes,replies,reposts,quotes&access_token=${token}`
    ).then((r) => r.json());

    // 3. Fetch User's Published Threads (latest 25)
    const threadsListPromise = fetch(
      `https://graph.threads.net/v1.0/${userId}/threads?fields=id,text,timestamp,permalink,media_type&limit=25&access_token=${token}`
    ).then((r) => r.json());

    const [profileRes, accountInsightsRes, threadsListRes] = await Promise.all([
      profilePromise,
      accountInsightsPromise,
      threadsListPromise,
    ]);

    if (profileRes?.error) {
      console.warn("[Threads API Profile Error]:", profileRes.error);
    }
    if (accountInsightsRes?.error) {
      console.warn("[Threads API Insights Error]:", accountInsightsRes.error);
    }
    if (threadsListRes?.error) {
      console.warn("[Threads API List Error]:", threadsListRes.error);
    }

    const profile: ThreadsProfileInfo = {
      id: profileRes.id || userId,
      username: profileRes.username || "shadowlog_official",
      threads_profile_picture_url: profileRes.threads_profile_picture_url,
      threads_biography: profileRes.threads_biography,
    };

    // Parse Account Insights
    const accountInsights: ThreadsAccountInsights = {
      viewsDaily: [],
      totalViews: 0,
      totalLikes: 0,
      totalReplies: 0,
      totalReposts: 0,
      totalQuotes: 0,
    };

    if (Array.isArray(accountInsightsRes?.data)) {
      for (const item of accountInsightsRes.data) {
        if (item.name === "views" && Array.isArray(item.values)) {
          accountInsights.viewsDaily = item.values.map(
            (v: { end_time?: string; value: number }) => ({
              date: v.end_time ? v.end_time.split("T")[0] : "",
              value: Number(v.value || 0),
            })
          );
          accountInsights.totalViews = accountInsights.viewsDaily.reduce(
            (sum, d) => sum + d.value,
            0
          );
        } else if (item.name === "likes") {
          accountInsights.totalLikes = Number(item.total_value?.value || 0);
        } else if (item.name === "replies") {
          accountInsights.totalReplies = Number(item.total_value?.value || 0);
        } else if (item.name === "reposts") {
          accountInsights.totalReposts = Number(item.total_value?.value || 0);
        } else if (item.name === "quotes") {
          accountInsights.totalQuotes = Number(item.total_value?.value || 0);
        }
      }
    }

    // 4. Fetch Insights for each published post in parallel (with limit 20 to avoid rate limit)
    const rawPosts = Array.isArray(threadsListRes?.data) ? threadsListRes.data : [];
    const topPosts = rawPosts.slice(0, 20);

    const postInsightsPromises = topPosts.map(
      async (post: { id: string; text?: string; timestamp?: string; permalink?: string; media_type?: string }) => {
        try {
          const insRes = await fetch(
            `https://graph.threads.net/v1.0/${post.id}/insights?metric=views,likes,replies,reposts,quotes&access_token=${token}`
          );
          const insData = await insRes.json();

          const getMetricValue = (metricName: string) => {
            const m = insData?.data?.find((d: { name: string }) => d.name === metricName);
            return Number(m?.values?.[0]?.value || 0);
          };

          return {
            id: post.id,
            text: post.text || "",
            timestamp: post.timestamp || "",
            permalink: post.permalink,
            media_type: post.media_type,
            views: getMetricValue("views"),
            likes: getMetricValue("likes"),
            replies: getMetricValue("replies"),
            reposts: getMetricValue("reposts"),
            quotes: getMetricValue("quotes"),
          } as ThreadsPostInsight;
        } catch {
          return {
            id: post.id,
            text: post.text || "",
            timestamp: post.timestamp || "",
            permalink: post.permalink,
            media_type: post.media_type,
            views: 0,
            likes: 0,
            replies: 0,
            reposts: 0,
            quotes: 0,
          } as ThreadsPostInsight;
        }
      }
    );

    const posts = await Promise.all(postInsightsPromises);

    // Sum total views from all individual posts if account daily is incomplete
    const postsViewsSum = posts.reduce((sum, p) => sum + p.views, 0);
    if (accountInsights.totalViews < postsViewsSum) {
      accountInsights.totalViews = postsViewsSum;
    }

    // 5. Parse Queue Summary
    const queue = getQueue();
    const pendingList = queue
      .filter((q) => q.status === "pending")
      .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

    const queueSummary = {
      totalQueue: queue.length,
      pendingCount: pendingList.length,
      publishedCount: queue.filter((q) => q.status === "published").length,
      skippedCount: queue.filter((q) => q.status === "skipped").length,
      failedCount: queue.filter((q) => q.status === "failed").length,
      nextScheduledPost: pendingList[0]
        ? {
            id: pendingList[0].id,
            text: pendingList[0].text,
            scheduledAt: pendingList[0].scheduledAt,
          }
        : null,
    };

    const responsePayload: ThreadsPerformanceResponse = {
      ok: true,
      profile,
      accountInsights,
      posts,
      queueSummary,
      fetchedAt: new Date().toISOString(),
    };

    cachedData = responsePayload;
    lastCacheTime = now;

    return NextResponse.json(responsePayload, { headers: NO_CACHE_HEADERS });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Threads Performance API Error]:", errorMsg);
    return NextResponse.json({ error: errorMsg }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
