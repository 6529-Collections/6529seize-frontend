import path from "node:path";
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

// The parent composer suite supplies the local-only mutation guard and both
// desktop/touch projects. Browser requests, decoding and gallery resets are the
// regression risk here; pixel-budget arithmetic belongs in the resizer tests.
export function defineWaveImagePreviewTests() {
  test("keeps failed drop previews and gallery navigation off original files", async ({
    page,
    baseURL,
  }) => {
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
    if (!source)
      throw new Error("Image preview fixture requires the sandbox drop");
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
    await page.route(`${MEDIA_ROOT}**`, (route) =>
      route.fulfill({ status: 422, body: "Preview unavailable" })
    );
    await page.goto(`/waves/${WAVE_ID}?drop=${DROP_ID}`, {
      waitUntil: "domcontentloaded",
    });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);
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
    await page
      .getByRole("button", { name: "Previous image", exact: true })
      .click();
    await expect(page.getByTestId("image-gallery-counter")).toHaveText("1 / 2");
    await expect(preview).toBeVisible();
    await expect
      .poll(() => preview.evaluate((img: HTMLImageElement) => img.naturalWidth))
      .toBeGreaterThan(0);
    expect(requests.filter((url) => originals.includes(url))).toEqual([]);
    await expectNoHorizontalOverflow(page);
    await page.keyboard.press("Escape");
    await expect(page.getByTestId("image-gallery-counter")).toBeHidden();
  });
}
