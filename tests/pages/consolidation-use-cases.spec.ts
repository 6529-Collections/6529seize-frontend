import { test, expect } from '../testHelpers';

test.describe("Consolidation Use Cases Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/consolidation-use-cases");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Consolidation Use Cases | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Consolidation Use Cases");
    await expect(heading).toBeVisible();
  });
});
