import path from "node:path";
import type { Page } from "@playwright/test";
import type { ApiWaveOverview } from "../../generated/models/ApiWaveOverview";
import type { ApiDropV2 } from "../../generated/models/ApiDropV2";
import { expect, test, waitForRouteReady } from "../testHelpers";
import {
  getSandboxApiOrigin,
  hideNextDevOverlay,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { installSurfaceSimulation } from "../support/surfaceSimulation";

const WAVE_ID = "00000000-0000-4000-8000-000000000529";
const DROP_ID = "00000000-0000-4000-8000-000000000530";
const MEDIA_ROOT = "https://d3lqz0a4bldqgf.cloudfront.net/drops/viewer-layout/";

async function readBackground(page: Page) {
  return page
    .getByRole("textbox", { name: "Write a message" })
    .evaluate((composer) => {
      const header =
        document.querySelector('button[aria-label="Back"]') ??
        document.querySelector("h1");
      if (!header) throw new Error("Wave header must be mounted");
      const root = document.querySelector(
        "[data-mobile-bottom-nav-scroll-target]"
      );
      const bounds = (element: Element) => {
        const { top, bottom, height } = element.getBoundingClientRect();
        return {
          top,
          bottom,
          height,
          paddingBottom: getComputedStyle(element).paddingBottom,
        };
      };
      return {
        scrollY: window.scrollY,
        scrollTop: document.scrollingElement?.scrollTop,
        scrollHeight: document.scrollingElement?.scrollHeight,
        threadScrollTop: document.querySelector(
          "[data-wave-drops-scroll-container]"
        )?.scrollTop,
        viewport: {
          offsetTop: window.visualViewport?.offsetTop,
          height: window.visualViewport?.height,
          scale: window.visualViewport?.scale,
        },
        header: bounds(header),
        composer: bounds(composer),
        nativeRoot: root ? bounds(root) : null,
      };
    });
}

async function emitKeyboardEvent(
  page: Page,
  eventName: string,
  keyboardHeight = 0
) {
  const delivered = await page.evaluate(
    ({ eventName, keyboardHeight }) =>
      !globalThis.dispatchEvent(
        new CustomEvent(`playwright:${eventName}`, {
          detail: { keyboardHeight },
          cancelable: true,
        })
      ),
    { eventName, keyboardHeight }
  );
  expect(delivered, `Native callback received ${eventName}`).toBe(true);
}

async function installImageDrop(
  page: Page,
  baseURL: string | undefined,
  entry: string
) {
  await page.route("**/api/open-graph**", (route) =>
    route.fulfill({ json: { results: {} } })
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
  if (!source) throw new Error("Image viewer requires the sandbox drop");
  const first = `${MEDIA_ROOT}first.png`;
  const urls =
    entry === "gallery" ? [first, `${MEDIA_ROOT}second.png`] : [first];
  const drop: ApiDropV2 = {
    ...source,
    content:
      entry === "embedded"
        ? `![Layout fixture](${first})`
        : "Image viewer layout fixture",
    media:
      entry === "embedded"
        ? []
        : urls.map((url) => ({ url, mime_type: "image/png" })),
  };
  const headers = { "access-control-allow-origin": "*" };
  await page.route(`${apiOrigin}/api/v2/waves/${WAVE_ID}/drops*`, (route) =>
    route.fulfill({ headers, json: { ...feed, drops: [drop] } })
  );
  await page.route(`${MEDIA_ROOT}**`, (route) =>
    route.fulfill({
      contentType: "image/png",
      path: path.resolve("public/test-wave-icon.png"),
    })
  );
}

test.describe("Image viewer background layout @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_COMPOSER_SANDBOX",
    "Requires the local mock API."
  );

  for (const native of [true, false]) {
    for (const entry of ["attachment", "embedded", "gallery"] as const) {
      test(`preserves geometry for ${entry} images on ${native ? "simulated iOS" : "web"}`, async ({
        page,
        context,
        baseURL,
      }, testInfo) => {
        if (native) {
          await page.setViewportSize({ width: 390, height: 844 });
          await installSurfaceSimulation(context, "capacitor-ios-sim", baseURL);
        }
        await hideNextDevOverlay(context);
        await installImageDrop(page, baseURL, entry);
        await page.goto(`/waves/${WAVE_ID}`);
        await waitForRouteReady(page);
        const composer = page.getByRole("textbox", { name: "Write a message" });
        await expect(composer).toBeVisible();
        if (native) {
          // Desktop WebKit has no device safe area. Supply the native shell's
          // bottom reserve on its real layout root, not an isolated modal host.
          await page
            .getByRole("button", { name: "Back", exact: true })
            .evaluate(() => {
              const root = document.querySelector<HTMLElement>(
                "[data-mobile-bottom-nav-scroll-target]"
              );
              if (!root) throw new Error("Native layout root must be mounted");
              root.style.paddingBottom = "34px";
            });
        }
        const opener = page
          .getByRole("button", {
            name:
              entry === "embedded" ? "Open image preview" : "Open drop media",
            exact: true,
          })
          .first();
        await expect(opener).toBeVisible();
        await opener.scrollIntoViewIfNeeded();
        await page.evaluate(() => window.scrollTo(0, 0));
        const before = await readBackground(page);
        if (native) {
          expect(before.nativeRoot?.paddingBottom).toBe("34px");
          expect(before.scrollHeight).toBeGreaterThan(
            page.viewportSize()!.height
          );
        }
        for (let cycle = 0; cycle < 3; cycle++) {
          if (cycle === 1) {
            await composer.fill("Unsent layout check");
            if (native) {
              await emitKeyboardEvent(page, "keyboardWillShow", 300);
              await page.setViewportSize({ width: 390, height: 544 });
              await emitKeyboardEvent(page, "keyboardDidShow", 300);
            }
            await composer.blur();
            if (native) {
              await emitKeyboardEvent(page, "keyboardWillHide");
              await page.setViewportSize({ width: 390, height: 844 });
              await emitKeyboardEvent(page, "keyboardDidHide");
              await expect.poll(() => readBackground(page)).toEqual(before);
            }
          }
          if (cycle === 1) {
            await opener.focus();
            await page.keyboard.press("Enter");
          } else if (testInfo.project.use.hasTouch) {
            await opener.tap();
          } else {
            await opener.click();
          }
          const close = page.getByRole("button", {
            name: "Close media",
            exact: true,
          });
          await expect(close).toBeVisible();
          await expect
            .poll(() =>
              page.evaluate(() =>
                document.activeElement?.getAttribute("aria-label")
              )
            )
            .toBe("Expanded image preview");
          // Preserve the original focus trap: background controls cannot take
          // focus while the viewer is open.
          await composer.focus();
          await expect
            .poll(() =>
              composer.evaluate(() =>
                Boolean(
                  document.activeElement?.closest(
                    'dialog[aria-label="Expanded image preview"]'
                  )
                )
              )
            )
            .toBe(true);
          expect(await readBackground(page)).toEqual(before);
          if (entry === "gallery") {
            await page
              .getByRole("button", { name: "Next image", exact: true })
              .click();
            await expect(page.getByTestId("image-gallery-counter")).toHaveText(
              "2 / 2"
            );
            expect(await readBackground(page)).toEqual(before);
          }
          if (cycle === 0) await close.click();
          else if (cycle === 1) await page.keyboard.press("Escape");
          else
            await page
              .getByTestId("modal-backdrop")
              .click({ position: { x: 2, y: 2 } });
          await expect(close).toBeHidden();
          await expect.poll(() => readBackground(page)).toEqual(before);
          if (cycle === 1) await expect(opener).toBeFocused();
        }
        await expect(composer).toHaveText("Unsent layout check");
      });
    }
  }
});
