import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { GET } from "@/app/api/admin/threads-performance/route";

// Mock Supabase
vi.mock("@/lib/supabase/server", () => ({
  createClient: vi.fn().mockResolvedValue({
    auth: {
      getUser: vi.fn().mockResolvedValue({
        data: { user: { email: "shadowlog.app@gmail.com" } },
      }),
    },
  }),
}));

// Mock Threads publisher getQueue
vi.mock("@/lib/threads/publisher", () => ({
  getQueue: vi.fn().mockReturnValue([
    {
      id: "q1",
      text: "Test 1",
      scheduledAt: "2026-10-15T08:00:00+09:00",
      status: "pending",
    },
    {
      id: "q2",
      text: "Test 2",
      scheduledAt: "2026-10-14T12:30:00+09:00",
      status: "published",
    },
    {
      id: "q3",
      text: "Test 3",
      scheduledAt: "2026-10-11T08:00:00+09:00",
      status: "skipped",
    },
  ]),
}));

describe("GET /api/admin/threads-performance", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.THREADS_USER_ID = "test_user_id";
    process.env.THREADS_ACCESS_TOKEN = "test_token";

    // Mock fetch for Threads API calls
    global.fetch = vi.fn().mockImplementation((url: string) => {
      if (url.includes("/me?fields=")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            id: "test_user_id",
            username: "shadowlog_official",
            threads_profile_picture_url: "https://example.com/pic.jpg",
            threads_biography: "Official test bio",
          }),
        });
      }

      if (url.includes("/threads_insights?metric=")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [
              {
                name: "views",
                values: [
                  { end_time: "2026-10-12T07:00:00+0000", value: 163 },
                  { end_time: "2026-10-13T07:00:00+0000", value: 74 },
                ],
              },
              { name: "likes", total_value: { value: 5 } },
              { name: "replies", total_value: { value: 2 } },
              { name: "reposts", total_value: { value: 1 } },
              { name: "quotes", total_value: { value: 0 } },
            ],
          }),
        });
      }

      if (url.includes("/threads?fields=")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [
              {
                id: "post_1",
                text: "Post 1 text",
                timestamp: "2026-10-13T12:00:00+0000",
                permalink: "https://threads.com/@shadowlog/post/1",
                media_type: "TEXT_POST",
              },
            ],
          }),
        });
      }

      if (url.includes("/post_1/insights?metric=")) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: [
              { name: "views", values: [{ value: 42 }] },
              { name: "likes", values: [{ value: 3 }] },
              { name: "replies", values: [{ value: 1 }] },
              { name: "reposts", values: [{ value: 0 }] },
              { name: "quotes", values: [{ value: 0 }] },
            ],
          }),
        });
      }

      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      });
    }) as any;
  });

  it("returns 200 with structured profile, insights, posts, and queue data for admin", async () => {
    const req = new NextRequest("http://localhost:3000/api/admin/threads-performance?refresh=true");
    const res = await GET(req);

    expect(res.status).toBe(200);
    const json = await res.json();

    expect(json.ok).toBe(true);
    expect(json.profile.username).toBe("shadowlog_official");
    expect(json.accountInsights.totalViews).toBeGreaterThanOrEqual(237);
    expect(json.accountInsights.totalLikes).toBe(5);
    expect(json.accountInsights.totalReplies).toBe(2);
    expect(json.posts).toHaveLength(1);
    expect(json.posts[0].views).toBe(42);
    expect(json.posts[0].likes).toBe(3);

    // Queue summary checks
    expect(json.queueSummary.totalQueue).toBe(3);
    expect(json.queueSummary.pendingCount).toBe(1);
    expect(json.queueSummary.publishedCount).toBe(1);
    expect(json.queueSummary.skippedCount).toBe(1);
    expect(json.queueSummary.nextScheduledPost?.id).toBe("q1");
  });

  it("rejects unauthorized access", async () => {
    const { createClient } = await import("@/lib/supabase/server");
    vi.mocked(createClient).mockResolvedValueOnce({
      auth: {
        getUser: vi.fn().mockResolvedValue({
          data: { user: { email: "stranger@example.com" } },
        }),
      },
    } as any);

    const req = new NextRequest("http://localhost:3000/api/admin/threads-performance");
    const res = await GET(req);

    expect(res.status).toBe(401);
  });
});
