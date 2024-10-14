import { test, expect } from "../testHelpers";

test.describe("The Memes Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/the-memes");
  });

  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("The Memes | 6529 SEIZE");

    const heading = page.locator("h1", { hasText: "The Memes" });
    await expect(heading).toBeVisible();
  });
});
