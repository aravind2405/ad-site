import AxeBuilder from '@axe-core/playwright';
import { expect, test } from './fixtures';

const paths = [
  '/',
  '/projects/rentlens',
  '/projects/ontimesydney',
  '/projects/gridwatch',
  '/projects/groundtruth',
  '/lab',
];

const viewports = {
  desktop: { width: 1440, height: 900 },
  mobile: { width: 375, height: 812 },
};

for (const [name, size] of Object.entries(viewports)) {
  test.describe(`accessibility (${name})`, () => {
    // Reduced motion shows every section in its final state, so axe never measures a half-faded one.
    test.use({ viewport: size, reducedMotion: 'reduce' });

    // The home page's backdrop changes colour as it scrolls, so each page is scrolled to and
    // checked while it is on screen, together with the nav.
    test('/ has no WCAG A/AA violations on any of its pages', async ({ page }) => {
      await page.goto('/');
      for (const id of ['hero', 'projects', 'lab', 'contact']) {
        await page.evaluate((i) => document.getElementById(i)!.scrollIntoView(), id);
        await page.waitForTimeout(250);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          .include(`#${id}`)
          .include('header')
          .exclude('iframe')
          .analyze();
        expect(
          results.violations.map(
            (v) => `${id} ${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`,
          ),
        ).toEqual([]);
      }
    });

    for (const path of paths.filter((p) => p !== '/')) {
      test(`${path} has no WCAG A/AA violations`, async ({ page }) => {
        await page.goto(path);
        const results = await new AxeBuilder({ page })
          .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
          // The embedded dashboard is a separate site with its own measurements.
          .exclude('iframe')
          .analyze();
        expect(
          results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
        ).toEqual([]);
      });
    }

    test('/projects/rentlens has no violations once its architecture diagram is drawn', async ({
      page,
    }) => {
      // Reduced motion shows every section in its final state, so axe never measures a half-faded one.
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto('/projects/rentlens');
      await page.locator('.diagram').scrollIntoViewIfNeeded();
      await expect(page.locator('.diagram')).toHaveAttribute('data-state', 'drawn');
      const results = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'])
        .exclude('iframe')
        .analyze();
      expect(
        results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target).join(' | ')}`),
      ).toEqual([]);
    });
  });
}
