import type { Page } from '@playwright/test';

/** Follows a main-nav link: from the inline nav on wide screens, from the Menu on phones. */
export async function followNavLink(page: Page, name: string) {
  const summary = page.locator('.nav-menu summary');
  if (await summary.isVisible()) {
    await summary.click();
    await page.locator('.nav-sheet').getByRole('link', { name, exact: true }).click();
  } else {
    await page.locator('.nav-main').getByRole('link', { name, exact: true }).click();
  }
}
