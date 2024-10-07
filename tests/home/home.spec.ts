import { test, expect } from "@playwright/test";
import { login } from "../testHelpers";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (especially if running against staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/");
  });

  test("should display the Latest Drop section", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle("6529 SEIZE");

    const heading = page.locator("h1", { hasText: "Latest Drop" });
    await expect(heading).toBeVisible();

    const memeTitle = page.locator('h3 a[href^="/the-memes/"]');
    await expect(memeTitle).toBeVisible();
  });
});
