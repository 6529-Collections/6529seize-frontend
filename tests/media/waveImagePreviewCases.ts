import path from "node:path";
import type { Page } from "@playwright/test";
import type { ApiDropV2 } from "../../generated/models/ApiDropV2";
import { ApiDropMainType } from "../../generated/models/ApiDropMainType";
import type { ApiWaveOverview } from "../../generated/models/ApiWaveOverview";
import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  dismissNextDevTools,
  getSandboxApiOrigin,
} from "../support/localSandbox";

const WAVE_ID = "00000000-0000-4000-8000-000000000529";
const DROP_ID = "00000000-0000-4000-8000-000000000530";
const MEDIA_ROOT =
  "https://d3lqz0a4bldqgf.cloudfront.net/drops/preview-safety/";

async function fetchSandboxDrop(page: Page, baseURL: string | undefined) {
  const apiOrigin = getSandboxApiOrigin(baseURL);
  const response = await page.request.get(
    `${apiOrigin}/api/v2/waves/${WAVE_ID}/drops`
  );
  expect(response.ok()).toBe(true);
  const feed = (await response.json()) as {
    wave: ApiWaveOverview;
    drops: ApiDropV2[];
  };
  const source = feed.drops.find((drop) => drop.id === DROP_ID);
  if (!source) throw new Error("Image fixture requires the sandbox drop");
  return { apiOrigin, feed, source };
}

