import { expect, test } from '@playwright/test';

// Skip the first-run demo seed and the install banner so each test drives a
// clean, deterministic app. Runs before any page script on every navigation.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ht-seeded', '1');
    localStorage.setItem('ht-install-dismissed', '1');
  });
});

test('add a habit, mark today, and persist across reload', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByRole('heading', { name: 'No habits yet' })).toBeVisible();

  await page.getByPlaceholder('Read for 20 minutes').fill('Meditate');
  await page.getByRole('button', { name: 'Add habit' }).click();

  const markDone = page.getByRole('button', { name: 'Mark Meditate as done today' });
  await expect(markDone).toBeVisible();
  await markDone.click();

  const markNotDone = page.getByRole('button', { name: 'Mark Meditate as not done today' });
  await expect(markNotDone).toBeVisible();

  // The heatmap appears once a habit exists and reflects today's single mark.
  await expect(page.getByRole('region', { name: 'Last year' })).toBeVisible();
  await expect(page.getByText('Up to 1 per day')).toBeVisible();

  await page.reload();

  // Everything survived the reload because it lives in IndexedDB, not memory.
  await expect(page.getByRole('button', { name: 'Mark Meditate as not done today' })).toBeVisible();
  await expect(page.getByText('Up to 1 per day')).toBeVisible();
});
