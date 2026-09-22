import type { Page } from "@playwright/test";
import path from "node:path";

import type { ApiDropV2 } from "../../generated/models/ApiDropV2";
import { ApiDropMainType } from "../../generated/models/ApiDropMainType";
import type { ApiWaveOverview } from "../../generated/models/ApiWaveOverview";
import { expect } from "../testHelpers";
import { getSandboxApiOrigin } from "./localSandbox";

const WAVE_ID = "00000000-0000-4000-8000-000000000529";
const DROP_ID = "00000000-0000-4000-8000-000000000530";

/** Override only this browser context; no live data or shared sandbox state changes. */
export async function installVideoArtworkSandbox(
  page: Page,
  baseURL: string | undefined
): Promise<string> {
  return installArtworkSandbox(page, baseURL);
}

export async function installImageArtworkSandbox(
  page: Page,
  baseURL: string | undefined,
  dimensions: { width: number; height: number }
): Promise<string> {
  return installArtworkSandbox(page, baseURL, dimensions);
}

async function installArtworkSandbox(
  page: Page,
  baseURL: string | undefined,
  dimensions?: { width: number; height: number }
): Promise<string> {
  const apiOrigin = getSandboxApiOrigin(baseURL);
  const response = await page.request.get(
    `${apiOrigin}/api/v2/waves/${WAVE_ID}/drops`
  );
  expect(
    response.ok(),
    "Local video fixture requires the sandbox wave feed"
  ).toBe(true);
  const feed = (await response.json()) as {
    wave: ApiWaveOverview;
    drops: ApiDropV2[];
  };
  const source = feed.drops.find((drop) => drop.id === DROP_ID);
  if (!source || feed.wave.id !== WAVE_ID) {
    throw new Error(
      "Local video fixture is missing its sandbox wave/drop seed"
    );
  }

  const videoUrl = new URL(
    dimensions
      ? "/__image-fixture/artwork.svg"
      : "/__video-fixture/portrait.mp4",
    baseURL
  ).href;
  const drop: ApiDropV2 = {
    ...source,
    drop_type: ApiDropMainType.Submission,
    title: "Local video artwork fixture",
    content: "",
    media: [
      { url: videoUrl, mime_type: dimensions ? "image/svg+xml" : "video/mp4" },
    ],
  };
  const headers = { "access-control-allow-origin": "*" };
  await page.route(`${apiOrigin}/api/settings`, (route) =>
    route.fulfill({ headers, json: { memes_wave_id: WAVE_ID } })
  );
  await page.route(`${apiOrigin}/api/v2/drops/${DROP_ID}`, (route) =>
    route.fulfill({ headers, json: { drop, wave: feed.wave } })
  );
  await page.route(`${apiOrigin}/api/v2/waves/${WAVE_ID}/drops*`, (route) =>
    route.fulfill({ headers, json: { ...feed, drops: [drop] } })
  );
  await page.route(videoUrl, (route) =>
    dimensions
      ? route.fulfill({
          contentType: "image/svg+xml",
          body: `<svg xmlns="http://www.w3.org/2000/svg" width="${dimensions.width}" height="${dimensions.height}"><rect width="100%" height="100%" fill="#c19a49"/></svg>`,
        })
      : route.fulfill({
          contentType: "video/mp4",
          path: path.resolve("tests/media/fixtures/portrait.mp4"),
        })
  );
  await page.route("**/6529-emoji/emoji-list.json**", (route) =>
    route.fulfill({ json: [] })
  );
  return `/waves/${WAVE_ID}?drop=${DROP_ID}`;
}
