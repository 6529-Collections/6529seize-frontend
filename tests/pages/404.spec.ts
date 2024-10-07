import { test, expect } from "@playwright/test";

test.describe("404 Page", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    // Avoid hammering the server (esp if staging):
    await page.waitForTimeout(testInfo.project.metadata.testDelay);
    await page.goto("/non-existent-page");
  });
  
  test("should have correct meta tags and H2", async ({ page }) => {
    // Check og:title meta tag contains "NOT FOUND" (case-insensitive)
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      expect.stringContaining("NOT FOUND")
    );

    // Check og:description meta tag contains "6529 SEIZE" (case-insensitive)
    await expect(page.locator('meta[property="og:description"]')).toHaveAttribute(
      "content",
      expect.stringContaining("6529 SEIZE")
    );

    // Check og:image meta tag ends with "Seize_Logo_Glasses_2.png"
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      expect.stringMatching(/Seize_Logo_Glasses_2\.png$/)
    );

    // Check H2 (since 404 page uses H2 instead of H1)
    const heading = page.locator("h2");
    await expect(heading).toHaveText(/404.*PAGE NOT FOUND/i);
    await expect(heading).toBeVisible();
  });
});
