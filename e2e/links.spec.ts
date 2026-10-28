import { expect, test } from './fixtures';

// Crawls the built site from the home page. Every internal link must resolve, and every
// #fragment must match an element on the page it points to.
test('every internal link and anchor on the site resolves', async ({ page, baseURL }) => {
  const origin = new URL(baseURL!).origin;
  // Start from the home page and from every sitemap URL, so pages that are not linked from the
  // home page (the planned projects) are still checked.
  const sitemap = await (await page.request.get('/sitemap.xml')).text();
  const listed = [...sitemap.matchAll(/<loc>https:\/\/www\.aravindd\.com([^<]*)<\/loc>/g)].map(
    (m) => m[1] || '/',
  );
  const seeds = ['/', ...listed];
  const queue = [...seeds];
  const visited = new Map<string, Set<string>>();
  const links: { from: string; href: string }[] = [];

  while (queue.length > 0) {
    const path = queue.shift()!;
    if (visited.has(path)) continue;
    const response = await page.goto(path);
    expect(response?.status(), `${path} should load`).toBeLessThan(400);
    visited.set(path, new Set(await page.$$eval('[id]', (els) => els.map((e) => e.id))));
    const hrefs = await page.$$eval('a[href]', (els) =>
      els.map((a) => a.getAttribute('href') ?? ''),
    );
    for (const href of hrefs) {
      expect(href, `${path} has an empty or bare "#" link`).not.toBe('#');
      expect(href, `${path} has an empty link`).not.toBe('');
      if (/^(mailto|tel):/.test(href)) continue;
      const url = new URL(href, `${origin}${path}`);
      if (url.origin !== origin) continue;
      links.push({ from: path, href });
      if (!visited.has(url.pathname)) queue.push(url.pathname);
    }
  }

  expect(visited.size).toBeGreaterThanOrEqual(6);
  for (const path of seeds) expect(visited.has(path), `${path} was crawled`).toBe(true);
  for (const { from, href } of links) {
    const url = new URL(href, `${origin}${from}`);
    const ids = visited.get(url.pathname);
    expect(ids, `${from} links to ${href}, which was never crawled`).toBeDefined();
    if (url.hash.length > 1) {
      expect(ids!.has(decodeURIComponent(url.hash.slice(1))), `${from} -> ${href}`).toBe(true);
    }
  }
});
