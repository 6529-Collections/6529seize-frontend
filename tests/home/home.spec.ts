import { test, expect } from "@playwright/test";
import { login } from "../testHelpers";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page, baseURL }) => {
    await login(page, baseURL!);
  });

  test("should display the Latest Drop section", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveTitle(/6529 SEIZE/);

    const latestDropHeading = page.locator("h1", { hasText: "Latest Drop" });
    await expect(latestDropHeading).toBeVisible();

    const memeTitle = page.locator('h3 a[href^="/the-memes/"]');
    await expect(memeTitle).toBeVisible();
  });
});
