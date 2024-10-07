import { test, expect } from "@playwright/test";

test.describe("The Memes Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/the-memes");
  });

  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("The Memes | 6529 SEIZE");

    const heading = page.locator("h1", { hasText: "The Memes" });
    await expect(heading).toContainText("The Memes");
    await expect(heading).toBeVisible();
  });
});
