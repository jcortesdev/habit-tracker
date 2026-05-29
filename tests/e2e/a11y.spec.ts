import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

test('empty state has no accessibility violations', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ht-seeded', '1');
    localStorage.setItem('ht-install-dismissed', '1');
  });
  await page.goto('/');
  await expect(page.getByRole('heading', { name: 'No habits yet' })).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});

test('populated demo state has no accessibility violations', async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ht-install-dismissed', '1');
  });
  await page.goto('/');
  await expect(page.getByRole('region', { name: 'Last year' })).toBeVisible();

  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(violations).toEqual([]);
});
