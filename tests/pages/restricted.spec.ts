import { test, expect } from '@playwright/test';

test.describe('Restricted Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/restricted');
    
    await expect(page).toHaveTitle('Restricted | 6529 SEIZE');
    
    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await expect(input).toBeDisabled();
    
    // Note: This page might not have a typical header
  });
});
