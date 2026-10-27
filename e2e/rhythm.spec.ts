import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const styleOf = (page: Page, selector: string, property: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

test.describe('home page rhythm', () => {
  test('snaps gently to its bands and keeps the nav clear', async ({ page }) => {
    await page.goto('/');
    // Browsers print "y proximity" as just "y", because proximity is the default strictness.
    const snapType = await page.evaluate(
      () => getComputedStyle(document.documentElement).scrollSnapType,
    );
    expect(snapType).toMatch(/^y( proximity)?$/);
    expect(snapType).not.toContain('mandatory');
    for (const selector of ['.hero-shell', '#projects', '#lab', '#contact']) {
      expect(await styleOf(page, selector, 'scroll-snap-align'), selector).toContain('start');
    }
    const header = (await page.locator('header.site-header').boundingBox())!;
    const padding = await page.evaluate(() =>
      parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop),
    );
    expect(padding).toBeGreaterThanOrEqual(header.height - 2);
    expect(padding).toBeLessThanOrEqual(header.height + 24);
  });

  test('loads at rest: snapping never moves the page by itself', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __scrolls: number[] }).__scrolls = [];
      addEventListener('scroll', () =>
        (window as unknown as { __scrolls: number[] }).__scrolls.push(window.scrollY),
      );
    });
    await page.goto('/');
    await page.waitForTimeout(1500);
    const result = await page.evaluate(() => ({
      y: window.scrollY,
      events: (window as unknown as { __scrolls: number[] }).__scrolls,
    }));
    // A scroll at load would also stop Lighthouse from finding the Largest Contentful Paint.
    expect(result).toEqual({ y: 0, events: [] });
  });

  test('scrolling stays native: a wheel moves the page and nothing is intercepted', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'a mouse wheel is a desktop input');
    await page.goto('/');
    const before = await page.evaluate(() => window.scrollY);
    await page.mouse.move(400, 400);
    await page.mouse.wheel(0, 240);
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(before);
  });

  test('Lab and Contact fill the screen below the nav and centre their content', async ({
    page,
  }) => {
    await page.goto('/');
    const viewport = page.viewportSize()!;
    const headerHeight = (await page.locator('header.site-header').boundingBox())!.height;
    for (const id of ['lab', 'contact']) {
      const band = (await page.locator(`#${id}`).boundingBox())!;
      expect(band.height, `${id} fills the screen`).toBeGreaterThanOrEqual(
        viewport.height - headerHeight - 2,
      );
      const content = (await page.locator(`#${id} .wrap`).boundingBox())!;
      const bandMiddle = band.y + band.height / 2;
      const contentMiddle = content.y + content.height / 2;
      // The band's top padding is larger than its bottom one, so allow for half the difference.
      expect(Math.abs(contentMiddle - bandMiddle), `${id} content is centred`).toBeLessThanOrEqual(
        Math.max(48, band.height * 0.12),
      );
    }
    // Projects is sized by its content, not stretched to the screen.
    expect(await styleOf(page, '#projects', 'min-height')).toBe('0px');
  });

  test('sizes the bands in small-viewport units so the mobile address bar cannot make them jump', async ({
    page,
  }) => {
    await page.goto('/');
    const rule = await page.evaluate(() => {
      for (const sheet of [...document.styleSheets]) {
        for (const r of [...sheet.cssRules]) {
          if (
            r instanceof CSSStyleRule &&
            r.selectorText.includes('.lab-band') &&
            r.style.minHeight
          ) {
            return r.style.minHeight;
          }
        }
      }
      return '';
    });
    expect(rule).toContain('svh');
    expect(rule).not.toMatch(/\d\s*vh/);
  });

  test('the cream projects band fades into the charcoal Lab band', async ({ page }) => {
    await page.goto('/');
    const image = await styleOf(page, '#lab', 'background-image');
    expect(image).toContain('linear-gradient');
    expect(image).toContain('rgb(242, 237, 225)'); // cream
    expect(image).toContain('rgb(20, 22, 27)'); // charcoal
    expect(await styleOf(page, '#projects', 'background-color')).toBe('rgb(242, 237, 225)');
  });

  test('every band uses the same content width', async ({ page }) => {
    await page.goto('/');
    const widths = await page.evaluate(() =>
      ['#projects', '#lab', '#contact'].map(
        (id) => document.querySelector(`${id} .wrap`)!.getBoundingClientRect().width,
      ),
    );
    expect(new Set(widths.map((w) => Math.round(w))).size, widths.join(', ')).toBe(1);
  });

  test('the home page never scrolls sideways', async ({ page }) => {
    await page.goto('/');
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
});

test.describe('reveal on enter', () => {
  test.describe('with motion allowed', () => {
    test.use({ reducedMotion: 'no-preference' });

    test('a section below the fold waits, rises about 12px over 400ms, and reveals once', async ({
      page,
    }) => {
      await page.goto('/');
      const section = page.locator('#contact .reveal');
      await expect(section).not.toHaveClass(/\bin\b/);
      expect(await styleOf(page, '#contact .reveal', 'opacity')).toBe('0');
      expect(await styleOf(page, '#contact .reveal', 'transform')).toBe(
        'matrix(1, 0, 0, 1, 0, 12)',
      );
      expect(await styleOf(page, '#contact .reveal', 'transition-duration')).toContain('0.4s');
      expect(await styleOf(page, '#contact .reveal', 'transition-timing-function')).toContain(
        'ease-out',
      );
      await page.locator('#contact').scrollIntoViewIfNeeded();
      await expect(section).toHaveClass(/\bin\b/);
      await expect.poll(() => styleOf(page, '#contact .reveal', 'opacity')).toBe('1');
      expect(await styleOf(page, '#contact .reveal', 'transform')).toBe('none');
      // Scrolling away and back does not hide it again: it reveals once.
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(section).toHaveClass(/\bin\b/);
    });
  });

  test.describe('with reduced motion', () => {
    test.use({ reducedMotion: 'reduce' });

    test('everything is visible at once, with no movement', async ({ page }) => {
      await page.goto('/');
      for (const selector of ['#lab .reveal', '#contact .reveal']) {
        expect(await styleOf(page, selector, 'opacity'), selector).toBe('1');
        expect(await styleOf(page, selector, 'transform'), selector).toBe('none');
        expect(await styleOf(page, selector, 'transition-duration'), selector).toBe('0s');
      }
      expect(await styleOf(page, 'html', 'scroll-behavior')).toBe('auto');
    });
  });
});
