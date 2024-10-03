import { test, expect } from '@playwright/test';

test.describe('Consolidation Use Cases Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/consolidation-use-cases');
    
    await expect(page).toHaveTitle('Consolidation Use Cases | 6529 SEIZE');
    
    const heading = page.locator('h1');
    await expect(heading).toContainText('Consolidation Use Cases');
  });
});
