/**
 * Lightweight in-memory token-bucket rate limiter for server actions.
 *
 * Guards the paid Gemini calls (quiz generation, cover-letter generation,
 * AI resume improvement, on-demand insight generation) against abuse.
 * State is per-server-instance and per-process — sufficient for a
 * single-instance Vercel deployment and for portfolio purposes; for a
 * multi-instance setup swap `buckets` for an Upstash/Redis backend.
 */
import { RateLimitError } from "@/lib/errors";

const buckets = new Map();

/**
 * Enforce a token-bucket limit keyed by an identifier (typically the Clerk
 * user id or a hashed IP for anonymous routes).
 *
 * @param {{ key: string, limit?: number, windowMs?: number, cost?: number }} cfg
 * @throws {RateLimitError} when the bucket is empty
 */
export function rateLimit({ key, limit = 10, windowMs = 60_000, cost = 1 }) {
  if (!key) return; // no key -> skip limiting (e.g. during local dev)
  const now = Date.now();
  const refillPerMs = limit / windowMs;

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.timestamp >= windowMs) {
    bucket = { tokens: limit, timestamp: now };
  } else {
    // Refill proportional to elapsed time, capped at `limit`.
    const elapsed = now - bucket.timestamp;
    bucket.tokens = Math.min(limit, bucket.tokens + elapsed * refillPerMs);
    bucket.timestamp = now;
  }

  if (bucket.tokens < cost) {
    const retryMs = Math.ceil(((cost - bucket.tokens) / refillPerMs) || 1000);
    buckets.set(key, bucket);
    throw new RateLimitError(
      `You've hit the limit for this action. Try again in about ${Math.max(
        1,
        Math.round(retryMs / 1000)
      )} second(s).`
    );
  }

  bucket.tokens -= cost;
  buckets.set(key, bucket);
}

/** Test helper — clears all buckets. */
export function _resetRateLimit() {
  buckets.clear();
}