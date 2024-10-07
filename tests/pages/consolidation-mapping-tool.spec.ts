import { test, expect } from "@playwright/test";

test.describe("Consolidation Mapping Tool Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/consolidation-mapping-tool");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Consolidation Mapping Tool | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Consolidation Mapping Tool");
    await expect(heading).toBeVisible();
  });
});
