import { test, expect } from "@playwright/test";

test.describe("NFT Activity Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/nft-activity");
  });

  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("NFT Activity | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("NFT Activity");
    await expect(heading).toBeVisible();

    const latestActivityComponent = page.locator("table");
    await expect(latestActivityComponent).toBeVisible();
  });
});
