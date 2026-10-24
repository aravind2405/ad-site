import { describe, expect, it } from 'vitest';
import { formatDate } from './format';

describe('formatDate', () => {
  it('formats in Australian English using Sydney time', () => {
    expect(formatDate('2026-10-24T00:38:42Z')).toBe('24 Oct 2026');
  });

  it('uses the Sydney date even when UTC is still the previous day', () => {
    expect(formatDate('2026-10-23T23:30:00Z')).toBe('24 Oct 2026');
  });

  it('returns the input when it is not a date', () => {
    expect(formatDate('not a date')).toBe('not a date');
  });
});
