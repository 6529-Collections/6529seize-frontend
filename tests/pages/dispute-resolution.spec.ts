import { test, expect } from '@playwright/test';

test.describe('Dispute Resolution Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/dispute-resolution');
    
    await expect(page).toHaveTitle('Dispute Resolution | 6529 SEIZE');
    
    const heading = page.locator('h1');
    await expect(heading).toContainText('Dispute Resolution');
    
    const header = page.locator('h1');
    await expect(header).toBeVisible();
  });
});
