import { test, expect } from '../testHelpers';

test.describe("Consolidation Mapping Tool Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await page.goto("/consolidation-mapping-tool");
  });
  
  test("should load with correct title and heading", async ({ page }) => {
    await expect(page).toHaveTitle("Consolidation Mapping Tool | 6529 SEIZE");

    const heading = page.locator("h1");
    await expect(heading).toContainText("Consolidation Mapping Tool");
    await expect(heading).toBeVisible();
  });
});
