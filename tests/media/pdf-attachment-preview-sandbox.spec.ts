import path from "node:path";
import { devices, type Page } from "@playwright/test";
import type { ApiDropV2 } from "../../generated/models/ApiDropV2";
import { ApiAttachmentKind } from "../../generated/models/ApiAttachmentKind";
import { ApiAttachmentStatus } from "../../generated/models/ApiAttachmentStatus";
import { ApiAttachmentUploadMimeType } from "../../generated/models/ApiAttachmentUploadMimeType";
import type { ApiWaveOverview } from "../../generated/models/ApiWaveOverview";
import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  dismissNextDevTools,
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const WAVE_ID = "00000000-0000-4000-8000-000000000529";
const DROP_ID = "00000000-0000-4000-8000-000000000530";
const MEDIA_ROOT = "https://media.6529.io/pdf-preview-test/";
const DOCUMENT_PATH = path.resolve("public/pebbles/distribution-plan.pdf");
const CORS_HEADERS = { "access-control-allow-origin": "*" };
const PREVIEW_BUTTON = "Render attachment preview";

async function installPdfDrop(page: Page, baseURL: string | undefined) {
  // The SSR seed includes an unrelated link preview before the intercepted feed.
  // Fulfil that lookup locally so the mutation guard never permits a real POST.
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: { results: {}, errors: {} } })
  );
  const apiOrigin = getSandboxApiOrigin(baseURL);
  const response = await page.request.get(
    `${apiOrigin}/api/v2/waves/${WAVE_ID}/drops`
  );
  expect(response.ok()).toBe(true);
  const feed = (await response.json()) as {
    drops: ApiDropV2[];
    wave: ApiWaveOverview;
  };
  const source = feed.drops.find((drop) => drop.id === DROP_ID);
  if (!source) throw new Error("PDF fixture requires the local sandbox drop");
  const drop: ApiDropV2 = {
    ...source,
    content: "PDF attachment regression fixture",
    media: [],
    attachments: ["first", "second"].map((name) => ({
      attachment_id: name,
      file_name: `${name}.pdf`,
      mime_type: ApiAttachmentUploadMimeType.ApplicationPdf,
      kind: ApiAttachmentKind.Pdf,
      status: ApiAttachmentStatus.Ready,
      url: `${MEDIA_ROOT}${name}.pdf`,
    })),
  };
  await page.route(`${apiOrigin}/api/v2/waves/${WAVE_ID}/drops*`, (route) =>
    route.fulfill({ headers: CORS_HEADERS, json: { ...feed, drops: [drop] } })
  );
  await page.route(`${apiOrigin}/api/v2/drops/${DROP_ID}`, (route) =>
    route.fulfill({ headers: CORS_HEADERS, json: { drop, wave: feed.wave } })
  );
  await page.route(`${MEDIA_ROOT}**`, (route) =>
    route.fulfill({
      headers: CORS_HEADERS,
      contentType: "application/pdf",
      path: DOCUMENT_PATH,
    })
  );
}
async function openWave(page: Page, detail = false) {
  await page.goto(`/waves/${WAVE_ID}${detail ? `?drop=${DROP_ID}` : ""}`, {
    waitUntil: "load",
  });
  await waitForRouteReady(page);
  await dismissNextDevTools(page);
}

