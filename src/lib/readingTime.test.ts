import { describe, expect, it } from 'vitest';
import { projects } from './content';
import { readingMinutes } from './readingTime';

describe('readingMinutes', () => {
  it('is at least one minute for every project', () => {
    for (const p of projects) expect(readingMinutes(p)).toBeGreaterThanOrEqual(1);
  });

  it('grows with the amount of text', () => {
    const base = projects[0];
    const longer = {
      ...base,
      details: { ...base.details, overview: [...base.details.overview, 'word '.repeat(600)] },
    };
    expect(readingMinutes(longer)).toBeGreaterThan(readingMinutes(base));
  });
});
