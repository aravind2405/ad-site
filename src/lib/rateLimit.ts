/**
 * A small sliding-window limiter kept in memory. On a serverless host each running instance has
 * its own memory, so this is a best-effort brake on one visitor hammering one instance, not a hard
 * global limit. A firewall rule or a shared store would be needed for that.
 */
export function createRateLimiter(options: { limit: number; windowMs: number; maxKeys?: number }) {
  const { limit, windowMs, maxKeys = 5000 } = options;
  const hits = new Map<string, number[]>();

  return {
    /** Records an attempt for `key`. `ok` is false once the key has used its allowance. */
    check(key: string, now = Date.now()): { ok: boolean; retryAfterSeconds: number } {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return { ok: false, retryAfterSeconds: Math.ceil((recent[0] + windowMs - now) / 1000) };
      }
      recent.push(now);
      hits.delete(key);
      hits.set(key, recent);
      // Forget the oldest keys so a flood of distinct addresses cannot grow memory without bound.
      while (hits.size > maxKeys) hits.delete(hits.keys().next().value as string);
      return { ok: true, retryAfterSeconds: 0 };
    },
    reset() {
      hits.clear();
    },
  };
}
