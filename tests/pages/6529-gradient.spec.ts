import { test, expect } from "../testHelpers";

test.describe("6529 Gradient Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/6529-gradient");
  });

  test("should have correct meta tags and H1", async ({ page }) => {
    // Check og meta tags
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      expect.stringContaining("6529 Gradient")
    );

    // Check og:description meta tag contains "6529.io"
    await expect(
      page.locator('meta[property="og:description"]')
    ).toHaveAttribute("content", expect.stringContaining("6529.io"));

    // Check og:image meta tag contains "gradients"
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      expect.stringContaining("gradients")
    );
  });

  test("should display the correct title and heading", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("6529 Gradient");

    const heading = page.locator("h1");
    await expect(heading).toContainText("6529 Gradient");
    await expect(heading).toBeVisible();
  });

  test("should display sorting options", async ({ page }) => {
    await expect(page.locator("text=Sort")).toBeVisible();
    await expect(page.locator('span:has-text("ID")')).toBeVisible();
    await expect(page.locator('span:has-text("TDH")')).toBeVisible();
  });

  test("should display gradient NFTs", async ({ page }) => {
    await expect(page.locator("text=6529 Gradient #0")).toBeVisible();
    await expect(page.locator("text=6529 Gradient #69")).toBeVisible();
  });

  test("should display NFT details", async ({ page }) => {
    await page.waitForSelector('div:has-text("TDH:")');

    const nftDetailsDiv = page
      .locator('div:has-text("TDH:"):has-text("Rank:")')
      .first();
    await expect(nftDetailsDiv).toBeVisible();

    const detailsText = await nftDetailsDiv.textContent();
    expect(detailsText).toMatch(/TDH: \d{1,3}(,\d{3})*/);
    expect(detailsText).toMatch(/Rank: \d+\/101/);
  });

  test("should change sort direction", async ({ page }) => {
    const ascIcon = page.locator("svg.fa-circle-chevron-up");
    const descIcon = page.locator("svg.fa-circle-chevron-down");

    // Check initial state
    await expect(ascIcon).not.toHaveClass(/disabled/);
    await expect(descIcon).toHaveClass(/disabled/);

    // Click descending icon
    await descIcon.click();
    await expect(page).toHaveURL(/sort_dir=DESC/);
    await expect(ascIcon).toHaveClass(/disabled/);
    await expect(descIcon).not.toHaveClass(/disabled/);

    // Click ascending icon
    await ascIcon.click();
    await expect(page).toHaveURL(/sort_dir=ASC/);
    await expect(ascIcon).not.toHaveClass(/disabled/);
    await expect(descIcon).toHaveClass(/disabled/);
  });

  test("should change sort type", async ({ page }) => {
    const idSort = page.locator('span:has-text("ID")');
    const tdhSort = page.locator('span:has-text("TDH")');

    await tdhSort.click();
    await expect(page).toHaveURL(/sort=tdh/);

    await idSort.click();
    await expect(page).toHaveURL(/sort=id/);
  });

  test("should navigate to individual gradient page", async ({ page }) => {
    await page.click("text=6529 Gradient #1");
    await expect(page).toHaveURL("/6529-gradient/1");
  });
});

test.describe("Individual Gradient Page", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/6529-gradient/1");
    await page.waitForLoadState("networkidle");
  });

  test("should display gradient details", async ({ page }) => {
    await expect(page.locator("h1")).toContainText("6529 Gradient");

    const gradientImage = page.locator(
      'img[alt="6529 Gradient #1"]#the-art-fullscreen-img'
    );
    await expect(gradientImage).toBeVisible();
    await expect(gradientImage).toHaveAttribute("src");

    // Check for TDH Rate
    await page.waitForSelector('td:has-text("TDH Rate")');
    const tdhRateCell = page.locator('td:has-text("TDH Rate")');
    await expect(tdhRateCell).toBeVisible();
    const tdhRateValue = await tdhRateCell
      .locator("..")
      .locator("td")
      .nth(1)
      .textContent();
    expect(tdhRateValue).toMatch(/\d+(\.\d+)?/);

    // Check for TDH
    const tdhCell = page.locator(
      'td:has-text("TDH"):not(:has-text("Rate")):not(:has-text("Unweighted"))'
    );
    await expect(tdhCell).toBeVisible();
    const tdhValue = await tdhCell
      .locator("..")
      .locator("td")
      .nth(1)
      .textContent();
    expect(tdhValue).toMatch(/\d{1,3}(,\d{3})*/);

    // Check for Unweighted TDH
    const unweightedTdhCell = page.locator('td:has-text("Unweighted TDH")');
    await expect(unweightedTdhCell).toBeVisible();
    const unweightedTdhValue = await unweightedTdhCell
      .locator("..")
      .locator("td")
      .nth(1)
      .textContent();
    expect(unweightedTdhValue).toMatch(/\d{1,3}(,\d{3})*/);

    // Check for Gradient Rank
    const rankCell = page.locator('td:has-text("Gradient Rank")');
    await expect(rankCell).toBeVisible();
    const rankValue = await rankCell
      .locator("..")
      .locator("td")
      .nth(1)
      .textContent();
    expect(rankValue).toMatch(/\d+\/101/);
  });

  test("should have correct meta tags", async ({ page }) => {
    // Check og:title meta tag contains "Gradient #1"
    await expect(page.locator('meta[property="og:title"]')).toHaveAttribute(
      "content",
      expect.stringContaining("Gradient #1")
    );

    // Check og:image meta tag has any non-empty content
    await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
      "content",
      expect.stringMatching(/.+/)
    );

    // Check og:description meta tag contains "6529.io"
    await expect(
      page.locator('meta[property="og:description"]')
    ).toHaveAttribute("content", expect.stringContaining("6529.io"));
  });
});
