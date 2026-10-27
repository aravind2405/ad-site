import { expect, test as base, type BrowserContext } from '@playwright/test';

/**
 * WebKit enforces the production CSP directive `upgrade-insecure-requests` even on plain
 * http://127.0.0.1, so it rewrites every script and stylesheet request to https and the page never
 * hydrates. Real visitors are always on https and are unaffected. For WebKit runs only, the test
 * browser drops that one directive from the response; the production headers are unchanged and are
 * covered by src/config.test.ts.
 */
export async function allowPlainHttpInWebKit(context: BrowserContext, browserName: string) {
  if (browserName !== 'webkit') return;
  await context.route('**/*', async (route) => {
    try {
      const response = await route.fetch({ maxRedirects: 0 });
      // WebKit stalls when handed a redirect, and a redirect carries no page to adjust.
      if (response.status() >= 300 && response.status() < 400) return await route.continue();
      const headers = { ...response.headers() };
      // The body is handed over already decoded, so its encoding and length headers no longer apply.
      delete headers['content-encoding'];
      delete headers['content-length'];
      const csp = headers['content-security-policy'];
      if (csp) {
        headers['content-security-policy'] = csp
          .split(';')
          .filter((part) => part.trim() !== 'upgrade-insecure-requests')
          .join(';');
      }
      await route.fulfill({ status: response.status(), headers, body: await response.body() });
    } catch {
      // A request still in flight when its test ends has nobody left to answer.
    }
  });
}

export const test = base.extend({
  context: async ({ context, browserName }, provide) => {
    await allowPlainHttpInWebKit(context, browserName);
    await provide(context);
  },
});

export { expect };
