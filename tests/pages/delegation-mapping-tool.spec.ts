import { test, expect } from '@playwright/test';

test.describe('Delegation Mapping Tool Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/delegation-mapping-tool');
    
    await expect(page).toHaveTitle('Delegation Mapping Tool | 6529 SEIZE');
    
    const heading = page.locator('h1');
    await expect(heading).toContainText('Delegation Mapping Tool');
  });
});
