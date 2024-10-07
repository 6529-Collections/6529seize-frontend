import { test, expect } from "@playwright/test";

test.describe("Delegation Mapping Tool Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/delegation-mapping-tool");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Delegation Mapping Tool | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Delegation Mapping Tool");
    await expect(heading).toBeVisible();
  });
});
