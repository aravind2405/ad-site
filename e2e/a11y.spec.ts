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
    test.use({ viewport: size });

    for (const path of paths) {
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
