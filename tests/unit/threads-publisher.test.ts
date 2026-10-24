import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import { processQueue, getQueue, QueueItem } from "../../src/lib/threads/publisher";

describe("threads-publisher processQueue with parent-child reply resolution", () => {
  const originalQueue = fs.readFileSync(".threads-queue.json", "utf-8");

  beforeEach(() => {
    vi.restoreAllMocks();
    process.env.THREADS_USER_ID = "123456789";
    process.env.THREADS_ACCESS_TOKEN = "mock_access_token";
  });

  afterEach(() => {
    fs.writeFileSync(".threads-queue.json", originalQueue, "utf-8");
  });

  it("resolves replyToId from parent item postId and connects child reply", async () => {
    const fetchMock = vi.fn();
    globalThis.fetch = fetchMock;

    let postCount = 0;
    fetchMock.mockImplementation(async (url: string, options: any) => {
      if (url.includes("/threads_publish")) {
        postCount++;
        return {
          ok: true,
          json: async () => ({ id: `threads_post_${postCount}` }),
        };
      }
      if (url.includes("/threads")) {
        // Container creation
        const bodyStr = options?.body?.toString() || "";
        return {
          ok: true,
          json: async () => ({ id: `container_${Date.now()}` }),
        };
      }
      return { ok: true, json: async () => ({}) };
    });

    const testQueue: QueueItem[] = [
      {
        id: "test_parent_1",
        text: "This is Parent Post",
        scheduledAt: new Date(Date.now() - 5000).toISOString(),
        status: "pending",
      },
      {
        id: "test_child_1",
        text: "This is Child Post",
        replyToId: "test_parent_1",
        scheduledAt: new Date(Date.now() - 4000).toISOString(),
        status: "pending",
      },
    ];

    fs.writeFileSync(".threads-queue.json", JSON.stringify(testQueue, null, 2), "utf-8");

    const result = await processQueue();
    expect(result.processedCount).toBe(2);
    expect(result.results.every((r) => r.success)).toBe(true);

    const updatedQueue = getQueue();
    const parent = updatedQueue.find((i) => i.id === "test_parent_1");
    const child = updatedQueue.find((i) => i.id === "test_child_1");

    expect(parent?.status).toBe("published");
    expect(parent?.postId).toBe("threads_post_1");
    expect(child?.status).toBe("published");
    expect(child?.postId).toBe("threads_post_2");
  }, 15000);
});
