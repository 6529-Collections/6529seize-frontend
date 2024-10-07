import { test, expect } from "@playwright/test";

test.describe("BUIDL Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/buidl");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("BUIDL | 6529 SEIZE");

    const heading = page.locator("h4");
    await expect(heading).toContainText("We are going to BUIDL together");
    await expect(heading).toBeVisible();
  });
});
