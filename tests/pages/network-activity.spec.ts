import { test, expect } from '@playwright/test';

test.describe('Network Activity Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/network/activity');
    
    await expect(page).toHaveTitle('Network Activity | 6529 SEIZE');
    
    const heading = page.locator('h1');
    await expect(heading).toContainText('Network Activity');
    
    const header = page.locator('h1');
    await expect(header).toBeVisible();
  });
});
