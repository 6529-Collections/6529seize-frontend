import { expect, test } from "../testHelpers";

test.describe("Network Stats Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/network/health/network-tdh");
  });

  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Stats | Network");

    const heading = page.locator("main h1:visible");
    await expect(heading).toContainText("Network Stats");
    await expect(heading).toBeVisible();
  });
});
