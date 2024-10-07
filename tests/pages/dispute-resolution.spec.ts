import { test, expect } from "@playwright/test";

test.describe("Dispute Resolution Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/dispute-resolution");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Dispute Resolution | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Dispute Resolution");
    await expect(heading).toBeVisible();
  });
});
