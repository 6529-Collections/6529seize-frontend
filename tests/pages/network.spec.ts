import { test, expect } from "@playwright/test";

test.describe("Network Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
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
