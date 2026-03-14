type HitBucket = {
  hits: number[];
};

type RateLimitResult =
  | { ok: true; remaining: number }
  | { ok: false; retryAfterMs: number };

function getStore(): Map<string, HitBucket> {
  const g = globalThis as unknown as { __uni_clases_rl?: Map<string, HitBucket> };
  if (!g.__uni_clases_rl) g.__uni_clases_rl = new Map();
  return g.__uni_clases_rl;
}

export function checkRateLimit(key: string, windowMs: number, maxHits: number): RateLimitResult {
  const now = Date.now();
  const store = getStore();
  const bucket = store.get(key) ?? { hits: [] };

  // Keep only hits inside the window.
  const from = now - windowMs;
  bucket.hits = bucket.hits.filter((t) => t > from);

  if (bucket.hits.length >= maxHits) {
    const oldest = bucket.hits[0] ?? now;
    const retryAfterMs = Math.max(0, oldest + windowMs - now);
    store.set(key, bucket);
    return { ok: false, retryAfterMs };
  }

  bucket.hits.push(now);
  store.set(key, bucket);
  return { ok: true, remaining: Math.max(0, maxHits - bucket.hits.length) };
}

