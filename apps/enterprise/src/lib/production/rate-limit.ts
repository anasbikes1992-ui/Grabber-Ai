type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, max: number, windowMs: number) {
  const now = Date.now();
  const existing = buckets.get(key);

  if (!existing || now > existing.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: max - 1, resetAt: now + windowMs };
  }

  existing.count += 1;
  if (existing.count > max) {
    return { allowed: false, remaining: 0, resetAt: existing.resetAt };
  }

  return {
    allowed: true,
    remaining: Math.max(0, max - existing.count),
    resetAt: existing.resetAt,
  };
}
