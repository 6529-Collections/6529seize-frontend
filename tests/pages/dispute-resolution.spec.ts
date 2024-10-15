import { test, expect } from '../testHelpers';

test.describe("Dispute Resolution Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/dispute-resolution");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Dispute Resolution | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Dispute Resolution");
    await expect(heading).toBeVisible();
  });
});
