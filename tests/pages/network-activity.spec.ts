import { test, expect } from "@playwright/test";

test.describe("Network Activity Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/network/activity");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Network Activity | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Network Activity");
    await expect(heading).toBeVisible();
  });
});
