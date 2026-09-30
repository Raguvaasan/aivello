/**
 * Shared helpers for the Vercel serverless functions in api/.
 *
 * Files under a leading-underscore folder are not deployed as routes by Vercel.
 *
 * The request/response types are declared locally instead of importing @vercel/node:
 * that package was only ever used for these two types, and it dragged ~15 known
 * vulnerabilities (undici, path-to-regexp, ...) into the dependency tree.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';

export interface ApiRequest extends IncomingMessage {
  query: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ApiResponse extends ServerResponse {
  status: (statusCode: number) => ApiResponse;
  json: (body: unknown) => ApiResponse;
  send: (body: string | Buffer) => ApiResponse;
}

const PRODUCTION_ORIGINS = ['https://aivello.vercel.app'];
const DEV_ORIGINS = ['http://localhost:3000', 'http://localhost:4173', 'http://localhost:5173'];
// Vercel preview deployments of this project: aivello-<hash>-<team>.vercel.app
const PREVIEW_ORIGIN = /^https:\/\/aivello-[a-z0-9-]+\.vercel\.app$/;

/**
 * Browsers always send Origin on cross-site POSTs, so an unknown origin is rejected.
 * A missing Origin (same-origin navigation, curl) is allowed through; the per-route
 * auth / rate limits are what actually bound abuse.
 */
export const isAllowedOrigin = (origin: string | undefined): boolean => {
  if (!origin) return true;
  if (PRODUCTION_ORIGINS.includes(origin) || PREVIEW_ORIGIN.test(origin)) return true;
  return process.env.VERCEL_ENV !== 'production' && DEV_ORIGINS.includes(origin);
};

/** Best-effort client IP for rate limiting (first hop of x-forwarded-for on Vercel). */
export const clientIp = (req: ApiRequest): string => {
  const forwarded = req.headers['x-forwarded-for'];
  const first = (Array.isArray(forwarded) ? forwarded[0] : forwarded)?.split(',')[0]?.trim();
  return first || req.socket?.remoteAddress || 'unknown';
};

/**
 * In-memory fixed-window rate limiter. Serverless instances are recycled and requests
 * may land on different instances, so this bounds abuse rather than eliminating it.
 * A durable store (Vercel KV / Upstash) is the follow-up if abuse is observed.
 */
export const createRateLimiter = (max: number, windowMs: number) => {
  const buckets = new Map<string, { count: number; resetAt: number }>();

  return (key: string): { allowed: boolean; retryAfterSec: number } => {
    const now = Date.now();

    // Drop expired buckets so the map cannot grow without bound on a warm instance.
    if (buckets.size > 1000) {
      for (const [k, bucket] of buckets) if (now >= bucket.resetAt) buckets.delete(k);
    }

    const bucket = buckets.get(key);
    if (!bucket || now >= bucket.resetAt) {
      buckets.set(key, { count: 1, resetAt: now + windowMs });
      return { allowed: true, retryAfterSec: 0 };
    }
    if (bucket.count >= max) {
      return { allowed: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) };
    }
    bucket.count += 1;
    return { allowed: true, retryAfterSec: 0 };
  };
};
