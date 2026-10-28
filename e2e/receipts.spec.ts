import { readFileSync } from 'node:fs';
import { expect, test } from './fixtures';

// Every number a visitor can read must have a receipt in METRICS.md or a reason in
// scripts/receipts-allowlist.json. Dates and version labels (v0.1) are labels, not claims.
const routes = [
  '/',
  '/lab',
  '/projects/rentlens',
  '/projects/ontimesydney',
  '/projects/gridwatch',
  '/projects/groundtruth',
  '/no-such-page',
];

test('every number shown on the site has a receipt or a reason', async ({ page }) => {
  const metrics = readFileSync('METRICS.md', 'utf8')
    .replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ')
    .replace(/\b\d{1,2}:\d{2}(?::\d{2})?\b/g, ' ')
    .replace(/\bv\d+(?:\.\d+)*\b/gi, ' ');
  const allowed = new Set(
    Object.keys(JSON.parse(readFileSync('scripts/receipts-allowlist.json', 'utf8')).allowed),
  );
  const months = 'Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec';
  const unexplained: string[] = [];

  for (const route of routes) {
    await page.goto(route);
    const text = await page.evaluate(() => document.body.innerText);
    const cleaned = text
      .replace(new RegExp(`\\b\\d{1,2} (${months})[a-z]* \\d{4}\\b`, 'g'), ' ')
      .replace(new RegExp(`\\b(${months})[a-z]* \\d{4}\\b`, 'g'), ' ')
      .replace(/\bv\d+(?:\.\d+)*\b/gi, ' ');
    for (const match of cleaned.matchAll(/(?<![\w.-])\d+(?:[.,]\d+)*%?(?![\w-])/g)) {
      const n = match[0].replace(/,$/, '');
      const escaped = n.replace(/[.,%]/g, (c) => `\\${c}`);
      const receipt = new RegExp(`(?<![\\w.-])${escaped}(?![\\w-])`).test(metrics);
      if (!allowed.has(n) && !receipt) unexplained.push(`${route}: "${n}"`);
    }
  }
  expect(unexplained, 'numbers with no receipt in METRICS.md or allowlist reason').toEqual([]);
});
