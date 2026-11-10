import { readFileSync } from "node:fs";
import type { Page } from "@playwright/test";
import { expect } from "@playwright/test";

const GIF_ID = "e2ee-gif-fixture";
export const GIPHY_FIXTURE_URL = `https://media1.giphy.com/media/${GIF_ID}/giphy.gif`;
export const gifFixtureBytes = () =>
  readFileSync("tests/media/fixtures/animation.gif");

/** Use the real picker without contacting GIPHY or sharing QA data. */
export async function installGiphyFixture(page: Page) {
  const bytes = gifFixtureBytes();
  const image = {
    url: GIPHY_FIXTURE_URL,
    width: "120",
    height: "80",
    size: String(bytes.length),
  };
  await page.route("https://api.giphy.com/**", (route) =>
    route.fulfill({
      json: {
        data: [
          {
            type: "gif",
            id: GIF_ID,
            title: "Private GIF fixture",
            url: `https://giphy.com/gifs/${GIF_ID}`,
            images: Object.fromEntries(
              [
                "original",
                "downsized_medium",
                "fixed_height",
                "fixed_width",
                "fixed_height_downsampled",
                "fixed_width_downsampled",
              ].map((name) => [name, image])
            ),
            analytics: {},
          },
        ],
        pagination: { total_count: 1, count: 1, offset: 0 },
        meta: { status: 200, msg: "OK", response_id: "e2ee-fixture" },
      },
    })
  );
  await page.route("https://giphy-analytics.giphy.com/**", (route) =>
    route.fulfill({ status: 204 })
  );
  await page.route(GIPHY_FIXTURE_URL, (route) =>
    route.fulfill({
      contentType: "image/gif",
      body: bytes,
      headers: { "access-control-allow-origin": "*" },
    })
  );
}

export async function openGifPicker(page: Page) {
  await page.getByRole("button", { name: "Add GIF", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "GIF search" });
  // The shared sheet has fixed children inside a zero-size dialog root.
  await expect(
    dialog.getByRole("textbox", { name: "Search GIFs" })
  ).toBeVisible({ timeout: 30_000 });
  await expect(dialog).toContainText(
    "GIF searches and previews connect to GIPHY"
  );
  const gif = dialog.locator(`[data-giphy-id="${GIF_ID}"]`);
  await expect(gif).toBeVisible();
  return gif;
}

export async function selectFixtureGif(page: Page) {
  await (await openGifPicker(page)).click();
  await expect(
    page
      .getByRole("list", { name: "Attachments" })
      .getByText("giphy.gif", { exact: true })
  ).toBeVisible();
}
