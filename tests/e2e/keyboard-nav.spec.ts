import { expect, test } from '@playwright/test';

// Let the demo seed run so the heatmap has data and navigable cells; just mute
// the install banner.
test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('ht-install-dismissed', '1');
  });
});

test('arrow keys move focus across heatmap cells (roving tabindex)', async ({ page }) => {
  await page.goto('/');

  // Visible only after the demo seed lands and habits load.
  await expect(page.getByRole('region', { name: 'Last year' })).toBeVisible();

  // Exactly one cell is in the tab order at a time; it defaults to today.
  const focusable = page.locator('rect[tabindex="0"]');
  await expect(focusable).toHaveCount(1);
  const todayLabel = await focusable.getAttribute('aria-label');

  await focusable.focus();
  await page.keyboard.press('ArrowLeft');

  // Focus (and the single tabindex=0) moved to the previous week's cell.
  const moved = page.locator('rect[tabindex="0"]');
  await expect(moved).toHaveCount(1);
  await expect(moved).toBeFocused();
  expect(await moved.getAttribute('aria-label')).not.toBe(todayLabel);
});
