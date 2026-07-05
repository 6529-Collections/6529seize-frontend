import { test, expect } from "../testHelpers";

test.describe("Network Activity Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/network/activity");
  });

  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Activity | Network");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Network Activity");
    await expect(heading).toBeVisible();
  });
});
