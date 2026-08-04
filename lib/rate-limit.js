import { RateLimitError } from "@/lib/errors";

const buckets = new Map();

export function rateLimit({ key, limit = 10, windowMs = 60_000, cost = 1 }) {
  if (!key) return;
  const now = Date.now();
  const refillPerMs = limit / windowMs;

  let bucket = buckets.get(key);
  if (!bucket || now - bucket.timestamp >= windowMs) {
    bucket = { tokens: limit, timestamp: now };
  } else {
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

export function _resetRateLimit() {
  buckets.clear();
}