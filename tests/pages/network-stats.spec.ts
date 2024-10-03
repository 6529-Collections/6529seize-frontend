import { test, expect } from '@playwright/test';

test.describe('Network Stats Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/network/stats');
    
    await expect(page).toHaveTitle('Stats | Network');
        
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toContainText('Network Stats');
  });
});
