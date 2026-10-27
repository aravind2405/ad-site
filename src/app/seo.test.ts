import { describe, expect, it } from 'vitest';
import { projects } from '@/lib/content';
import { SITE_URL } from '@/lib/site';
import robots from './robots';
import sitemap from './sitemap';

describe('sitemap and robots', () => {
  const urls = sitemap().map((e) => e.url);

  it('uses the canonical www address', () => {
    expect(SITE_URL).toBe('https://www.aravindd.com');
    for (const url of urls) expect(url.startsWith(SITE_URL)).toBe(true);
  });

  it('lists the home page, lab and every project page', () => {
    expect(urls).toContain(SITE_URL);
    expect(urls).toContain(`${SITE_URL}/lab`);
    for (const p of projects) expect(urls).toContain(`${SITE_URL}/projects/${p.slug}`);
  });

  it('no longer lists the moved /rentlens page or the removed /shelf page', () => {
    expect(urls).not.toContain(`${SITE_URL}/rentlens`);
    expect(urls).not.toContain(`${SITE_URL}/shelf`);
  });

  it('has no duplicate entries', () => {
    expect(new Set(urls).size).toBe(urls.length);
  });

  it('points robots.txt at the sitemap and allows crawling', () => {
    const r = robots();
    expect(r.sitemap).toBe(`${SITE_URL}/sitemap.xml`);
    expect(JSON.stringify(r.rules)).toContain('"allow":"/"');
  });
});
