/**
 * Threads API Publisher & Queue Management Utility
 * ShadowLog Official Threads Integration
 */

import fs from "fs";
import path from "path";

const QUEUE_FILE = path.join(process.cwd(), ".threads-queue.json");

export interface QueueItem {
  id: string;
  text: string;
  scheduledAt: string; // ISO 8601 string
  status: "pending" | "published" | "failed";
  publishedAt?: string;
  postId?: string;
  error?: string;
}

/**
 * Publishes a text post directly to Threads using Meta Threads API.
 */
export async function postToThreads(text: string): Promise<{ success: boolean; id?: string; error?: string }> {
  const userId = process.env.THREADS_USER_ID || "me";
  const accessToken = process.env.THREADS_ACCESS_TOKEN;

  if (!accessToken) {
    return { success: false, error: "THREADS_ACCESS_TOKEN is not configured in .env.local" };
  }

  try {
    // 1. Create Media Container
    const createRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        media_type: "TEXT",
        text: text,
        access_token: accessToken,
      }),
    });

    const createData = await createRes.json();
    if (!createRes.ok || !createData.id) {
      return {
        success: false,
        error: createData.error?.message || `Failed to create thread container: ${JSON.stringify(createData)}`,
      };
    }

    const containerId = createData.id;

    // Small delay to ensure container readiness
    await new Promise((resolve) => setTimeout(resolve, 2000));

    // 2. Publish Container
    const publishRes = await fetch(`https://graph.threads.net/v1.0/${userId}/threads_publish`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        creation_id: containerId,
        access_token: accessToken,
      }),
    });

    const publishData = await publishRes.json();
    if (!publishRes.ok || !publishData.id) {
      return {
        success: false,
        error: publishData.error?.message || `Failed to publish thread: ${JSON.stringify(publishData)}`,
      };
    }

    return { success: true, id: publishData.id };
  } catch (err: any) {
    return { success: false, error: err?.message || String(err) };
  }
}

/**
 * Reads the current local Threads queue from .threads-queue.json
 */
export function getQueue(): QueueItem[] {
  if (!fs.existsSync(QUEUE_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(QUEUE_FILE, "utf-8");
    return JSON.parse(raw) as QueueItem[];
  } catch {
    return [];
  }
}

/**
 * Saves the queue array to .threads-queue.json
 */
export function saveQueue(queue: QueueItem[]): void {
  fs.writeFileSync(QUEUE_FILE, JSON.stringify(queue, null, 2), "utf-8");
}

/**
 * Adds a new post to the scheduled queue.
 */
export function enqueuePost(text: string, scheduledAt: string): QueueItem {
  const queue = getQueue();
  const newItem: QueueItem = {
    id: `queue_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    text,
    scheduledAt,
    status: "pending",
  };
  queue.push(newItem);
  saveQueue(queue);
  return newItem;
}

/**
 * Processes all pending items in the queue whose scheduledAt <= NOW()
 */
export async function processQueue(): Promise<{ processedCount: number; results: Array<{ id: string; success: boolean; error?: string }> }> {
  const queue = getQueue();
  const nowMs = Date.now();
  const results: Array<{ id: string; success: boolean; error?: string }> = [];
  let processedCount = 0;

  for (const item of queue) {
    const itemScheduledMs = new Date(item.scheduledAt).getTime();
    if (item.status === "pending" && itemScheduledMs <= nowMs) {
      processedCount++;
      console.log(`[Threads Publisher] Publishing queue item ${item.id} scheduled for ${item.scheduledAt}...`);
      const result = await postToThreads(item.text);

      if (result.success) {
        item.status = "published";
        item.publishedAt = new Date().toISOString();
        item.postId = result.id;
        results.push({ id: item.id, success: true });
        console.log(`[Threads Publisher] Successfully published post ID: ${result.id}`);
      } else {
        item.status = "failed";
        item.error = result.error;
        results.push({ id: item.id, success: false, error: result.error });
        console.error(`[Threads Publisher] Failed to publish post ${item.id}:`, result.error);
      }
    }
  }

  if (processedCount > 0) {
    saveQueue(queue);
  }

  return { processedCount, results };
}
