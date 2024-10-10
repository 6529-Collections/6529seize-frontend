import { test, expect } from '../testHelpers';

test.describe("Network Metrics Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/network/metrics");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Metrics | Network");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Network Metrics");
    await expect(heading).toBeVisible();
  });
});