test.describe("PDF attachment previews @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_COMPOSER_SANDBOX",
    "PDF previews require the local sandbox."
  );

  test("preserves the desktop browser PDF viewer and no-referrer policy", async ({
    page,
    baseURL,
  }) => {
    await installPdfDrop(page, baseURL);
    await openWave(page);
    await page.getByRole("button", { name: PREVIEW_BUTTON }).first().click();
    const viewer = page.getByTitle("first.pdf", { exact: true });
    await expect(viewer).toHaveAttribute("src", `${MEDIA_ROOT}first.pdf`);
    await expect(viewer).toHaveAttribute("referrerpolicy", "no-referrer");
  });

  test.describe("iOS WebKit reader", () => {
    test.use({
      userAgent: devices["iPhone 14"].userAgent,
      viewport: { width: 390, height: 844 },
      hasTouch: true,
      isMobile: true,
    });

    test("scrolls every page in a simple reader, restores focus, and supports rotation", async ({
      page,
      baseURL,
    }) => {
      await installPdfDrop(page, baseURL);
      const referrers: Array<string | undefined> = [];
      page.on("request", (request) => {
        if (request.url().startsWith(MEDIA_ROOT))
          referrers.push(request.headers()["referer"]);
      });
      await openWave(page);
      const trigger = page
        .getByRole("button", { name: PREVIEW_BUTTON })
        .first();
      await trigger.click();
      const reader = page.getByRole("dialog", {
        name: "first.pdf",
        exact: true,
      });
      const scroller = reader.getByRole("region", { name: "PDF pages" });
      await expect(
        reader.getByText("Page 1 of 20", { exact: true })
      ).toBeVisible();
      await expect(reader.getByRole("button")).toHaveCount(1);
      await expect(
        reader.getByRole("button", { name: "Close", exact: true })
      ).toBeVisible();
      await expect(reader.getByRole("spinbutton")).toHaveCount(0);
      await expectAxeClean(page, { include: ['[role="dialog"]'] });
      // Exercise document-only zoom even when the native shell locks its viewport.
      await scroller.evaluate((element) => {
        const rect = element.getBoundingClientRect();
        const gesture = (type: string, distance: number) => {
          const event = new Event(type, { bubbles: true, cancelable: true });
          Object.defineProperty(event, "touches", {
            value: [
              {
                clientX: rect.left + 150 - distance / 2,
                clientY: rect.top + 200,
              },
              {
                clientX: rect.left + 150 + distance / 2,
                clientY: rect.top + 200,
              },
            ],
          });
          Object.defineProperty(event, "changedTouches", {
            value: [{ clientX: rect.left + 150, clientY: rect.top + 200 }],
          });
          element.dispatchEvent(event);
        };
        gesture("touchstart", 100);
        gesture("touchmove", 200);
        gesture("touchend", 200);
      });
      await expect
        .poll(() =>
          scroller.evaluate(
            (element) => element.scrollWidth / element.clientWidth
          )
        )
        .toBeCloseTo(2, 1);
      await expect(
        reader.getByRole("button", { name: "Close", exact: true })
      ).toBeInViewport();
      await scroller.dblclick({ position: { x: 150, y: 200 } });
      await expect
        .poll(() =>
          scroller.evaluate(
            (element) => element.scrollWidth - element.clientWidth
          )
        )
        .toBeLessThanOrEqual(1);
      for (let number = 1; number <= 20; number += 1) {
        const documentPage = reader
          .getByRole("region", { name: "PDF pages" })
          .locator(`[data-pdf-page="${number}"]`);
        await documentPage.scrollIntoViewIfNeeded();
        await expect(
          reader
            .getByRole("region", { name: "PDF pages" })
            .locator(`[data-pdf-page="${number}"] canvas`)
        ).toBeVisible();
      }
      await scroller.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await expect(
        reader.getByText("Page 20 of 20", { exact: true })
      ).toBeVisible();
      await expect(
        reader.getByText("P1 Allowlist: 9,498 Addresses", { exact: true })
      ).toBeAttached();
      await expect
        .poll(() =>
          reader
            .getByRole("region", { name: "PDF pages" })
            .locator("canvas")
            .count()
        )
        .toBeLessThan(12);
      // A real pinch emits many moves across layout frames. Keep the same
      // document point under the fingers near the end of a long PDF.
      const pinchDrift = await scroller.evaluate(async (element) => {
        const rect = element.getBoundingClientRect();
        const x = rect.left + rect.width / 2;
        const y = rect.top + rect.height / 2;
        const sheet = Array.from(
          element.querySelectorAll<HTMLElement>("[data-pdf-page]")
        ).find((candidate) => {
          const bounds = candidate.getBoundingClientRect();
          return bounds.top <= y && bounds.bottom >= y;
        });
        if (!sheet) throw new Error("No PDF page under the pinch midpoint");
        const initial = sheet.getBoundingClientRect();
        const position = (y - initial.top) / initial.height;
        const gesture = (type: string, distance: number) => {
          const event = new Event(type, { bubbles: true, cancelable: true });
          const touches = [
            { clientX: x - distance / 2, clientY: y },
            { clientX: x + distance / 2, clientY: y },
          ];
          Object.defineProperty(event, "touches", { value: touches });
          Object.defineProperty(event, "changedTouches", { value: touches });
          element.dispatchEvent(event);
        };
        let drift = 0;
        gesture("touchstart", 70);
        for (let distance = 80; distance <= 210; distance += 10) {
          gesture("touchmove", distance);
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve())
          );
          const bounds = sheet.getBoundingClientRect();
          drift = Math.max(
            drift,
            Math.abs(bounds.top + bounds.height * position - y)
          );
        }
        gesture("touchend", 210);
        return drift;
      });
      expect(pinchDrift).toBeLessThan(3);
      await expect(
        reader.getByRole("button", { name: "Close", exact: true })
      ).toBeInViewport();
      await scroller.dblclick();
      await scroller.evaluate((element) => {
        element.scrollTop = element.scrollHeight;
      });
      await expect(
        reader.getByText("Page 20 of 20", { exact: true })
      ).toBeVisible();
      await page.setViewportSize({ width: 844, height: 390 });
      await expect
        .poll(() =>
          reader
            .getByRole("region", { name: "PDF pages" })
            .locator("[data-pdf-page]")
            .first()
            .evaluate((element) => element.clientWidth)
        )
        .toBe(844);
      await expect(
        reader.getByText("Page 20 of 20", { exact: true })
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
      await expect
        .poll(() =>
          scroller.evaluate(
            (element) => element.scrollWidth - element.clientWidth
          )
        )
        .toBeLessThanOrEqual(1);
      await scroller.focus();
      await page.keyboard.press("Home");
      await expect(
        reader.getByText("Page 1 of 20", { exact: true })
      ).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(reader).toHaveCount(0);
      await expect(trigger).toBeFocused();
      await page.getByRole("button", { name: PREVIEW_BUTTON }).nth(1).click();
      const second = page.getByRole("dialog", {
        name: "second.pdf",
        exact: true,
      });
      await expect(
        second.getByText("Page 1 of 20", { exact: true })
      ).toBeVisible();
      await second.getByRole("button", { name: "Close", exact: true }).click();
      expect(referrers.length).toBeGreaterThan(0);
      expect(referrers.every((referrer) => referrer === undefined)).toBe(true);
    });

    test("opens the reader from the single-drop view", async ({
      page,
      baseURL,
    }) => {
      await installPdfDrop(page, baseURL);
      await openWave(page, true);
      await page.getByRole("button", { name: PREVIEW_BUTTON }).last().click();
      await expect(
        page.getByRole("dialog").getByText("Page 1 of 20", { exact: true })
      ).toBeVisible();
    });

    test("fits a single-page PDF without extra controls", async ({
      page,
      baseURL,
    }) => {
      await installPdfDrop(page, baseURL);
      await page.route(`${MEDIA_ROOT}first.pdf`, (route) =>
        route.fulfill({
          headers: CORS_HEADERS,
          contentType: "application/pdf",
          path: path.resolve("tests/fixtures/pdf/one-page.pdf"),
        })
      );
      await openWave(page);
      await page.getByRole("button", { name: PREVIEW_BUTTON }).first().click();
      const reader = page.getByRole("dialog", {
        name: "first.pdf",
        exact: true,
      });
      await expect(
        reader.getByText("Page 1 of 1", { exact: true })
      ).toBeVisible();
      await expect(
        reader.getByRole("region", { name: "PDF pages" }).locator("canvas")
      ).toBeVisible();
      await expect(
        reader.getByText("Single-page PDF fixture", { exact: true })
      ).toBeAttached();
      await expect(reader.getByRole("button")).toHaveCount(1);
    });

    test("shows loading and recovers from an unavailable PDF", async ({
      page,
      baseURL,
    }) => {
      await installPdfDrop(page, baseURL);
      let completeRequest: (() => void) | undefined;
      const pending = new Promise<void>((resolve) => {
        completeRequest = resolve;
      });
      let failed = false;
      await page.route(`${MEDIA_ROOT}first.pdf`, async (route) => {
        if (!failed) {
          await pending;
          failed = true;
          await route.fulfill({
            headers: CORS_HEADERS,
            status: 404,
            body: "Not found",
          });
        } else
          await route.fulfill({
            headers: CORS_HEADERS,
            contentType: "application/pdf",
            path: DOCUMENT_PATH,
          });
      });
      await openWave(page);
      await page.getByRole("button", { name: PREVIEW_BUTTON }).first().click();
      const reader = page.getByRole("dialog", {
        name: "first.pdf",
        exact: true,
      });
      await expect(reader.getByRole("status")).toHaveText("Loading PDF…");
      completeRequest?.();
      await expect(reader.getByRole("alert")).toContainText(
        "could not be previewed"
      );
      await expect(
        reader.getByRole("link", { name: "Open full PDF" })
      ).toHaveAttribute("rel", "noopener noreferrer");
      await reader.getByRole("button", { name: "Try again" }).focus();
      await page.keyboard.press("Enter");
      await expect(
        reader.getByRole("region", { name: "PDF pages" })
      ).toBeFocused();
      await expect(
        reader.getByText("Page 1 of 20", { exact: true })
      ).toBeVisible();
      await expect(
        reader.getByRole("region", { name: "PDF pages" })
      ).toBeFocused();
    });
  });
});
