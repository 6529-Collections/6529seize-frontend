import { test, expect } from '@playwright/test';

test.describe('Network Page', () => {
  test('should load with correct header', async ({ page }) => {
    await page.goto('/network');
    
    await expect(page).toHaveTitle('Network | 6529 SEIZE');
    
    // Check for the CommunityMembers component
    const communityMembers = page.locator('h1');
    await expect(communityMembers).toBeVisible();
    await expect(communityMembers).toContainText('Network');
    
    const table = page.locator('table');
    await expect(table).toBeVisible();
  });
});
