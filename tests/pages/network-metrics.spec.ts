import { test, expect } from "@playwright/test";

test.describe("Network Metrics Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/network/metrics");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Metrics | Network");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Network Metrics");
    await expect(heading).toBeVisible();
  });
});
