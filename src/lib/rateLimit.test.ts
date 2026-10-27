import { describe, expect, it } from 'vitest';
import { createRateLimiter } from './rateLimit';

describe('rate limiter', () => {
  it('allows up to the limit, then refuses with a wait time', () => {
    const limiter = createRateLimiter({ limit: 2, windowMs: 60_000 });
    expect(limiter.check('a', 0).ok).toBe(true);
    expect(limiter.check('a', 1000).ok).toBe(true);
    const blocked = limiter.check('a', 2000);
    expect(blocked.ok).toBe(false);
    expect(blocked.retryAfterSeconds).toBe(58);
  });

  it('lets a visitor back in once the window has passed, and keys are independent', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 1000 });
    expect(limiter.check('a', 0).ok).toBe(true);
    expect(limiter.check('b', 0).ok).toBe(true);
    expect(limiter.check('a', 500).ok).toBe(false);
    expect(limiter.check('a', 1001).ok).toBe(true);
  });

  it('forgets the oldest visitors so memory stays bounded', () => {
    const limiter = createRateLimiter({ limit: 1, windowMs: 60_000, maxKeys: 3 });
    for (const key of ['a', 'b', 'c', 'd']) limiter.check(key, 0);
    // 'a' was forgotten, so it is allowed again; 'd' is still remembered.
    expect(limiter.check('a', 1).ok).toBe(true);
    expect(limiter.check('d', 1).ok).toBe(false);
  });
});
