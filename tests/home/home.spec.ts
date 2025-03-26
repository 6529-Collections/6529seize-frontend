import { test, expect } from "../testHelpers";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the Latest Drop section", async ({ page }) => {
    await expect(page).toHaveTitle("6529.io");

    const heading = page.locator("h1", { hasText: "Latest Drop" });
    await expect(heading).toBeVisible();

    const memeTitle = page.locator('h3 a[href^="/the-memes/"]');
    await expect(memeTitle).toBeVisible();
  });
});
