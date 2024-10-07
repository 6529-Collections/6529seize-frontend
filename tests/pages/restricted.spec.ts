import { test, expect } from '../testHelpers';

test.describe("Restricted Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/restricted");
  });
  
  test("should load with correct title and input state", async ({ page }) => {
    await expect(page).toHaveTitle("Restricted | 6529 SEIZE");

    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await expect(input).toBeDisabled();
  });
});
