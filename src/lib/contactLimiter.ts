import { createRateLimiter } from './rateLimit';

/** At most five messages per visitor address per hour (best effort; see rateLimit.ts). */
export const contactLimiter = createRateLimiter({ limit: 5, windowMs: 60 * 60 * 1000 });
