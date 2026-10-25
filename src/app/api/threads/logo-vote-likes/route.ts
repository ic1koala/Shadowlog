import { NextResponse } from "next/server";
import { getThreadsAccessToken } from "@/lib/threads/constants";

export const dynamic = "force-dynamic";

export interface CandidateLikeStatus {
  id: string;
  index: number;
  postId: string;
  permalink: string;
  likes: number;
  views: number;
}

const CANDIDATE_POSTS = [
  {
    id: "sparkle_wave",
    index: 1,
    postId: "18125115226928569",
    permalink: "https://www.threads.com/@shadowlog_official/post/DejfvQXD0Y5",
  },
  {
    id: "particle_converge",
    index: 2,
    postId: "17952989013294086",
    permalink: "https://www.threads.com/@shadowlog_official/post/DejfxOCDzs8",
  },
  {
    id: "blur_focus",
    index: 3,
    postId: "18228286369326794",
    permalink: "https://www.threads.com/@shadowlog_official/post/Dejfy_wj2aX",
  },
  {
    id: "blueprint_trace",
    index: 4,
    postId: "18089686892268410",
    permalink: "https://www.threads.com/@shadowlog_official/post/Dejf0wxj8H2",
  },
  {
    id: "dimensional_rise",
    index: 5,
    postId: "18123288508903351",
    permalink: "https://www.threads.com/@shadowlog_official/post/Dejf2mjj2F5",
  },
];

let cachedData: CandidateLikeStatus[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 20 * 1000; // 20 seconds cache

export async function GET() {
  const now = Date.now();
  if (cachedData && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json({ ok: true, candidates: cachedData, cached: true });
  }

  const token = getThreadsAccessToken();
  if (!token) {
    return NextResponse.json({
      ok: true,
      candidates: CANDIDATE_POSTS.map((c) => ({ ...c, likes: 0, views: 0 })),
    });
  }

  try {
    const results = await Promise.all(
      CANDIDATE_POSTS.map(async (c) => {
        try {
          const res = await fetch(
            `https://graph.threads.net/v1.0/${c.postId}/insights?metric=views,likes&access_token=${token}`,
            { next: { revalidate: 20 } }
          );
          if (!res.ok) {
            return { ...c, likes: 0, views: 0 };
          }
          const data = await res.json();
          let likes = 0;
          let views = 0;
          if (Array.isArray(data.data)) {
            data.data.forEach((metric: { name: string; values?: Array<{ value: number }> }) => {
              const val = metric.values?.[0]?.value || 0;
              if (metric.name === "likes") likes = val;
              if (metric.name === "views") views = val;
            });
          }
          return { ...c, likes, views };
        } catch {
          return { ...c, likes: 0, views: 0 };
        }
      })
    );

    cachedData = results;
    lastFetchTime = now;

    return NextResponse.json({ ok: true, candidates: results, cached: false });
  } catch (err: unknown) {
    console.error("[Logo Vote Likes API Error]:", err);
    return NextResponse.json(
      { ok: false, error: "データの取得に失敗しました。", candidates: CANDIDATE_POSTS.map((c) => ({ ...c, likes: 0, views: 0 })) },
      { status: 200 }
    );
  }
}
