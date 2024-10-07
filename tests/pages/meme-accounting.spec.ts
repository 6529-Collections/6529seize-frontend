import { test, expect } from '../testHelpers';

test.describe("Meme Accounting Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/meme-accounting");
  });

  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Meme Accounting | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Meme Accounting");
    await expect(heading).toBeVisible();

    // Check for the Royalties component
    const royaltiesComponent = page.locator("table");
    await expect(royaltiesComponent).toBeVisible();
  });
});
