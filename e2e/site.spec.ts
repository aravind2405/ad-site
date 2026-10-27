import { expect, test } from '@playwright/test';

const routes = [
  { path: '/', h1: "Hi, I'm Aravind." },
  { path: '/projects/rentlens', h1: 'What are tenants actually paying across NSW?' },
  { path: '/projects/ontimesydney', h1: "How on time are Sydney's buses, really?" },
  { path: '/projects/gridwatch', h1: 'What is the power grid doing right now?' },
  { path: '/projects/groundtruth', h1: 'Can an AI answer policy questions, and can I prove it?' },
  { path: '/shelf', h1: 'The shelf' },
  { path: '/lab', h1: 'Curiosity Lab' },
];

const securityHeaders = [
  'content-security-policy',
  'x-frame-options',
  'x-content-type-options',
  'referrer-policy',
  'permissions-policy',
  'cross-origin-opener-policy',
];

test.describe('every page', () => {
  for (const { path, h1 } of routes) {
    test(`${path} loads with its heading and security headers`, async ({ page }) => {
      const response = await page.goto(path);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText(h1);
      const headers = response!.headers();
      for (const name of securityHeaders) expect(headers[name], name).toBeTruthy();
      expect(headers['x-powered-by']).toBeUndefined();
    });
  }

  test('publishes no email address anywhere', async ({ page }) => {
    for (const { path } of routes) {
      await page.goto(path);
      const html = await page.content();
      expect(html, path).not.toMatch(/mailto:/i);
      expect(html, path).not.toMatch(/@gmail/i);
    }
  });

  test('opens every external link in a new tab without leaking the opener', async ({ page }) => {
    for (const { path } of routes) {
      await page.goto(path);
      const external = page.locator('a[href^="http"]:not([href*="127.0.0.1"])');
      const count = await external.count();
      for (let i = 0; i < count; i++) {
        const link = external.nth(i);
        const href = await link.getAttribute('href');
        // The licence link in the footer deliberately stays in the same tab.
        if (href?.includes('ad-site/blob/main/LICENSE')) continue;
        await expect(link, `${path} ${href}`).toHaveAttribute('target', '_blank');
        const rel = (await link.getAttribute('rel')) ?? '';
        expect(rel, `${path} ${href}`).toContain('noopener');
        expect(rel, `${path} ${href}`).toContain('noreferrer');
      }
    }
  });
});

