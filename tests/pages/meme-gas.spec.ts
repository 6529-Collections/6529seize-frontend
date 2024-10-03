import { test, expect } from '@playwright/test';

test.describe('Meme Gas Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/meme-gas');
    
    await expect(page).toHaveTitle('Meme Gas | 6529 SEIZE');
    
    // Check for the Gas component
    const gasComponent = page.locator('table');
    await expect(gasComponent).toBeVisible();
    
    const header = page.locator('h1');
    await expect(header).toBeVisible();
  });
});
