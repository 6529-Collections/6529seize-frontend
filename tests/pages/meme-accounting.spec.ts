import { test, expect } from '@playwright/test';

test.describe('Meme Accounting Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/meme-accounting');
    
    await expect(page).toHaveTitle('Meme Accounting | 6529 SEIZE');
    
    // Check for the Royalties component
    const royaltiesComponent = page.locator('table');
    await expect(royaltiesComponent).toBeVisible();
    
    const header = page.locator('h1');
    await expect(header).toBeVisible();
  });
});
