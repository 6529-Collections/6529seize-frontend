import { test, expect } from '@playwright/test';

test.describe('Network Metrics Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/network/metrics');
    
    await expect(page).toHaveTitle('Metrics | Network');
    
    const heading = page.locator('h1');
    await expect(heading).toContainText('Network Metrics');
  });
});
