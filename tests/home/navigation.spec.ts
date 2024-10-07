import { test, expect } from "@playwright/test";

test.describe("Home Page Navigation", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/");
  });

  test("should have working footer navigation links", async ({ page }) => {
    await page.goto("/about/privacy-policy");
    await expect(page).toHaveURL(/.*privacy-policy/);

    await page.click('a[href*="/about/terms-of-service"]');
    await expect(page).toHaveURL(/.*terms-of-service/);
  });
});
