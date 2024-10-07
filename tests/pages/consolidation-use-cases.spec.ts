import { test, expect } from "@playwright/test";

test.describe("Consolidation Use Cases Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/consolidation-use-cases");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Consolidation Use Cases | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Consolidation Use Cases");
    await expect(heading).toBeVisible();
  });
});
