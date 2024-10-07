import { test, expect } from "@playwright/test";

test.describe("Access Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/access");
  });
  
  test("should load with correct title and input state", async ({ page }) => {
    await expect(page).toHaveTitle("Access Page | 6529 SEIZE");

    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();

    await expect(input).toBeDisabled();
  });
});
