import { test, expect } from "@playwright/test";

test.describe("404 Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/non-existent-page");
  });
  
  test("should have correct meta tags and H2", async ({ page }) => {
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      /.*NOT FOUND.*/i
    );
    await expect(
      page.locator('meta[property="og:description"]')
    ).toHaveAttribute("content", /.*6529 SEIZE.*/i);
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      /.*Seize_Logo_Glasses_2\.png$/
    );

    // Check H2 (since 404 page uses H2 instead of H1)
    const heading = page.locator("h2");
    await expect(heading).toContainText("404");
    await expect(heading).toContainText("PAGE NOT FOUND");
    await expect(heading).toBeVisible();

  });
});
