import { test, expect } from '@playwright/test';

test('homepage has expected title', async ({ page }) => {
  await page.goto('/');

  // Expect a title "to contain" a substring.
  // Replace with the actual expected title when the app is built
  await expect(page).toHaveTitle(/6529/);
});

// Add more tests here as the application develops
// Example: test navigation, form submissions, etc. 
