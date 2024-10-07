import { test, expect } from "@playwright/test";
import { login } from "../testHelpers";

test.describe("Home Page Navigation", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (especially if running against staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/");
  });

  test("should have working footer navigation links", async ({ page }) => {
    await page.goto("/about/privacy-policy");
    await expect(page).toHaveURL(/.*privacy-policy/);

    await page.click('a[href*="/about/terms-of-service"]');
    await expect(page).toHaveURL(/.*terms-of-service/);
  });
});
