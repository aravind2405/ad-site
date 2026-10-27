import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

const styleOf = (page: Page, selector: string, property: string) =>
  page
    .locator(selector)
    .first()
    .evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), property);

// color-mix() reports as color(srgb 0.9 0.9 0.9) rather than rgb(), so read either form.
const rgbOf = async (page: Page, selector: string) => {
  const color = await styleOf(page, selector, 'color');
  const srgb = /color\(srgb ([\d. ]+)\)/.exec(color);
  if (srgb) return srgb[1].split(' ').map((v) => Math.round(Number(v) * 255));
  return color.match(/\d+/g)!.slice(0, 3).map(Number);
};

test.describe('home page rhythm', () => {
  test('snaps one page at a time and keeps the nav clear', async ({ page }) => {
    await page.goto('/');
    expect(await styleOf(page, 'html', 'scroll-snap-type')).toBe('y mandatory');
    for (const selector of ['#hero', '#projects', '#lab', '#contact']) {
      expect(await styleOf(page, selector, 'scroll-snap-align'), selector).toContain('start');
      // one swipe or scroll can never skip a page
      expect(await styleOf(page, selector, 'scroll-snap-stop'), selector).toBe('always');
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

  test('every page fills the screen below the nav and centres its content', async ({ page }) => {
    await page.goto('/');
    const viewport = page.viewportSize()!;
    const headerHeight = (await page.locator('header.site-header').boundingBox())!.height;
    for (const id of ['hero', 'projects', 'lab', 'contact']) {
      const band = (await page.locator(`#${id}`).boundingBox())!;
      expect(band.height, `${id} fills the screen`).toBeGreaterThanOrEqual(
        viewport.height - headerHeight - 2,
      );
      // a page that fits the screen is exactly one screen tall, so one swipe moves one page
      if (id !== 'contact') {
        expect(band.height, `${id} is one screen`).toBeLessThanOrEqual(
          viewport.height - headerHeight + 2,
        );
      }
    }
  });

  test('sizes the pages in small-viewport units so the mobile address bar cannot make them jump', async ({
    page,
  }) => {
    await page.goto('/');
    const token = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--page-h').trim(),
    );
    expect(token).toContain('svh');
    expect(token).not.toMatch(/\d\s*vh/);
    expect(await styleOf(page, '#projects', 'min-height')).not.toBe('0px');
  });

  test('the page behind blends from cream to charcoal instead of switching', async ({ page }) => {
    await page.goto('/');
    // measure the blend without the snapping pulling the page to a page edge
    await page.addStyleTag({ content: 'html { scroll-snap-type: none !important; }' });
    const at = async (from: string, to: string, f: number) => {
      await page.evaluate(
        ([a, b, t]) => {
          const h = document.querySelector('.site-header')!.getBoundingClientRect().height;
          const top = (id: string) =>
            document.getElementById(id)!.getBoundingClientRect().top + scrollY - h;
          window.scrollTo({
            top: top(a as string) + (top(b as string) - top(a as string)) * (t as number),
            behavior: 'instant',
          });
        },
        [from, to, f],
      );
      await page.waitForTimeout(250);
      return page.evaluate(() => {
        const root = document.documentElement.style;
        return {
          bg: root.getPropertyValue('--stage-bg'),
          dark: Number(root.getPropertyValue('--dark')),
        };
      });
    };
    const red = (bg: string) => Number(/rgb\((\d+)/.exec(bg)![1]);
    const cream = await at('projects', 'lab', 0);
    const quarter = await at('projects', 'lab', 0.25);
    const half = await at('projects', 'lab', 0.5);
    const lab = await at('projects', 'lab', 1);
    expect(red(cream.bg)).toBeGreaterThan(235);
    expect(red(lab.bg)).toBeLessThan(25);
    // in between it is a real blend, getting darker in order
    expect(red(quarter.bg)).toBeLessThan(red(cream.bg));
    expect(red(half.bg)).toBeLessThan(red(quarter.bg));
    expect(red(half.bg)).toBeGreaterThan(red(lab.bg));
    expect(cream.dark).toBe(0);
    expect(lab.dark).toBe(1);
    // and the nav text follows: light over the Lab, dark over the cream
    expect(await rgbOf(page, '.logo')).toEqual([242, 243, 240]);
    await at('projects', 'lab', 0);
    expect(await rgbOf(page, '.logo')).toEqual([22, 24, 29]);
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
