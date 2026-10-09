import { NextRequest, NextResponse } from "next/server";
import { postToThreads, processQueue, enqueuePost } from "@/lib/threads/publisher";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { isAdminEmail } from "@/lib/auth/admin-checker";

export const dynamic = "force-dynamic";

async function isAuthorizedCronOrAdmin(req: NextRequest): Promise<boolean> {
  // Allow Vercel Cron
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  if (cronSecret && authHeader === `Bearer ${cronSecret}`) {
    return true;
  }
  // Vercel Cron sends x-vercel-cron header or User-Agent: vercel-cron
  const vercelCronHeader = req.headers.get("x-vercel-cron") || req.headers.get("user-agent");
  if (vercelCronHeader && (vercelCronHeader.includes("vercel-cron") || req.headers.has("x-vercel-cron"))) {
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

  // Allow localhost / internal environment calls
  const host = req.headers.get("host");
  if (host?.includes("localhost") || host?.includes("127.0.0.1")) {
    return true;
  }

  return false;
}

/**
 * Handles Threads publishing requests for Vercel Cron (GET).
 * Automatically processes any pending queue items whose scheduledAt <= NOW()
 */
export async function GET(req: NextRequest) {
  const authorized = await isAuthorizedCronOrAdmin(req);
  if (!authorized) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const res = await processQueue();
    return NextResponse.json({ ok: true, ...res });
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

/**
 * Handles manual Threads publishing requests (POST).
 */
export async function POST(req: NextRequest) {
  const authorized = await isAuthorizedCronOrAdmin(req);
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
  } catch (err: unknown) {
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
