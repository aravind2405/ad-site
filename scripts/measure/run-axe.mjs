// Runs axe-core against each live page at a phone and a desktop viewport.
// CSP bypass is used only to inject the axe script into our own pages for testing.
// Defaults reproduce the 2026-10-24 measurement. Override: BASE=... PAGES="/ /x" TAG=name node run-axe.mjs
import puppeteer from 'puppeteer-core';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';

const require = createRequire(import.meta.url);
const axeSource = readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
const axeVersion = require('axe-core/package.json').version;

const BASE = process.env.BASE ?? 'https://www.aravindd.com';
const pages = (process.env.PAGES ?? '/ /lab /shelf /rentlens').split(' ');
const tag = process.env.TAG ?? '';
const viewports = {
  mobile: { width: 375, height: 812, isMobile: true, hasTouch: true, deviceScaleFactor: 2 },
  desktop: { width: 1440, height: 900 },
};
const tags = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];

const browser = await puppeteer.launch({
  executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  headless: true,
});
const results = { axeVersion, runAt: new Date().toISOString(), tags, pages: [] };

for (const path of pages) {
  for (const [form, vp] of Object.entries(viewports)) {
    // One isolated browser context per page: Next.js router prefetches are cached by Chrome and
    // revalidated in the background, which keeps networkidle0 from settling in a shared session.
    const context = await browser.createBrowserContext();
    const page = await context.newPage();
    await page.setBypassCSP(true);
    await page.setViewport(vp);
    await page.goto(BASE + path, { waitUntil: 'load', timeout: 60000 });
    await page.evaluate(() => document.fonts.ready);
    await new Promise((resolve) => setTimeout(resolve, 800));
    await page.evaluate(axeSource);
    const r = await page.evaluate(async (tags) => {
      const res = await window.axe.run(document, { runOnly: { type: 'tag', values: tags } });
      return {
        violations: res.violations.map((v) => ({
          id: v.id, impact: v.impact, help: v.help, nodes: v.nodes.length,
          targets: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
        })),
        passes: res.passes.length,
        incomplete: res.incomplete.map((v) => ({ id: v.id, nodes: v.nodes.length })),
        inapplicable: res.inapplicable.length,
      };
    }, tags);
    results.pages.push({ path, form, finalUrl: page.url(), ...r });
    await context.close();
  }
}
await browser.close();
writeFileSync(`out/axe${tag ? '-' + tag : ''}.json`, JSON.stringify(results, null, 2));
console.log(
  results.pages
    .map((p) => `${p.form.padEnd(8)} ${p.path.padEnd(10)} violations=${p.violations.length} passes=${p.passes} incomplete=${p.incomplete.length}`)
    .join('\n'),
);
