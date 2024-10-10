import { test, expect } from '../testHelpers';

test.describe("Network Stats Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/network/stats");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Stats | Network");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Network Stats");
    await expect(heading).toBeVisible();
  });
});
