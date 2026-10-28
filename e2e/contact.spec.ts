import type { Page, Route } from '@playwright/test';
import { expect, test } from './fixtures';

const message =
  'Hi Aravind, we have a graduate data engineer role. Are you free to talk this week?';

async function fill(
  page: Page,
  overrides: Partial<Record<'name' | 'email' | 'message', string>> = {},
) {
  const values = { name: 'Sam Recruiter', email: 'sam@example.org', message, ...overrides };
  await page.locator('#contact-name').fill(values.name);
  await page.locator('#contact-email').fill(values.email);
  await page.locator('#contact-message').fill(values.message);
}

/** Answers /api/contact so no real email is ever sent. */
async function mock(page: Page, respond: (route: Route) => Promise<void>) {
  const requests: unknown[] = [];
  await page.route('**/api/contact', async (route) => {
    requests.push(route.request().postDataJSON());
    await respond(route);
  });
  return requests;
}

const ok = (route: Route) => route.fulfill({ status: 200, json: { ok: true } });

test.describe('contact form', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('form', { name: 'Send me a message' })).toBeVisible();
  });

  test('a valid message shows the success state and sends only the form fields', async ({
    page,
  }) => {
    const requests = await mock(page, ok);
    await fill(page);
    await page.getByRole('button', { name: 'Send message' }).click();
    const done = page.getByRole('status');
    await expect(done).toContainText('Thanks, your message is sent.');
    await expect(done).toBeFocused();
    expect(requests).toEqual([
      { name: 'Sam Recruiter', email: 'sam@example.org', message, website: '' },
    ]);
  });

  test('empty or invalid input shows an inline error per field and sends nothing', async ({
    page,
  }) => {
    const requests = await mock(page, ok);
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('#contact-name-error')).toHaveText('Please tell me your name.');
    await expect(page.locator('#contact-email-error')).toContainText('valid email');
    await expect(page.locator('#contact-message-error')).toContainText('10 characters');
    await expect(page.locator('#contact-name')).toBeFocused();
    await expect(page.locator('#contact-name')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#contact-name')).toHaveAttribute(
      'aria-describedby',
      'contact-name-error',
    );
    expect(requests).toEqual([]);
    // Fixing one field clears its error on the next submit.
    await fill(page, { email: 'bad-address' });
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('#contact-name-error')).toHaveCount(0);
    await expect(page.locator('#contact-email')).toBeFocused();
    expect(requests).toEqual([]);
  });

  test('field errors from the server are shown next to their fields', async ({ page }) => {
    await mock(page, (route) =>
      route.fulfill({
        status: 400,
        json: {
          ok: false,
          error: 'Please check the highlighted fields.',
          errors: { email: 'Please enter a valid email address.' },
        },
      }),
    );
    await fill(page);
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('#contact-email-error')).toHaveText(
      'Please enter a valid email address.',
    );
    await expect(page.locator('#contact-email')).toBeFocused();
  });

  test('a failure shows a clear error and keeps what was typed', async ({ page }) => {
    for (const [status, text] of [
      [502, 'Your message could not be sent. Please try LinkedIn instead.'],
      [429, 'You have sent several messages recently. Please try again later, or use LinkedIn.'],
      [503, 'The contact form is not available right now. Please use LinkedIn.'],
    ] as const) {
      await page.unroute('**/api/contact').catch(() => undefined);
      await mock(page, (route) => route.fulfill({ status, json: { ok: false, error: text } }));
      await fill(page);
      await page.getByRole('button', { name: 'Send message' }).click();
      await expect(page.locator('.form-error')).toHaveText(text);
      await expect(page.locator('#contact-message')).toHaveValue(message);
    }
  });

  test('a network failure is reported, not swallowed', async ({ page }) => {
    await page.route('**/api/contact', (route) => route.abort());
    await fill(page);
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.locator('.form-error')).toContainText('Could not reach the site');
  });

  test('works with the keyboard alone', async ({ page, browserName }) => {
    // Safari only Tabs to buttons when Option is held (its default setting), unlike Chrome.
    const tab = browserName === 'webkit' ? 'Alt+Tab' : 'Tab';
    await mock(page, ok);
    await page.locator('#contact-name').focus();
    await page.keyboard.type('Sam Recruiter');
    await page.keyboard.press(tab);
    await expect(page.locator('#contact-email')).toBeFocused();
    await page.keyboard.type('sam@example.org');
    await page.keyboard.press(tab);
    await expect(page.locator('#contact-message')).toBeFocused();
    await page.keyboard.type(message);
    // The hidden bot trap is skipped: the next stop is the button.
    await page.keyboard.press(tab);
    await expect(page.getByRole('button', { name: 'Send message' })).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(page.getByRole('status')).toContainText('Thanks');
  });

  test('every field has a visible label, and the bot trap is out of sight and out of reach', async ({
    page,
  }) => {
    for (const name of ['Your name', 'Your email', 'Message']) {
      await expect(page.getByLabel(name, { exact: true })).toBeVisible();
    }
    const trap = page.locator('.field-trap');
    await expect(trap).toHaveAttribute('aria-hidden', 'true');
    await expect(page.locator('#contact-website')).toHaveAttribute('tabindex', '-1');
    const box = await trap.boundingBox();
    expect(box!.x + box!.width).toBeLessThan(0);
  });

  test('a message from a bot that fills the trap is still answered with a normal request', async ({
    page,
  }) => {
    const requests = await mock(page, ok);
    await fill(page);
    await page.locator('#contact-website').fill('https://spam.example', { force: true });
    await page.getByRole('button', { name: 'Send message' }).click();
    await expect(page.getByRole('status')).toBeVisible();
    expect(requests).toEqual([expect.objectContaining({ website: 'https://spam.example' })]);
  });
});
