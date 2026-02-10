import { test, expect } from "../testHelpers";

test.describe("404 Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/non-existent-page");
  });

  test("should have correct meta tags and H2", async ({ page }) => {
    // Check og:title meta tag contains "NOT FOUND" (case-insensitive)
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      expect.stringContaining("NOT FOUND")
    );

    // Check og:description meta tag contains "6529.io" (case-insensitive)
    await expect(
      page.locator('meta[property="og:description"]')
    ).toHaveAttribute("content", expect.stringContaining("6529.io"));

    // Check og:image meta tag ends with "6529io.png"
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      expect.stringMatching(/6529io\.png$/)
    );

    // Check H2 (since 404 page uses H2 instead of H1)
    const heading = page.locator("h2");
    await expect(heading).toHaveText(/404.*PAGE NOT FOUND/i);
    await expect(heading).toBeVisible();
  });
});
