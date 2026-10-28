import type { Page } from '@playwright/test';

/** Follows a main-nav link. The links sit in the bar at every screen size. */
export async function followNavLink(page: Page, name: string) {
  await page.locator('.nav-main').getByRole('link', { name, exact: true }).click();
}
