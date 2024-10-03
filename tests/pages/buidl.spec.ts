import { test, expect } from '@playwright/test';

test.describe('BUIDL Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/buidl');
    
    await expect(page).toHaveTitle('BUIDL | 6529 SEIZE');
    
    const heading = page.locator('h4');
    await expect(heading).toContainText('We are going to BUIDL together');
  });
});
