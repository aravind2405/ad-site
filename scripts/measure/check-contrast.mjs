// Worst-case text contrast over gradients and other backgrounds, which axe often cannot decide.
// For each viewport it records every visible text node and its colour, renders the page with
// all text made transparent, samples the real background pixels behind each line of glyphs, and
// computes the lowest WCAG contrast ratio. Large text needs 3:1, everything else 4.5:1.
// Needs: puppeteer-core and pngjs (npm install --save-exact puppeteer-core@25.16.0 pngjs@7.0.0).
// Usage: BASE=http://127.0.0.1:3700 PAGES="/ /lab" TAG=redesign node check-contrast.mjs
import puppeteer from 'puppeteer-core';
import { PNG } from 'pngjs';
import { writeFileSync } from 'node:fs';

const BASE = process.env.BASE ?? 'https://www.aravindd.com';
const pages = (process.env.PAGES ?? '/ /lab /shelf /projects/rentlens').split(' ');
const tag = process.env.TAG ?? '';
const viewports = {
  mobile: { width: 375, height: 812, deviceScaleFactor: 1 },
  desktop: { width: 1440, height: 900, deviceScaleFactor: 1 },
};

const channel = (c) => {
  const v = c / 255;
  return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
};
const luminance = ([r, g, b]) => 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
const ratio = (a, b) => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const results = { runAt: new Date().toISOString(), base: BASE, pages: [] };

for (const path of pages) {
  for (const [form, vp] of Object.entries(viewports)) {
    // Isolated context per page (see run-axe.mjs for why networkidle0 is avoided).
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setViewport(vp);
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
    // Sections below the first screen fade in once scrolled to, so scroll through the whole
    // page first; otherwise they are still transparent when the pixels are sampled.
    await page.evaluate(async () => {
      for (let y = 0; y < document.body.scrollHeight; y += 400) {
        window.scrollTo({ top: y, behavior: 'instant' });
        await new Promise((r) => setTimeout(r, 60));
      }
      window.scrollTo({ top: 0, behavior: 'instant' });
    });
    await new Promise((r) => setTimeout(r, 500));
    await page.evaluate(() => document.fonts.ready);
    await new Promise((resolve) => setTimeout(resolve, 800));

    const items = await page.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      for (let node = walker.nextNode(); node; node = walker.nextNode()) {
        if (!node.textContent.trim()) continue;
        const el = node.parentElement;
        if (!el || ['SCRIPT', 'STYLE', 'NOSCRIPT'].includes(el.tagName)) continue;
        if (el.closest('.sr-only') || el.closest('iframe')) continue;
        const s = getComputedStyle(el);
        if (s.visibility !== 'visible' || Number(s.opacity) === 0) continue;
        // The area directly behind the glyphs: one rectangle per rendered line of this text node.
        const range = document.createRange();
        range.selectNodeContents(node);
        const rects = [...range.getClientRects()]
          .filter((r) => r.width >= 2 && r.height >= 2)
          .map((r) => ({ x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }));
        if (rects.length === 0) continue;
        out.push({
          sel: el.tagName.toLowerCase() + (typeof el.className === 'string' && el.className ? '.' + el.className.split(' ')[0] : ''),
          text: node.textContent.trim().slice(0, 40),
          color: s.color,
          size: parseFloat(s.fontSize),
          weight: Number(s.fontWeight),
          rects,
        });
      }
      return out;
    });

    await page.addStyleTag({
      // Transitions are disabled so the text is fully transparent in the screenshot, not mid-fade.
      content:
        '*,*::before,*::after{color:transparent!important;-webkit-text-fill-color:transparent!important;text-shadow:none!important;transition:none!important;animation:none!important;}',
    });
    await page.evaluate(
      () => new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve))),
    );
    const png = PNG.sync.read(Buffer.from(await page.screenshot({ fullPage: true })));
    await context.close();

    let checked = 0;
    let lowest = Infinity;
    const failures = [];
    for (const it of items) {
      const m = it.color.match(/[\d.]+/g)?.map(Number);
      if (!m) continue;
      const [r, g, b, a = 1] = m;
      let worst = Infinity;
      for (const rect of it.rects) {
        const x0 = Math.max(0, Math.floor(rect.x));
        const y0 = Math.max(0, Math.floor(rect.y));
        const x1 = Math.min(png.width - 1, Math.ceil(rect.x + rect.w));
        const y1 = Math.min(png.height - 1, Math.ceil(rect.y + rect.h));
        const step = Math.max(1, Math.floor(Math.max(x1 - x0, y1 - y0) / 24));
        for (let y = y0; y <= y1; y += step) {
          for (let x = x0; x <= x1; x += step) {
            const i = (png.width * y + x) << 2;
            const bg = [png.data[i], png.data[i + 1], png.data[i + 2]];
            const fg = [r, g, b].map((c, k) => Math.round(c * a + bg[k] * (1 - a)));
            worst = Math.min(worst, ratio(fg, bg));
          }
        }
      }
      if (!Number.isFinite(worst)) continue;
      checked += 1;
      lowest = Math.min(lowest, worst);
      const large = it.size >= 24 || (it.size >= 18.66 && it.weight >= 700);
      const need = large ? 3 : 4.5;
      if (worst < need) failures.push({ sel: it.sel, text: it.text, ratio: +worst.toFixed(2), need });
    }
    results.pages.push({ path, form, checked, lowest: +lowest.toFixed(2), failures });
  }
}
await browser.close();
writeFileSync(`out/contrast${tag ? '-' + tag : ''}.json`, JSON.stringify(results, null, 2));
for (const p of results.pages) {
  console.log(`${p.form.padEnd(8)} ${p.path.padEnd(24)} elements=${p.checked} lowest=${p.lowest}:1 below-threshold=${p.failures.length}`);
  for (const f of p.failures.slice(0, 5)) console.log(`    ${f.ratio}:1 (needs ${f.need}) ${f.sel} "${f.text}"`);
}
