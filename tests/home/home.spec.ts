import { test, expect } from "../testHelpers";

test.describe("Home Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
  });

  test("should display the Latest Drop section", async ({ page }) => {
    await expect(page).toHaveTitle("6529");

    const heading = page.locator("h1", { hasText: "Latest Drop" });
    await expect(heading).toBeVisible();

    const memeTitle = page.locator('h3 a[href^="/the-memes/"]');
    await expect(memeTitle).toBeVisible();
  });

  test("should navigate to network health from the hero heart link", async ({
    page,
  }) => {
    const healthLink = page.getByRole("link", {
      name: "Open network health dashboard",
    });

    await expect(healthLink).toBeVisible();
    await healthLink.click();
    await expect(page).toHaveURL(/\/network\/health\/?$/);
  });
});
