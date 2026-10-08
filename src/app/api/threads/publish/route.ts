import { NextRequest, NextResponse } from "next/server";
import { postToThreads, processQueue, enqueuePost } from "@/lib/threads/publisher";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin-checker";

export const dynamic = "force-dynamic";

async function isAuthorizedAdmin(req: NextRequest): Promise<boolean> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }

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

/**
 * Handles Threads publishing requests.
 * POST /api/threads/publish
 * Body: { text?: string, scheduledAt?: string, action?: 'immediate' | 'enqueue' | 'process-queue' }
 */
export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedAdmin(req);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { text, scheduledAt, action } = body;

    if (action === "process-queue") {
      const res = await processQueue();
      return NextResponse.json({ ok: true, ...res });
    }

    if (action === "enqueue" || scheduledAt) {
      if (!text) {
        return NextResponse.json({ error: "Text is required for enqueuing" }, { status: 400 });
      }
      const item = enqueuePost(text, scheduledAt || new Date().toISOString());
      return NextResponse.json({ ok: true, item });
    }

    // Default: publish immediately
    if (!text) {
      return NextResponse.json({ error: "Text is required for publishing" }, { status: 400 });
    }

    const res = await postToThreads(text);
    if (!res.success) {
      return NextResponse.json({ error: res.error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: res.id });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || String(err) }, { status: 500 });
  }
}
