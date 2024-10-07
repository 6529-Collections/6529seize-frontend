import { test, expect } from "@playwright/test";

test.describe("Meme Gas Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/meme-gas");
  });

  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Meme Gas | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Meme Gas");
    await expect(heading).toBeVisible();

    // Check for the Gas component
    const gasComponent = page.locator("table");
    await expect(gasComponent).toBeVisible();
  });
});
