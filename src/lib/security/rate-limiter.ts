import { NextRequest } from "next/server";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export interface RateLimitOptions {
  /** Unique namespace for the endpoint (e.g., "tts", "transcribe-diff") */
  namespace: string;
  /** Maximum number of requests allowed within windowMs */
  maxRequests: number;
  /** Window duration in milliseconds (default: 60_000 = 1 minute) */
  windowMs?: number;
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Extracts client IP from request headers for rate limiting.
 */
export function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }
  return req.headers.get("x-real-ip")?.trim() || "local";
}

/**
 * In-memory sliding-window rate limiter per IP + endpoint namespace.
 * Automatically bypassed in test environment (NODE_ENV === "test") to keep test suites deterministic.
 */
export function checkRateLimit(
  req: NextRequest,
  optionsOrNamespace: RateLimitOptions | string,
  maxRequestsArg?: number,
  windowMsArg?: number
): RateLimitResult {
  const options: RateLimitOptions =
    typeof optionsOrNamespace === "string"
      ? {
          namespace: optionsOrNamespace,
          maxRequests: maxRequestsArg ?? 20,
          windowMs: windowMsArg ?? 60_000,
        }
      : optionsOrNamespace;

  if (process.env.NODE_ENV === "test") {
    return {
      allowed: true,
      remaining: options.maxRequests,
      retryAfterSeconds: 0,
    };
  }

  const windowMs = options.windowMs ?? 60_000;
  const now = Date.now();
  const ip = getClientIp(req);
  const key = `${options.namespace}:${ip}`;

  // Periodic cleanup of expired buckets to prevent unbounded memory growth
  if (buckets.size > 2000) {
    buckets.forEach((val, k) => {
      if (val.resetAt <= now) {
        buckets.delete(k);
      }
    });
  }

  const existing = buckets.get(key);
  if (!existing || existing.resetAt <= now) {
    buckets.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: Math.max(0, options.maxRequests - 1),
      retryAfterSeconds: 0,
    };
  }

  if (existing.count >= options.maxRequests) {
    const retryAfterSeconds = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      retryAfterSeconds,
    };
  }

  existing.count += 1;
  return {
    allowed: true,
    remaining: Math.max(0, options.maxRequests - existing.count),
    retryAfterSeconds: 0,
  };
}
