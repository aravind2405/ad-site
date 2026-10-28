import { allowPlainHttpInWebKit, expect, test } from './fixtures';
import { followNavLink } from './helpers';

const routes = [
  { path: '/', h1: "Hi, I'm Aravind." },
  { path: '/projects/rentlens', h1: 'What are tenants actually paying across NSW?' },
  { path: '/projects/ontimesydney', h1: "How on time are Sydney's buses, really?" },
  { path: '/projects/gridwatch', h1: 'What is the power grid doing right now?' },
  { path: '/projects/groundtruth', h1: 'Can an AI answer policy questions, and can I prove it?' },
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
  test('the top bar stays in view while scrolling', async ({ page, isMobile }) => {
    test.skip(isMobile, 'phones hide the header on scroll down by design');
    await page.goto('/');
    const header = page.locator('header.site-header');
    await expect(header).toBeVisible();
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(300);
    const box = await header.boundingBox();
    expect(box?.y).toBeLessThanOrEqual(1);
    await expect(header).toBeInViewport();
    // The bar is a tint of the page behind it (blurred), at least 85% solid so text stays readable.
    const bg = await header.evaluate((el) => getComputedStyle(el, '::before').backgroundColor);
    const alpha = Number(/\/\s*([\d.]+)\)/.exec(bg)?.[1] ?? 1);
    expect(alpha).toBeGreaterThanOrEqual(0.85);
    await followNavLink(page, 'Curiosity Lab');
    await expect(page).toHaveURL(/\/lab$/);
  });

  test('each nav link opens its page or lands on its section below the sticky bar', async ({
    page,
  }) => {
    await page.goto('/');
    for (const [name, id] of [
      ['Projects', 'projects'],
      ['Contact', 'contact'],
    ]) {
      await followNavLink(page, name);
      await expect(page).toHaveURL(new RegExp(`#${id}$`));
      const heading = page.locator(`#${id} h2`).first();
      await expect(heading).toBeInViewport();
      const bar = (await page.locator('header.site-header').boundingBox())!;
      const top = (await heading.boundingBox())!.y;
      expect(top, `${name} heading is hidden behind the nav`).toBeGreaterThanOrEqual(
        bar.y + bar.height,
      );
    }
    await followNavLink(page, 'Curiosity Lab');
    await expect(page).toHaveURL(/\/lab$/);
  });

  test('the top bar on the Lab page is dark, not pale', async ({ page }) => {
    await page.goto('/lab');
    const tint = await page.evaluate(() => {
      const header = document.querySelector('.site-header')!;
      const layer = getComputedStyle(header, '::before').backgroundColor;
      const m = /rgba?\((\d+)[ ,]+(\d+)[ ,]+(\d+)/.exec(layer);
      const lab = /color\(srgb ([\d.]+) ([\d.]+) ([\d.]+)/.exec(layer);
      if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];
      return lab ? [Number(lab[1]) * 255, Number(lab[2]) * 255, Number(lab[3]) * 255] : null;
    });
    expect(tint, 'the bar layer has a colour').not.toBeNull();
    for (const channel of tint!) expect(channel).toBeLessThan(60);
  });

  test('highlights the section on screen while scrolling the home page', async ({ page }) => {
    await page.goto('/');
    await page.waitForFunction(() => document.documentElement.classList.contains('stage-on'));
    // measure the highlight without the snapping pulling the page to a page edge
    await page.addStyleTag({ content: 'html { scroll-snap-type: none !important; }' });
    const current = page.locator('.nav-links a[aria-current="location"]');
    for (const [id, label] of [
      ['projects', 'Projects'],
      ['lab', 'Curiosity Lab'],
      ['contact', 'Contact'],
    ]) {
      await page.locator(`#${id}`).scrollIntoViewIfNeeded();
      await page.evaluate((target) => {
        const el = document.getElementById(target)!;
        const rect = el.getBoundingClientRect();
        window.scrollBy(0, rect.top + rect.height / 2 - innerHeight / 2);
      }, id);
      await expect(current.first(), id).toHaveText(label);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    await expect(current).toHaveCount(0);
  });

  test('works as a menu on phones: opens, follows a link, closes on Escape', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'the menu is for phone-sized screens');
    await page.goto('/');
    const summary = page.locator('.nav-menu summary');
    await expect(summary).toBeVisible();
    await expect(page.locator('.nav-main')).toBeHidden();
    await summary.click();
    await expect(page.locator('.nav-sheet').getByRole('link')).toHaveCount(3);
    await page.keyboard.press('Escape');
    await expect(page.locator('.nav-menu')).not.toHaveAttribute('open', '');
    await expect(summary).toBeFocused();
    await summary.click();
    await page.locator('.nav-sheet').getByRole('link', { name: 'Curiosity Lab' }).click();
    await expect(page).toHaveURL(/\/lab$/);
  });

  test('marks the current page in the menu', async ({ page }) => {
    await page.goto('/lab');
    const nav = page.locator('.nav-main');
    const link = (name: string) => nav.getByRole('link', { name, includeHidden: true });
    await expect(link('Curiosity Lab')).toHaveAttribute('aria-current', 'page');
    await page.goto('/projects/ontimesydney');
    await expect(link('Projects')).toHaveAttribute('aria-current', 'page');
  });

  test('has a working skip link', async ({ page, browserName }) => {
    await page.goto('/');
    // Safari only Tabs to links when Option is held (its default setting), unlike Chrome.
    await page.keyboard.press(browserName === 'webkit' ? 'Alt+Tab' : 'Tab');
    const skip = page.getByRole('link', { name: 'Skip to main content' });
    await expect(skip).toBeFocused();
    await expect(skip).toBeInViewport();
    await page.keyboard.press('Enter');
    await expect(page.locator('#main')).toBeFocused();
  });

  test('moves /rentlens to the project page', async ({ page, request, browserName }) => {
    const res = await request.get('/rentlens', { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()['location']).toBe('/projects/rentlens');
    // Playwright's request interception stalls on redirects in WebKit, so the page-level
    // navigation runs in Chromium only; the redirect itself is checked above in every browser.
    if (browserName === 'webkit') return;
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

  test('shows two equal project cards and names the next two in one quiet line', async ({
    page,
  }) => {
    await page.goto('/');
    const cards = page.locator('article.project-card');
    await expect(cards).toHaveCount(2);
    for (const slug of ['rentlens', 'ontimesydney']) {
      await expect(page.locator(`a[href="/projects/${slug}"]`)).toHaveCount(1);
    }
    // Planned projects keep their pages but are not linked from the grid or anywhere on the home page.
    for (const slug of ['gridwatch', 'groundtruth']) {
      await expect(page.locator(`a[href="/projects/${slug}"]`)).toHaveCount(0);
    }
    await expect(page.locator('.next-up')).toHaveText(
      'Next up: GridWatch AU (grid data on AWS) and GroundTruth (evaluated AI search).',
    );
    expect((await page.locator('.tag').allInnerTexts()).join(' ')).not.toContain('planned');
    await expect(page.locator('.eyebrow', { hasText: 'Work' })).toHaveCount(0);
  });

  test('every grid card shows its status and updated date', async ({ page }) => {
    await page.goto('/');
    for (const card of await page.locator('article.project-card').all()) {
      await expect(card.locator('.pill')).toBeVisible();
      await expect(card.locator('.card-updated')).toHaveText(/^Updated \d{1,2} \w{3} \d{4}$/);
    }
  });

  test('the hero has the headline, subline and credentials and one cue to scroll', async ({
    page,
  }) => {
    await page.goto('/');
    const hero = page.locator('.hero-shell');
    await expect(hero.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(hero.locator('.sub')).toBeVisible();
    await expect(hero.locator('.creds')).toContainText('Master of IT');
    // the only link is the cue that points at the next page
    await expect(hero.getByRole('link')).toHaveCount(1);
    await expect(hero.getByRole('link', { name: /Projects/ })).toHaveAttribute('href', '#projects');
    await expect(hero.getByRole('button')).toHaveCount(0);
  });

  test('the nav lists exactly Projects, Curiosity Lab and Contact', async ({ page }) => {
    await page.goto('/');
    const nav = page.getByRole('navigation', { name: 'Main' });
    const names = (
      await nav.locator('.nav-links').getByRole('link', { includeHidden: true }).allTextContents()
    ).map((t) => t.trim());
    // The menu on very narrow phones repeats the same links; compare each distinct label once.
    expect([...new Set(names)].sort()).toEqual(['Contact', 'Curiosity Lab', 'Projects']);
    await expect(nav.getByRole('link', { name: 'Shelf' })).toHaveCount(0);
  });

  test('the first screen is the hero alone, with a cue to the projects page below', async ({
    page,
  }) => {
    await page.goto('/');
    const viewportHeight = page.viewportSize()!.height;
    const hero = (await page.locator('.hero-shell').boundingBox())!;
    const header = (await page.locator('header.site-header').boundingBox())!;
    expect(hero.y + hero.height, 'the hero is exactly one screen').toBeCloseTo(viewportHeight, -1);
    expect(header.height + hero.height).toBeCloseTo(viewportHeight, -1);
    await expect(page.locator('.scroll-cue')).toBeInViewport();
    const card = (await page.locator('article.project-card').first().boundingBox())!;
    expect(
      card.y,
      'the projects are the next page, not squeezed under the hero',
    ).toBeGreaterThanOrEqual(viewportHeight);
  });

  test('the project slides sit in one row, all equal', async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() =>
      document.getElementById('projects')!.scrollIntoView({ behavior: 'instant' }),
    );
    // the page eases its content in as it arrives, so wait until it is on screen
    await page.waitForTimeout(150);
    const [a, b] = await page.locator('article.project-card').all();
    // layout size, so the slight turn a neighbouring slide shows does not count
    const size = (el: typeof a) =>
      el.evaluate((n) => {
        const e = n as HTMLElement;
        return { w: e.offsetWidth, h: e.offsetHeight, top: e.offsetTop, left: e.offsetLeft };
      });
    const boxA = await size(a);
    const boxB = await size(b);
    expect(Math.abs(boxA.w - boxB.w)).toBeLessThan(1);
    expect(Math.abs(boxA.h - boxB.h)).toBeLessThan(1);
    expect(Math.abs(boxA.top - boxB.top)).toBeLessThan(1);
    expect(boxB.left).toBeGreaterThan(boxA.left + boxA.w - 1);
    // No flagship: every card has the same parts.
    for (const card of [a, b]) {
      await expect(card.locator('h3 a')).toHaveCount(1);
      await expect(card.locator('.problem')).toHaveCount(1);
      await expect(card.locator('.tag').first()).toBeVisible();
    }
  });

  test('each slide shows how the project works, and says when the pipeline is only planned', async ({
    page,
    isMobile,
  }) => {
    test.skip(isMobile, 'the pipeline line is for screens wide enough to show it');
    await page.goto('/');
    const rentlens = page.locator('article.project-card', { hasText: 'RentLens' });
    await expect(rentlens.locator('.pipe-label')).toHaveText('How it works');
    await expect(rentlens.locator('.pipe li')).toHaveCount(7);
    await expect(rentlens.locator('.pipe li').first()).toHaveText('NSW Fair Trading spreadsheets');
    const bus = page.locator('article.project-card', { hasText: 'OnTimeSydney' });
    await expect(bus.locator('.pipe-label')).toHaveText('Planned pipeline');
  });

  test('the buttons move between project slides on desktop', async ({ page, isMobile }) => {
    test.skip(isMobile, 'a phone swipes instead');
    await page.goto('/');
    const count = page.locator('.carousel-count');
    const next = page.getByRole('button', { name: 'Next project' });
    const previous = page.getByRole('button', { name: 'Previous project' });
    await expect(count).toHaveText('Project 1 of 2');
    await expect(previous).toBeDisabled();
    await next.click();
    await expect(count).toHaveText('Project 2 of 2');
    await expect(next).toBeDisabled();
    await previous.click();
    await expect(count).toHaveText('Project 1 of 2');
  });

  test('card repo and live links open in a new tab safely', async ({ page }) => {
    await page.goto('/');
    const links = page.locator('article.project-card .card-links a');
    expect(await links.count()).toBeGreaterThanOrEqual(3);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
  });

  test('the Curiosity Lab band shows three experiments with honest stages and a way in', async ({
    page,
  }) => {
    await page.goto('/');
    const band = page.locator('#lab');
    await expect(band.getByRole('heading', { level: 2, name: 'Curiosity Lab' })).toBeVisible();
    const tiles = band.locator('.lab-tile');
    await expect(tiles).toHaveCount(3);
    for (const name of ['Habitat', 'Ripple', 'Arvo']) {
      const tile = tiles.filter({ hasText: name });
      await expect(tile).toHaveCount(1);
      await expect(tile.locator('.stage-badge')).toHaveText(/^(Idea|Building|Shipped)$/);
    }
    await band.getByRole('link', { name: /Enter the Lab/ }).click();
    await expect(page).toHaveURL(/\/lab$/);
  });

  test('the contact band keeps its current copy and LinkedIn and GitHub links', async ({
    page,
  }) => {
    await page.goto('/');
    const contact = page.locator('#contact');
    await expect(contact.getByRole('heading', { level: 2 })).toHaveText("Let's talk");
    await expect(contact).toContainText('open to graduate and internship roles from Jan 2027');
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

  test('started projects follow the same five sections in the same order', async ({ page }) => {
    for (const slug of ['rentlens', 'ontimesydney']) {
      await page.goto(`/projects/${slug}`);
      const headings = await page.locator('main h2').allTextContents();
      expect(headings, slug).toEqual([
        'Problem',
        'Architecture',
        'Key decisions',
        'Evidence',
        'Known limitations',
      ]);
      const ids = await page.locator('main section[id]').evaluateAll((els) => els.map((e) => e.id));
      expect(ids, slug).toEqual([
        'problem',
        'architecture',
        'decisions',
        'evidence',
        'limitations',
      ]);
    }
  });

  test('planned projects show only the problem and what the case study will cover', async ({
    page,
  }) => {
    for (const slug of ['gridwatch', 'groundtruth']) {
      await page.goto(`/projects/${slug}`);
      expect(await page.locator('main h2').allTextContents(), slug).toEqual(['Problem']);
      await expect(page.getByRole('heading', { name: 'What it will cover' })).toBeVisible();
    }
  });

  test('key decisions link to the repo decision records and evidence links open safely', async ({
    page,
  }) => {
    await page.goto('/projects/rentlens');
    const adr = page.locator('.adr-links a');
    await expect(adr).toHaveCount(1);
    await expect(adr).toHaveAttribute(
      'href',
      'https://github.com/aravind2405/rentlens-nsw/blob/main/docs/decisions/001-duckdb-first.md',
    );
    const links = page.locator('#evidence .facts a, #decisions .adr-links a');
    expect(await links.count()).toBeGreaterThanOrEqual(3);
    for (const link of await links.all()) {
      await expect(link).toHaveAttribute('target', '_blank');
      await expect(link).toHaveAttribute('rel', /noopener/);
    }
    await expect(page.locator('#evidence .facts')).toContainText('Live demo');
    await expect(page.locator('#evidence iframe.dash')).toHaveCount(1);
  });

  test('stack tags list only tools the repo uses, and the unbuilt design says so', async ({
    page,
  }) => {
    await page.goto('/projects/ontimesydney');
    const tags = await page.locator('.detail-head .tag').allTextContents();
    expect(tags).toEqual(['Python', 'pytest', 'ruff', 'GitHub Actions']);
    await expect(page.locator('.planned-note')).toContainText('not a running system');
    await expect(page.locator('#decisions .none-yet')).toBeVisible();
  });

  test('RentLens draws its architecture diagram without errors or sideways scrolling', async ({
    page,
    isMobile,
  }) => {
    const problems: string[] = [];
    page.on('console', (m) => {
      if (m.type() === 'error') problems.push(m.text());
    });
    page.on('pageerror', (e) => problems.push(e.message));
    await page.goto('/projects/rentlens');
    const diagram = page.locator('.diagram');
    await expect(diagram).toHaveAttribute('data-state', 'waiting');
    await diagram.scrollIntoViewIfNeeded();
    await expect(diagram).toHaveAttribute('data-state', 'drawn');
    const svg = diagram.locator('svg');
    await expect(svg).toHaveCount(1);
    await expect(diagram).toHaveAttribute('role', 'img');
    await expect(diagram).toHaveAttribute('aria-label', /NSW Fair Trading.*DuckDB/s);
    await expect(diagram).not.toContainText(/syntax error|error in text|parse error/i);
    for (const word of ['Source', 'Ingestion', 'Transformation', 'Storage', 'Output', 'DuckDB']) {
      await expect(diagram).toContainText(word);
    }
    // Vertical on phones, horizontal on wide screens.
    const box = (await svg.boundingBox())!;
    if (isMobile) expect(box.height).toBeGreaterThan(box.width);
    else expect(box.width).toBeGreaterThan(box.height);
    // It fits: nothing makes the page scroll sideways, and the picture stays inside its frame.
    const frame = (await diagram.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(frame.x - 1);
    expect(box.x + box.width).toBeLessThanOrEqual(frame.x + frame.width + 1);
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    // Once drawn, the plain step list steps aside; the label above carries the steps.
    await expect(page.locator('ol.flow')).toBeHidden();
    expect(problems).toEqual([]);
  });

  test('without JavaScript the architecture is still readable as a step list', async ({
    browser,
    browserName,
  }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    await allowPlainHttpInWebKit(context, browserName);
    const page = await context.newPage();
    await page.goto('/projects/rentlens');
    await expect(page.locator('ol.flow')).toBeVisible();
    await expect(page.locator('ol.flow li')).toHaveCount(7);
    await context.close();
  });

  test('a project with no diagram keeps the plain step list', async ({ page }) => {
    await page.goto('/projects/ontimesydney');
    await expect(page.locator('.diagram')).toHaveCount(0);
    await expect(page.locator('ol.flow')).toBeVisible();
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

  test('project pages end with previous and next project links', async ({ page }) => {
    await page.goto('/projects/rentlens');
    const exits = page.getByRole('navigation', { name: 'More projects' });
    await expect(exits.getByRole('link', { name: /Next project/ })).toBeVisible();
    await expect(exits.getByRole('link', { name: /Previous project/ })).toBeVisible();
    await expect(page.locator('.toc, .read-time')).toHaveCount(0);
  });

  test('RentLens shows its design decision as a trade-offs table', async ({ page }) => {
    await page.goto('/projects/rentlens');
    const table = page.locator('table.tradeoffs');
    await expect(table).toContainText('Watermark on the arrival time of each file');
    await expect(table.getByRole('columnheader')).toHaveCount(4);
  });

  test('the Projects nav link leads back to the projects list', async ({ page }) => {
    await page.goto('/projects/rentlens');
    await expect(page.getByRole('link', { name: '← All projects' })).toHaveCount(0);
    await followNavLink(page, 'Projects');
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

test.describe('removed pages', () => {
  test('the old shelf address permanently redirects to the home page', async ({
    page,
    request,
    browserName,
  }) => {
    const res = await request.get('/shelf', { maxRedirects: 0 });
    expect(res.status()).toBe(308);
    expect(res.headers()['location']).toBe('/');
    // See the /rentlens test: page-level redirects are not driven in WebKit.
    if (browserName === 'webkit') return;
    await page.goto('/shelf');
    await expect(page).toHaveURL(/\/$/);
    await expect(page.getByRole('link', { name: 'Shelf' })).toHaveCount(0);
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
    expect(paths).toHaveLength(6);
    for (const path of paths) {
      const res = await page.request.get(path);
      expect(res.status(), path).toBe(200);
    }
  });
});

test.describe('engineering', () => {
  test('unknown addresses get a styled 404 that links home and to projects', async ({ page }) => {
    const response = await page.goto('/no-such-page');
    expect(response?.status()).toBe(404);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('This page does not exist');
    await expect(page.getByRole('link', { name: 'Go to the home page' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'See my projects' })).toBeVisible();
  });

  test('the home page carries Person data and project pages carry SoftwareSourceCode', async ({
    page,
  }) => {
    const read = async (path: string) => {
      await page.goto(path);
      const raw = await page.locator('script[type="application/ld+json"]').allTextContents();
      return raw.map((r) => JSON.parse(r) as Record<string, unknown>);
    };
    const [person] = await read('/');
    expect(person['@type']).toBe('Person');
    expect(person.name).toBe('Aravind Danassegarane');
    const [code] = await read('/projects/rentlens');
    expect(code['@type']).toBe('SoftwareSourceCode');
    expect(code.codeRepository).toBe('https://github.com/aravind2405/rentlens-nsw');
    // A project with no repository has no code to describe.
    expect(await read('/projects/gridwatch')).toHaveLength(0);
  });

  test('every page has a 1200x630 Open Graph image', async ({ page }) => {
    for (const path of ['/', '/lab', '/projects/rentlens', '/projects/gridwatch']) {
      await page.goto(path);
      const content = await page.locator('meta[property="og:image"]').getAttribute('content');
      expect(content, path).toBeTruthy();
      const url = new URL(content!);
      const res = await page.request.get(url.pathname);
      expect(res.status(), path).toBe(200);
      expect(res.headers()['content-type'], path).toContain('image/png');
      const png = await res.body();
      expect(png.readUInt32BE(16), `${path} width`).toBe(1200);
      expect(png.readUInt32BE(20), `${path} height`).toBe(630);
    }
  });

  test('content stays visible without JavaScript', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    await allowPlainHttpInWebKit(context, browser.browserType().name());
    const page = await context.newPage();
    await page.goto('/');
    await expect(page.locator('#contact')).toBeVisible();
    const opacity = await page.locator('#contact').evaluate((el) => getComputedStyle(el).opacity);
    expect(opacity).toBe('1');
    await context.close();
  });

  test('buttons and cards use the spring easings only for people who allow motion', async ({
    browser,
  }) => {
    for (const [reducedMotion, expectSpring] of [
      ['no-preference', true],
      ['reduce', false],
    ] as const) {
      const context = await browser.newContext({ reducedMotion });
      await allowPlainHttpInWebKit(context, browser.browserType().name());
      const page = await context.newPage();
      await page.goto('/');
      const timing = await page
        .locator('.project-card')
        .first()
        .evaluate((el) => getComputedStyle(el).transitionTimingFunction);
      expect(timing.includes('linear('), reducedMotion).toBe(expectSpring);
      await context.close();
    }
  });

  test('sections reveal after opening a project from the home page', async ({ page }) => {
    await page.goto('/');
    await page.locator('.project-card a[href="/projects/rentlens"]').first().click();
    await expect(page).toHaveURL(/\/projects\/rentlens$/);
    const live = page.locator('.tone .reveal').first();
    await live.scrollIntoViewIfNeeded();
    await expect(live).toHaveClass(/\bin\b/);
    await expect(live).toHaveCSS('opacity', '1');
  });
});
