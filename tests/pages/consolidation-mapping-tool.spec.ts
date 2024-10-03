import { test, expect } from '@playwright/test';

test.describe('Consolidation Mapping Tool Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/consolidation-mapping-tool');
    
    await expect(page).toHaveTitle('Consolidation Mapping Tool | 6529 SEIZE');
    
    const heading = page.locator('h1');
    await expect(heading).toContainText('Consolidation Mapping Tool');
  });
});