test.describe('navigation', () => {
  test('the top bar stays in view while scrolling', async ({ page }) => {
    await page.goto('/');
    const header = page.locator('header.site-header');
    await expect(header).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(1000);
    const box = await header.boundingBox();
    expect(box?.y).toBeLessThanOrEqual(1);
    // The bar is opaque: its background must have no transparency.
    const bg = await header.evaluate((el) => getComputedStyle(el).backgroundColor);
    expect(bg).toBe('rgb(244, 245, 242)');
    await expect(page.getByRole('link', { name: 'Shelf' })).toBeInViewport();
    await page.getByRole('link', { name: 'Shelf' }).click();
    await expect(page).toHaveURL(/\/shelf$/);
  });

  test('anchor links land below the sticky bar', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'Contact', exact: true }).click();
    await expect(page.locator('#contact')).toBeInViewport();
    const top = await page.locator('#contact').evaluate((el) => el.getBoundingClientRect().top);
    expect(top).toBeGreaterThanOrEqual(60);
  });

  test('marks the current page in the menu', async ({ page }) => {
    await page.goto('/shelf');
    const nav = page.getByRole('navigation', { name: 'Main' });
    await expect(nav.getByRole('link', { name: 'Shelf' })).toHaveAttribute('aria-current', 'page');
    await page.goto('/projects/ontimesydney');
    await expect(nav.getByRole('link', { name: 'Projects' })).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  test('has a working skip link', async ({ page }) => {
    await page.goto('/');
    await page.keyboard.press('Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('moves /rentlens to the project page', async ({ page }) => {
    await page.goto('/rentlens');
    await expect(page).toHaveURL(/\/projects\/rentlens$/);
  });

  test('returns 404 for an unknown project', async ({ page }) => {
    const response = await page.goto('/projects/does-not-exist');
    expect(response?.status()).toBe(404);
  });
});

test.describe('landing page', () => {
  test('no longer has the removed sections or a flagship card', async ({ page }) => {
    await page.goto('/');
    for (const name of ['How I work', 'Right now']) {
      await expect(page.getByRole('heading', { name, exact: true })).toHaveCount(0);
    }
    const text = (await page.locator('main').innerText()).toLowerCase();
    expect(text).not.toContain('flagship');
    expect(text).not.toContain('email me');
  });

  test('offers LinkedIn and GitHub as the only contact routes', async ({ page }) => {
    await page.goto('/');
    const contact = page.locator('#contact');
    await expect(contact.getByRole('link')).toHaveCount(2);
    await expect(contact.getByRole('link', { name: /LinkedIn/ })).toHaveAttribute(
      'href',
      /linkedin\.com\/in\//,
    );
    await expect(contact.getByRole('link', { name: /GitHub/ })).toHaveAttribute(
      'href',
      'https://github.com/aravind2405',
    );
  });

  test('shows four equal project cards with a details link each', async ({ page }) => {
    await page.goto('/');
    const cards = page.locator('article.project-card');
    await expect(cards).toHaveCount(4);
    for (const slug of ['rentlens', 'ontimesydney', 'gridwatch', 'groundtruth']) {
      await expect(page.locator(`a[href="/projects/${slug}"]`)).toHaveCount(1);
    }
  });

  test('planned projects have no code or demo links and say so', async ({ page }) => {
    await page.goto('/');
    for (const name of ['GridWatch AU', 'GroundTruth']) {
      const card = page.locator('article.project-card', { hasText: name });
      await expect(card).toContainText('Coming soon');
      await expect(card.locator('a')).toHaveCount(1);
    }
  });

  test('the whole card opens the project details', async ({ page }) => {
    await page.goto('/');
    await page
      .locator('article.project-card', { hasText: 'OnTimeSydney' })
      .click({ position: { x: 60, y: 90 } });
    await expect(page).toHaveURL(/\/projects\/ontimesydney$/);
  });
});

test.describe('project pages', () => {
  test('RentLens embeds the dashboard in a sandbox and credits CC BY', async ({ page }) => {
    const cspErrors: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error' && /content security policy/i.test(m.text())) {
        cspErrors.push(m.text());
      }
    });
    await page.goto('/projects/rentlens');
    const frame = page.locator('iframe.dash');
    await expect(frame).toHaveAttribute('sandbox', 'allow-scripts');
    await expect(frame).toHaveAttribute('src', 'https://aravind2405.github.io/rentlens-nsw/');
    await frame.scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    const credit = page.locator('p.credit');
    await expect(credit).toContainText('© State of New South Wales');
    await expect(credit.getByRole('link')).toHaveAttribute(
      'href',
      'https://data.nsw.gov.au/data/dataset/rental-bond-lodgement',
    );
    expect(cspErrors).toEqual([]);
  });

  test('OnTimeSydney states plainly that no data exists yet', async ({ page }) => {
    await page.goto('/projects/ontimesydney');
    await expect(page.locator('.stands')).toContainText('No data has been collected yet');
    await expect(page.locator('body')).not.toContainText(/live map|airflow|fastapi|trains/i);
  });

  test('planned project pages say work has not started', async ({ page }) => {
    for (const slug of ['gridwatch', 'groundtruth']) {
      await page.goto(`/projects/${slug}`);
      await expect(page.locator('.stands')).toContainText('Work has not started');
      await expect(page.locator('.soon')).toHaveText('Case study coming soon.');
      await expect(page.getByRole('link', { name: /View code on GitHub/ })).toHaveCount(0);
    }
  });

  test('project pages have a reading time, an On this page list and exits', async ({ page }) => {
    await page.goto('/projects/rentlens');
    await expect(page.locator('.read-time')).toHaveText(/^\d+ min read$/);
    const toc = page.getByRole('navigation', { name: 'On this page' });
    const links = toc.getByRole('link');
    expect(await links.count()).toBeGreaterThanOrEqual(5);
    for (const href of await links.evaluateAll((els) => els.map((e) => e.getAttribute('href')))) {
      await expect(page.locator(href!), href!).toHaveCount(1);
    }
    const exits = page.getByRole('navigation', { name: 'More projects' });
    await expect(exits.getByRole('link', { name: /Next project/ })).toBeVisible();
    await expect(exits.getByRole('link', { name: /Previous project/ })).toBeVisible();
    await expect(exits.getByRole('link', { name: /Curiosity Lab/ })).toBeVisible();
  });

  test('RentLens shows its design decision as a trade-offs table', async ({ page }) => {
    await page.goto('/projects/rentlens');
    const table = page.locator('table.tradeoffs');
    await expect(table).toContainText('Watermark on the arrival time of each file');
    await expect(table.getByRole('columnheader')).toHaveCount(4);
  });

  test('every project page links back to the projects list', async ({ page }) => {
    await page.goto('/projects/rentlens');
    await page.getByRole('link', { name: '← All projects' }).click();
    await expect(page).toHaveURL(/\/#projects$/);
  });
});

