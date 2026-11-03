import { test, expect } from "../testHelpers";

test.describe("NFT Activity Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/nft-activity");
  });

  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("NFT Activity | Network");

    const heading = page.locator("main h1:visible");
    await expect(heading).toContainText("NFT Activity");
    await expect(heading).toBeVisible();

    const latestActivityComponent = page.locator("table");
    await expect(latestActivityComponent).toBeVisible();
  });
});
