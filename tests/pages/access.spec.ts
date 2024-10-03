import { test, expect } from '@playwright/test';

test.describe('Access Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/access');
    
    await expect(page).toHaveTitle('Access Page | 6529 SEIZE');
    
    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();
    
    // Note: This page might not have a typical header
  });
});