test.describe('lab page', () => {
  test('has a plain description, no badge and no playful notes', async ({ page }) => {
    await page.goto('/lab');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Curiosity Lab');
    await expect(page.locator('.lab-hero')).toContainText(
      'Early-stage experiments, each starting from a question about data I can get hold of.',
    );
    const text = (await page.locator('body').innerText()).toLowerCase();
    for (const phrase of ['side quests', 'open notebook', 'harmed', 'spoiler', 'not vibes']) {
      expect(text, phrase).not.toContain(phrase);
    }
    await expect(page.getByRole('heading', { name: 'Ideas for later' })).toBeVisible();
  });

  test('shows each experiment with its stage', async ({ page }) => {
    await page.goto('/lab');
    const cards = page.locator('article.exp');
    await expect(cards).toHaveCount(3);
    for (const name of ['Habitat', 'Ripple', 'Arvo']) {
      const card = cards.filter({ hasText: name });
      await expect(card).toContainText('Idea');
      await expect(card.getByRole('img', { name: /Stage: Idea/ })).toBeVisible();
    }
  });
});

test.describe('shelf', () => {
  test('filters by status and type', async ({ page }) => {
    await page.goto('/shelf');
    const count = page.locator('.shelf-count');
    await expect(count).toHaveText('4 of 4');
    await page.getByRole('button', { name: 'Finished' }).click();
    await expect(count).toHaveText('2 of 4');
    await page.getByRole('button', { name: 'Paper' }).click();
    await expect(page.getByText('Nothing matches those filters yet.')).toBeVisible();
    await page.getByRole('button', { name: 'All types' }).click();
    await page.getByRole('button', { name: 'Reading now' }).click();
    await expect(count).toHaveText('1 of 4');
    await expect(page.getByRole('button', { name: 'Reading now' })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
  });
});

test.describe('discovery files', () => {
  test('every sitemap URL resolves to the matching local page', async ({ page, request }) => {
    const robots = await request.get('/robots.txt');
    expect(await robots.text()).toContain('Sitemap: https://www.aravindd.com/sitemap.xml');
    const xml = await (await request.get('/sitemap.xml')).text();
    const paths = [...xml.matchAll(/<loc>https:\/\/www\.aravindd\.com([^<]*)<\/loc>/g)].map(
      (m) => m[1] || '/',
    );
    expect(paths.length).toBeGreaterThanOrEqual(7);
    for (const path of paths) {
      const res = await page.request.get(path);
      expect(res.status(), path).toBe(200);
    }
  });
});
