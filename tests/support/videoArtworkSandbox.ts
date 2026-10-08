import type { Page } from "@playwright/test";
import path from "node:path";

import type { ApiDropV2 } from "../../generated/models/ApiDropV2";
import { ApiDropMainType } from "../../generated/models/ApiDropMainType";
import type { ApiWaveOverview } from "../../generated/models/ApiWaveOverview";
import { expect } from "../testHelpers";
import { getSandboxApiOrigin } from "./localSandbox";
import composerSandboxConstants from "./composerSandboxConstants.json";

const WAVE_ID = "00000000-0000-4000-8000-000000000529";
const DROP_ID = "00000000-0000-4000-8000-000000000530";
const LINKING_DROP_ID = "00000000-0000-4000-8000-000000000546";

/** Load and validate the shared wave/drop seed before installing route overrides. */
async function loadSandboxSeed(
  page: Page,
  baseURL: string | undefined,
  fixtureName: string
): Promise<{
  apiOrigin: string;
  feed: { wave: ApiWaveOverview; drops: ApiDropV2[] };
  source: ApiDropV2;
}> {
  const apiOrigin = getSandboxApiOrigin(baseURL);
  const response = await page.request.get(
    `${apiOrigin}/api/v2/waves/${WAVE_ID}/drops`
  );
  expect(
    response.ok(),
    `Local ${fixtureName} fixture requires the sandbox wave feed`
  ).toBe(true);
  const feed = (await response.json()) as {
    wave: ApiWaveOverview;
    drops: ApiDropV2[];
  };
  const source = feed.drops.find((drop) => drop.id === DROP_ID);
  if (!source || feed.wave.id !== WAVE_ID) {
    throw new Error(
      `Local ${fixtureName} fixture is missing its sandbox wave/drop seed`
    );
  }
  return { apiOrigin, feed, source };
}

/** Override only this browser context; no live data or shared sandbox state changes. */
export async function installVideoArtworkSandbox(
  page: Page,
  baseURL: string | undefined
): Promise<string> {
  return installArtworkSandbox(page, baseURL);
}

/** Render a chat message that embeds the sandbox submission as a linked drop. */
export async function installLinkedDropVideoSandbox(
  page: Page,
  baseURL: string | undefined,
  withPoster = false
): Promise<string> {
  const { apiOrigin, feed, source } = await loadSandboxSeed(
    page,
    baseURL,
    "linked-video"
  );

  const cloudfront =
    process.env["NEXT_PUBLIC_CLOUDFRONT_DOMAIN"] ??
    "https://d3lqz0a4bldqgf.cloudfront.net";
  const videoUrl = withPoster
    ? `${cloudfront}/drops/video-fixture/portrait.mp4`
    : new URL("/__video-fixture/portrait.mp4", baseURL).href;
  if (withPoster) {
    await page.route(
      `${cloudfront}/renditions/drops/video-fixture/portrait/**`,
      (route) => {
        if (
          !/\/poster\/portrait_poster\.000000[01]\.jpg$/.test(
            route.request().url()
          )
        ) {
          return route.fulfill({ status: 404 });
        }
        return route.fulfill({
          headers: { "access-control-allow-origin": "*" },
          contentType: "image/svg+xml",
          body: '<svg xmlns="http://www.w3.org/2000/svg" width="360" height="640"><rect width="100%" height="100%" fill="#c19a49"/></svg>',
        });
      }
    );
  }
  const linkedDrop: ApiDropV2 = {
    ...source,
    title: "Local linked video fixture",
    content: "",
    media: [{ url: videoUrl, mime_type: "video/mp4" }],
    wave: feed.wave,
  };
  const linkingDrop: ApiDropV2 = {
    ...source,
    id: LINKING_DROP_ID,
    serial_no: source.serial_no + 1,
    drop_type: ApiDropMainType.Chat,
    title: "Local linked-drop chat fixture",
    content: new URL(
      `/waves/${composerSandboxConstants.linkedDropMemesWaveId}?drop=${DROP_ID}`,
      baseURL
    ).href,
    media: [],
    wave: feed.wave,
  };
  const headers = { "access-control-allow-origin": "*" };

  await page.route("**/api/open-graph", (route) =>
    route.fulfill({ headers, json: { results: {} } })
  );
  await page.route(`${apiOrigin}/api/settings`, (route) =>
    route.fulfill({
      headers,
      json: { memes_wave_id: composerSandboxConstants.linkedDropMemesWaveId },
    })
  );
  await page.route(`${apiOrigin}/api/v2/drops?*`, async (route) => {
    const ids = new URL(route.request().url()).searchParams.get("ids");
    if (ids !== DROP_ID) {
      await route.fallback();
      return;
    }
    await route.fulfill({
      headers,
      json: { data: [linkedDrop], page: 1, page_size: 1, next: null },
    });
  });
  await page.route(`${apiOrigin}/api/v2/waves/${WAVE_ID}/drops*`, (route) =>
    route.fulfill({ headers, json: { ...feed, drops: [linkingDrop] } })
  );
  await page.route(videoUrl, (route) =>
    route.fulfill({
      headers,
      contentType: "video/mp4",
      path: path.resolve("tests/media/fixtures/portrait.mp4"),
    })
  );
  await page.route("**/6529-emoji/emoji-list.json**", (route) =>
    route.fulfill({ json: [] })
  );

  return `/waves/${WAVE_ID}`;
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
  const { apiOrigin, feed, source } = await loadSandboxSeed(
    page,
    baseURL,
    "artwork"
  );

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
