import { test, expect } from '../testHelpers';

test.describe("NFT Activity Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
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
