import { test, expect } from "../testHelpers";

test.describe("Meme Gas Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/meme-gas");
  });

  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Meme Gas - The Memes");

    const heading = page.locator("main h1:visible");
    await expect(heading).toContainText("Meme Gas");
    await expect(heading).toBeVisible();

    // Check for the Gas component
    const gasComponent = page.locator("table");
    await expect(gasComponent).toBeVisible();
  });
});
