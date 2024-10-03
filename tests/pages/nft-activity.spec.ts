import { test, expect } from '@playwright/test';

test.describe('NFT Activity Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/nft-activity');
    
    await expect(page).toHaveTitle('NFT Activity | 6529 SEIZE');
    
    // Check for the LatestActivity component
    const latestActivityComponent = page.locator('table');
    await expect(latestActivityComponent).toBeVisible();
    
    const header = page.locator('h1');
    await expect(header).toBeVisible();
  });
});
