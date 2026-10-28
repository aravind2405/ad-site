import type { Page } from '@playwright/test';
import { expect, test } from './fixtures';

// Where a page rests when it is snapped: its top sits just under the nav.
const restingTop = (page: Page, id: string) =>
  page.evaluate((i) => {
    const h = document.querySelector('.site-header')!.getBoundingClientRect().height;
    return Math.round(document.getElementById(i)!.getBoundingClientRect().top + scrollY - h);
  }, id);

const currentY = (page: Page) => page.evaluate(() => Math.round(window.scrollY));

test.describe('home pages, with motion allowed', () => {
  test.use({ reducedMotion: 'no-preference' });

  test('a firm scroll or a key press moves one page, up and down', async ({
    page,
    isMobile,
    browserName,
  }) => {
    test.skip(isMobile, 'a mouse wheel and keyboard are desktop inputs');
    test.skip(browserName === 'webkit', 'headless WebKit does not run scroll snapping');
    await page.goto('/');
    await page.mouse.move(700, 450);
    const order = ['hero', 'projects', 'lab', 'contact'];
    // a firm scroll, more than half a page, lands on the next page
    await page.mouse.wheel(0, 500);
    await expect
      .poll(() => currentY(page), { message: 'wheel down to projects' })
      .toBe(await restingTop(page, order[1]));
    // the keyboard moves a page at a time too
    await page.keyboard.press('PageDown');
    await expect
      .poll(() => currentY(page), { message: 'PageDown to lab' })
      .toBe(await restingTop(page, order[2]));
    await page.mouse.wheel(0, -500);
    await expect
      .poll(() => currentY(page), { message: 'wheel up to projects' })
      .toBe(await restingTop(page, order[1]));
    await page.keyboard.press('PageUp');
    await expect
      .poll(() => currentY(page), { message: 'PageUp to hero' })
      .toBe(await restingTop(page, order[0]));
  });

  test('one swipe moves one page on a phone', async ({ page, isMobile, browserName }) => {
    test.skip(!isMobile || browserName !== 'chromium', 'a touch swipe, driven through Chrome');
    // CI's bundled headless Chromium does not scroll from this synthesized gesture (it stays at 0),
    // so the swipe is checked locally on Chrome; wheel and key paging still run everywhere.
    test.skip(!!process.env.CI, 'headless Chromium in CI ignores the synthesized touch gesture');
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.classList.contains('stage-on'));
    const cdp = await page.context().newCDPSession(page);
    const swipe = (dy: number) =>
      cdp.send('Input.synthesizeScrollGesture', {
        x: 200,
        y: dy < 0 ? 780 : 300,
        yDistance: dy,
        speed: 4000,
        preventFling: false,
        gestureSourceType: 'touch',
      });
    await swipe(-300);
    await expect
      .poll(() => currentY(page), { message: 'swipe up to projects' })
      .toBe(await restingTop(page, 'projects'));
    await swipe(-300);
    await expect
      .poll(() => currentY(page), { message: 'swipe up to the Lab' })
      .toBe(await restingTop(page, 'lab'));
    await swipe(300);
    await expect
      .poll(() => currentY(page), { message: 'swipe down to projects' })
      .toBe(await restingTop(page, 'projects'));
  });

  test('the Lab peek at the foot of Projects takes you to the Lab, and the nav follows', async ({
    page,
    isMobile,
  }) => {
    await page.goto('/#projects');
    await page.getByRole('link', { name: /Curiosity Lab.*Take a look/ }).click();
    await expect.poll(() => currentY(page)).toBe(await restingTop(page, 'lab'));
    if (!isMobile) {
      await expect(
        page.locator('.nav-main').getByRole('link', { name: 'Curiosity Lab' }),
      ).toHaveAttribute('aria-current', 'location');
    }
  });

  test('the dots on the side move with the page and jump to a page', async ({ page, isMobile }) => {
    test.skip(isMobile, 'phones swipe instead; the dots are hidden there');
    await page.goto('/');
    const rail = page.getByRole('navigation', { name: 'Home page sections' });
    await expect(rail.getByRole('link')).toHaveCount(4);
    await expect(rail.getByRole('link', { name: 'Intro' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    await rail.getByRole('link', { name: 'Contact' }).click();
    await expect(rail.getByRole('link', { name: 'Contact' })).toHaveAttribute(
      'aria-current',
      'location',
    );
    await expect.poll(() => currentY(page)).toBe(await restingTop(page, 'contact'));
  });

  test('the hero shows one project question at a time and keeps them all for screen readers', async ({
    page,
  }) => {
    await page.goto('/');
    const all = await page.locator('.asks .sr-only li').allTextContents();
    expect(all.length).toBeGreaterThanOrEqual(2);
    const first = (await page.locator('.asks-now').textContent())!;
    expect(all).toContain(first);
    await expect
      .poll(async () => page.locator('.asks-now').textContent(), { timeout: 8000 })
      .not.toBe(first);
  });
});

test.describe('home pages, with reduced motion', () => {
  test.use({ reducedMotion: 'reduce' });

  test('there is no snapping and the first question just stays put', async ({ page }) => {
    await page.goto('/');
    expect(
      await page.evaluate(() => getComputedStyle(document.documentElement).scrollSnapType),
    ).toBe('none');
    const first = await page.locator('.asks-now').textContent();
    await page.waitForTimeout(5000);
    expect(await page.locator('.asks-now').textContent()).toBe(first);
    // the colour still follows the scroll; it just is not animated
    await page.evaluate(() => document.getElementById('lab')!.scrollIntoView());
    await expect
      .poll(() => page.evaluate(() => document.documentElement.style.getPropertyValue('--dark')))
      .toBe('1.000');
  });
});

test.describe('on a phone', () => {
  test('the project cards are a row to swipe, with the next card peeking in', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'phone layout');
    await page.goto('/');
    const width = page.viewportSize()!.width;
    const cards = page.locator('#projects .project-card');
    expect(await cards.count()).toBeGreaterThanOrEqual(2);
    const first = (await cards.nth(0).boundingBox())!;
    const second = (await cards.nth(1).boundingBox())!;
    expect(first.width).toBeGreaterThan(width * 0.72);
    expect(second.x, 'the second card peeks in').toBeLessThan(width - 16);
    expect(second.x).toBeGreaterThan(width * 0.8);
    expect(Math.abs(first.width - second.width)).toBeLessThan(2);
    // the row scrolls sideways inside itself and the page does not
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });

  test('every home page fits one screen, the Lab tiles stacked', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'phone layout');
    await page.goto('/');
    const screen = page.viewportSize()!.height;
    for (const id of ['hero', 'projects', 'lab']) {
      const box = (await page.locator(`#${id}`).boundingBox())!;
      expect(box.height, id).toBeLessThanOrEqual(screen);
    }
    const tiles = await page.locator('#lab .lab-tile').count();
    expect(tiles).toBe(3);
  });
});
