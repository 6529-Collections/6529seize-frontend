import { test, expect } from "../testHelpers";

test.describe("Access Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/access");
  });

  test("should load with correct title and input state", async ({ page }) => {
    await expect(page).toHaveTitle("Access Page | 6529 SEIZE");
  });

  test("should show input as disabled when logged in", async ({ page }) => {
    const input = page.locator('input[type="text"]');
    await expect(input).toBeVisible();
    await expect(input).toBeDisabled();
  });

  test("should redirect from home when logged out", async ({ browser }) => {
    const context = await browser.newContext({
      storageState: { cookies: [], origins: [] },
    });
    const page = await context.newPage();
    await page.goto("/");
    await expect(page).toHaveURL("/access");
    await context.close();
  });
});
