import type { Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
}

async function expectNavigation(page: Page, name: string) {
  await expect(page.getByRole("navigation", { name })).toBeVisible();
}

async function expectTableHasRows(page: Page, tableName: string | RegExp) {
  await expect(
    page.getByRole("table", { name: tableName }).getByRole("row").first()
  ).toBeVisible({ timeout: 20000 });
}

function isLocalBaseURL(baseURL?: string) {
  if (!baseURL) {
    return true;
  }

  const hostname = new URL(baseURL).hostname;

  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isProductionBaseURL(baseURL?: string) {
  if (!baseURL) {
    return false;
  }

  return new URL(baseURL).hostname === "6529.io";
}

test.describe("Media, mint, and detail read-only coverage @surface @medium @large @readonly", () => {
  test("renders The Memes card detail shell", async ({ page }) => {
    await gotoReady(page, "/the-memes/1");

    await expect(page).toHaveTitle("6529Seizing | The Memes #1");
    await expect(
      page.getByRole("heading", { level: 1, name: "Card 1 - 6529Seizing" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to The Memes" })
    ).toHaveAttribute("href", "/the-memes");
    await expectNavigation(page, "Meme page sections");
    await expect(
      page.getByRole("button", { name: "Overview" })
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("button", { name: "Collectors" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "History" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "References" })
    ).toBeVisible();
    await expect(
      page.locator("img#the-art-fullscreen-img[alt='6529Seizing']")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Full screen" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open in new tab" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download media" })
    ).toBeVisible();
  });

  test("renders The Memes activity focus with locale-preserving links", async ({
    baseURL,
    page,
  }) => {
    await gotoReady(page, "/the-memes/1?focus=activity&locale=de-DE");

    await expectNavigation(page, "Meme history sections");
    await expect(page.getByRole("button", { name: "History" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(
      page.getByRole("tab", { name: "Card Activity" })
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Card Activity" })
    ).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "Timeline" })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "The Memes card activity" })
    ).toBeVisible();
    if (!isLocalBaseURL(baseURL)) {
      await expectTableHasRows(page, "The Memes Card 1 activity");
    }
    await expect(
      page.getByRole("link", { name: "View SZN 1 cards" })
    ).toHaveAttribute(
      "href",
      "/the-memes?szn=1&sort=age&sort_dir=ASC&locale=de-DE"
    );
  });

  test("renders The Memes mint page read-only", async ({ page }) => {
    await gotoReady(page, "/the-memes/mint");

    await expect(page).toHaveTitle(/^Mint #\d+ \| [^|]+ \| The Memes$/);
    await expect(page.getByText("Retrieving Mint information")).toBeHidden({
      timeout: 15000,
    });
    await expect(
      page.locator("main a[href^='/the-memes/']").first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator("main img[id^='image-'][alt], main iframe").first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Distribution Plan" })
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Edition Size" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Minting Approach" })
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mint Price" })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Status" }).first()
    ).toBeVisible();
  });

  test("renders Meme Lab card activity focus with locale-preserving links", async ({
    baseURL,
    page,
  }) => {
    await gotoReady(page, "/meme-lab/1?focus=activity&locale=de-DE");

    await expect(page).toHaveTitle(
      "Spread the Memes | Meme Lab #1 | Card Activity"
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Meme Lab Card 1 - Spread the Memes",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to Meme Lab" })
    ).toHaveAttribute("href", "/meme-lab?locale=de-DE");
    await expectNavigation(page, "Meme Lab page sections");
    await expectNavigation(page, "Meme Lab history sections");
    await expect(page.getByRole("button", { name: "History" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(
      page.getByRole("region", { name: "Meme Lab activity" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Card Volumes" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Card Activity" })
    ).toBeVisible();
    if (!isLocalBaseURL(baseURL)) {
      await expect(
        page.getByRole("table").first().getByRole("row").nth(1)
      ).toBeVisible();
    }
    await expect(
      page.locator("img#the-art-fullscreen-img[alt='Spread the Memes']")
    ).toBeVisible();
  });

  test.describe("production ReMemes detail fixture", () => {
    test.skip(
      ({ baseURL }) => !isProductionBaseURL(baseURL),
      "this ReMeme detail fixture is only stable against production data"
    );

    test("renders ReMemes detail tabs without mutation", async ({ page }) => {
      await gotoReady(
        page,
        "/rememes/0xfb7dc9be63e53e24b217c02c16f3952ac3546e5f/7"
      );

      await expect(
        page.getByRole("link", { name: "Back to ReMemes" })
      ).toHaveAttribute("href", "/rememes");
      await expect(page).toHaveTitle("SeizeGenart | ReMemes | 6529.io");
      await expect(
        page.getByRole("heading", { level: 1, name: "ReMemes - SeizeGenart" })
      ).toBeVisible();
      await expectNavigation(page, "ReMemes page sections");
      await expect(
        page.getByRole("button", { name: "Overview" })
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByRole("region", { name: "ReMeme details" })
      ).toBeVisible();
      await expect(
        page.locator("main img[alt='SeizeGenart']").first()
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "View Genart Memes on Etherscan" })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Open @kkostya on X" })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Open OpenSea" })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Open Rarible" })
      ).toBeVisible();

      await page.getByRole("button", { name: "Metadata" }).click();
      await expect(
        page.getByRole("button", { name: "Metadata" })
      ).toHaveAttribute("aria-pressed", "true");
      await page.getByRole("button", { name: "References" }).click();
      await expect(
        page.getByRole("button", { name: "References" })
      ).toHaveAttribute("aria-pressed", "true");
    });
  });
});
