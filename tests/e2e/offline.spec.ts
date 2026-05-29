import { expect, test } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ht-seeded', '1');
    localStorage.setItem('ht-install-dismissed', '1');
  });
});

test('habits can be marked while offline and the write persists', async ({ page, context }) => {
  await page.goto('/');

  await page.getByPlaceholder('Read for 20 minutes').fill('Stretch');
  await page.getByRole('button', { name: 'Add habit' }).click();
  await expect(page.getByRole('button', { name: 'Mark Stretch as done today' })).toBeVisible();

  // Cut the network entirely — the core loop must need zero requests.
  await context.setOffline(true);

  await page.getByRole('button', { name: 'Mark Stretch as done today' }).click();
  await expect(page.getByRole('button', { name: 'Mark Stretch as not done today' })).toBeVisible();

  // The toggle wrote straight to IndexedDB despite having no connectivity.
  const entryCount = await page.evaluate(
    () =>
      new Promise<number>((resolve, reject) => {
        const open = indexedDB.open('habit-tracker');
        open.onerror = () => reject(open.error);
        open.onsuccess = () => {
          const req = open.result.transaction('entries').objectStore('entries').count();
          req.onsuccess = () => resolve(req.result);
          req.onerror = () => reject(req.error);
        };
      })
  );
  expect(entryCount).toBeGreaterThan(0);

  await context.setOffline(false);
});
