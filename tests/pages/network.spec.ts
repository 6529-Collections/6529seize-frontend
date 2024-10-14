import { test, expect } from '../testHelpers';

test.describe("Network Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/network");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Network | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Network");
    await expect(heading).toBeVisible();
    
    // Check for the CommunityMembers component
    const table = page.locator("table");
    await expect(table).toBeVisible();
  });
});
