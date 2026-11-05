import path from "node:path";
import type { Page } from "@playwright/test";

/** Serve the public preview artwork locally so notification checks need no external image host. */
export async function installArtworkNotificationImage(page: Page) {
  const source =
    "https://6529.io/artwork-documentation/examples/an-alteration.png";
  const image = {
    contentType: "image/png",
    path: path.resolve(
      "public/artwork-documentation/examples/an-alteration.png"
    ),
  };
  await page.route(source, (route) => route.fulfill(image));
  await page.route(
    `**/api/og-metadata/image?url=${encodeURIComponent(source)}&*`,
    (route) => route.fulfill(image)
  );
}