// The parent composer suite supplies the local-only mutation guard and both
// desktop/touch projects. Browser requests, decoding and gallery resets are the
// regression risk here; pixel-budget arithmetic belongs in the resizer tests.
export function defineWaveImagePreviewTests() {
  test("opens preview and additional images above the Memes drop detail view", async ({
    page,
    baseURL,
  }) => {
    const { apiOrigin, feed, source } = await fetchSandboxDrop(page, baseURL);
    const images = [`${MEDIA_ROOT}preview.jpg`, `${MEDIA_ROOT}supporting.jpg`];
    const metadata = [
      {
        data_key: "additional_media",
        data_value: JSON.stringify({
          preview_image: images[0],
          artwork_commentary_media: [images[1]],
        }),
      },
    ];
    const drop: ApiDropV2 = {
      ...source,
      title: "Supplemental media fixture",
      drop_type: ApiDropMainType.Submission,
      priority_metadata: metadata,
    };
    const headers = { "access-control-allow-origin": "*" };
    await page.route(`${apiOrigin}/api/settings`, (route) =>
      route.fulfill({ headers, json: { memes_wave_id: WAVE_ID } })
    );
    await page.route(`${apiOrigin}/api/v2/drops/${DROP_ID}`, (route) =>
      route.fulfill({ headers, json: { drop, wave: feed.wave } })
    );
    await page.route(`${apiOrigin}/api/v2/drops/${DROP_ID}/metadata`, (route) =>
      route.fulfill({ headers, json: metadata })
    );
    await page.route(`${apiOrigin}/api/v2/waves/${WAVE_ID}/drops*`, (route) =>
      route.fulfill({ headers, json: { ...feed, drops: [drop] } })
    );
    await page.route(`${MEDIA_ROOT}**`, (route) =>
      route.fulfill({
        contentType: "image/png",
        path: path.resolve("public/test-wave-icon.png"),
      })
    );
    await page.goto(`/waves/${WAVE_ID}?drop=${DROP_ID}`, {
      waitUntil: "domcontentloaded",
    });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);

    for (const heading of ["Preview Image", "Additional Media"]) {
      const section = page
        .getByRole("heading", { name: heading, exact: true })
        .locator("..");
      const trigger = section.getByRole("button", {
        name: /^Open (preview image|additional media \d+)$/,
      });
      await trigger.scrollIntoViewIfNeeded();
      await trigger.click();
      const expanded = page.getByRole("img", {
        name: "Expanded image preview",
      });
      await expect(expanded).toBeVisible();
      await expect(expanded).toHaveAttribute("src", /AUTOx1080/);
      await expect(
        page.getByRole("button", { name: "Download media" }).last()
      ).toBeVisible();
      await expect(
        page.getByRole("button", { name: "Open in new tab" }).last()
      ).toBeVisible();
      await page.getByRole("button", { name: "Close media" }).click();
      await expect(expanded).toBeHidden();
      // The image viewer must close without also closing its underlying drop.
      await expect(
        section.getByRole("heading", { name: heading, exact: true })
      ).toBeVisible();
    }
    await expectNoHorizontalOverflow(page);
  });

  test("keeps failed drop previews and gallery navigation off original files", async ({
    page,
    baseURL,
  }) => {
    const { apiOrigin, feed, source } = await fetchSandboxDrop(page, baseURL);
    const originals = [`${MEDIA_ROOT}large.jpg`, `${MEDIA_ROOT}long.gif`];
    const drop: ApiDropV2 = {
      ...source,
      title: "Preview safety fixture",
      content: "",
      drop_type: ApiDropMainType.Submission,
      media: originals.map((url, index) => ({
        url,
        mime_type: index === 0 ? "image/jpeg" : "image/gif",
      })),
    };
    const headers = { "access-control-allow-origin": "*" };
    await page.route("**/api/open-graph", (route) =>
      route.fulfill({ headers, json: { results: {} } })
    );
    await page.route(`${apiOrigin}/api/settings`, (route) =>
      route.fulfill({ headers, json: { memes_wave_id: WAVE_ID } })
    );
    await page.route(`${apiOrigin}/api/v2/drops/${DROP_ID}`, (route) =>
      route.fulfill({ headers, json: { drop, wave: feed.wave } })
    );
    await page.route(`${apiOrigin}/api/v2/waves/${WAVE_ID}/drops*`, (route) =>
      route.fulfill({ headers, json: { ...feed, drops: [drop] } })
    );
    const requests: string[] = [];
    page.on("request", (request) => {
      if (request.url().startsWith(MEDIA_ROOT)) requests.push(request.url());
    });
    let releasePreviews = () => {};
    const previewResponseGate = new Promise<void>((resolve) => {
      releasePreviews = resolve;
    });
    await page.route(`${MEDIA_ROOT}**`, async (route) => {
      await previewResponseGate;
      await route.fulfill({ status: 422, body: "Preview unavailable" });
    });
    try {
      await page.goto(`/waves/${WAVE_ID}?drop=${DROP_ID}`, {
        waitUntil: "domcontentloaded",
      });
      await waitForRouteReady(page);
      await dismissNextDevTools(page);
      const inlineLoader = page
        .getByRole("status", {
          name: "Loading image",
          exact: true,
        })
        .last();
      await expect(inlineLoader).toBeVisible();
      const bounds = await inlineLoader.evaluate((element) => {
        const placeholder = element.getBoundingClientRect();
        const frame = element.parentElement!.getBoundingClientRect();
        const maxSize =
          16 *
          Number.parseFloat(
            getComputedStyle(document.documentElement).fontSize
          );
        return {
          width: placeholder.width,
          height: placeholder.height,
          maxWidth: Math.min(maxSize, frame.width),
          maxHeight: Math.min(maxSize, frame.height),
          x: placeholder.x - frame.x,
          y: placeholder.y - frame.y,
        };
      });
      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
      expect(Math.abs(bounds.width - bounds.maxWidth)).toBeLessThanOrEqual(1);
      expect(Math.abs(bounds.height - bounds.maxHeight)).toBeLessThanOrEqual(1);
      expect(Math.abs(bounds.x)).toBeLessThanOrEqual(1);
      expect(Math.abs(bounds.y)).toBeLessThanOrEqual(1);
      await page.emulateMedia({ reducedMotion: "reduce" });
      await expect(
        page
          .getByRole("status", { name: "Loading image", exact: true })
          .last()
          .locator('[aria-hidden="true"]')
      ).toHaveCSS("animation-name", "none");
      await expectNoHorizontalOverflow(page);
    } finally {
      releasePreviews();
    }
    await page
      .getByRole("button", { name: /^Open (image preview|drop media)$/ })
      .first()
      .click();
    await expect(page.getByTestId("image-gallery-counter")).toHaveText("1 / 2");
    await expect(
      page.getByRole("button", { name: "Retry preview" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download media" }).last()
    ).toBeVisible();
    await page.getByRole("button", { name: "Next image", exact: true }).click();
    await expect(page.getByTestId("image-gallery-counter")).toHaveText("2 / 2");
    await expect(
      page.getByRole("button", { name: "Retry preview" })
    ).toBeVisible();
    await page.getByRole("button", { name: "Retry preview" }).click();
    await expect(
      page.getByRole("button", { name: "Retry preview" })
    ).toBeVisible();
    expect(requests.some((url) => url.includes("AUTOx1080"))).toBe(true);
    expect(requests.some((url) => url.includes("AUTOx450"))).toBe(true);
    expect(requests.filter((url) => originals.includes(url))).toEqual([]);
    // Originals remain opt-in even when every generated preview fails.
    await page.route(originals[1]!, (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/gif",
        path: path.resolve("tests/media/fixtures/animation.gif"),
      })
    );
    const qualityToggle = page.getByRole("button", { name: "View original" });
    await expect(qualityToggle).toHaveAttribute("title", "View original");
    await expect(qualityToggle).toHaveAttribute("aria-pressed", "false");
    const toggleBounds = await qualityToggle.boundingBox();
    expect(toggleBounds).not.toBeNull();
    expect(toggleBounds!.y).toBeLessThan(80);
    expect(toggleBounds!.x).toBeGreaterThan(page.viewportSize()!.width - 240);
    await qualityToggle.click();
    await expect(
      page.getByRole("button", { name: "View optimized" })
    ).toHaveAttribute("aria-pressed", "true");
    const originalImage = page.getByRole("img", {
      name: "Original GIF animation",
    });
    await expect(originalImage).toHaveAttribute("src", originals[1]!);
    await expect
      .poll(() =>
        originalImage.evaluate((img: HTMLImageElement) => img.naturalWidth)
      )
      .toBeGreaterThan(0);
    expect(requests.filter((url) => originals.includes(url))).toEqual([
      originals[1],
    ]);
    const firstFrame = await originalImage.screenshot();
    await expect.poll(() => originalImage.screenshot()).not.toEqual(firstFrame);
    await page.getByRole("button", { name: "View optimized" }).click();
    await expect(originalImage).toBeHidden();
    // Keyboard users must be able to identify a failed original without color.
    await page.route(originals[1]!, (route) => route.abort("failed"));
    await qualityToggle.focus();
    await page.keyboard.press("Enter");
    await expect(qualityToggle.getByTestId("gif-quality-error")).toBeVisible();
    await expect(qualityToggle).toBeFocused();
    await expect(qualityToggle).toHaveAccessibleDescription(
      "Couldn't load the original GIF. You can try again."
    );
    // A recovered preview must replace the error state without closing the
    // viewer, and navigation must reset the previous item's failed state.
    await page.route(`${MEDIA_ROOT}**`, (route) =>
      route.fulfill({
        status: 200,
        contentType: "image/png",
        path: path.resolve("public/test-wave-icon.png"),
      })
    );
    await page.getByRole("button", { name: "Retry preview" }).click();
    const preview = page.getByRole("img", { name: "Expanded image preview" });
    await expect(preview).toBeVisible();
    await expect
      .poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    await expect(
      page.getByRole("button", { name: "Retry preview" })
    ).toBeHidden();
    let releaseOriginal = () => {};
    const originalResponseGate = new Promise<void>((resolve) => {
      releaseOriginal = resolve;
    });
    await page.route(originals[1]!, async (route) => {
      await originalResponseGate;
      await route.fulfill({
        status: 200,
        contentType: "image/gif",
        path: path.resolve("tests/media/fixtures/animation.gif"),
      });
    });
    const loader = page.getByRole("status", { name: "Loading original GIF" });
    try {
      await qualityToggle.click();
      await expect(loader).toBeVisible();
      await expect(preview).toBeVisible();
      await expect(page.getByAltText("Original GIF animation")).toBeHidden();
    } finally {
      releaseOriginal();
    }
    await expect(
      page.getByRole("img", { name: "Original GIF animation" })
    ).toBeVisible();
    await expect(loader).toBeHidden();
    await expect(preview).toBeHidden();
    await page
      .getByRole("button", { name: "Previous image", exact: true })
      .click();
    await expect(page.getByTestId("image-gallery-counter")).toHaveText("1 / 2");
    await expect(preview).toBeVisible();
    await expect
      .poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    expect(requests.filter((url) => originals.includes(url))).toEqual([
      originals[1],
      originals[1],
      originals[1],
    ]);
    await expectNoHorizontalOverflow(page);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("image-gallery-counter")).toBeHidden();
  });
}
