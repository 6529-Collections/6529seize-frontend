import { test, expect } from '@playwright/test';

test('homepage has a heading', async ({ page }) => {
  await page.goto('/');

  // Wait for the page to be more fully loaded
  await page.waitForLoadState('domcontentloaded');

  // Check if a visible h1 element exists on the page
  // This is often more reliable than title for default pages
  await expect(page.locator('h1')).toBeVisible();
});

// Add more tests here as the application develops
// Example: test navigation, form submissions, etc. 
