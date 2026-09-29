import { expect, test, waitForRouteReady } from "../testHelpers";
import {
  dismissNextDevTools,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
} from "../support/localSandbox";
import {
  installLinkedDropVideoSandbox,
  installVideoArtworkSandbox,
} from "../support/videoArtworkSandbox";

// Registered inside the composer sandbox suite, which supplies its local-only guard.
export function defineWaveVideoLayoutTests() {
  test("contains linked-drop video and controls for every major aspect ratio", async ({
    page,
    baseURL,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    const fixturePath = await installLinkedDropVideoSandbox(page, baseURL);
    await page.goto(fixturePath, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);
    await dismissNextDevTools(page);

    const card = page
      .getByRole("heading", {
        name: "Local linked video fixture",
        exact: true,
      })
      .locator("xpath=ancestor::div[contains(@class, 'tw-border')][1]");
    await expect(card).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    const video = card.getByLabel("Video player", { exact: true });
    await expect(video).toBeVisible();
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => element.videoWidth)
      )
      .toBeGreaterThan(0);
    await video.evaluate((element: HTMLVideoElement) => element.pause());

    for (const [width, height] of [
      [600, 900],
      [900, 900],
      [1600, 900],
    ] as const) {
      await video.evaluate(
        (element: HTMLVideoElement, dimensions) => {
          Object.defineProperties(element, {
            videoWidth: { configurable: true, value: dimensions.width },
            videoHeight: { configurable: true, value: dimensions.height },
          });
          element.dispatchEvent(new Event("loadedmetadata"));
        },
        { width, height }
      );
      await expect
        .poll(() =>
          video.evaluate((element: HTMLVideoElement) =>
            element.parentElement!.parentElement!.style.getPropertyValue(
              "--video-ratio"
            )
          )
        )
        .toBe(String(width / height));

      const geometry = await video.evaluate((element: HTMLVideoElement) => {
        const mediaBox = element.closest<HTMLElement>(".tw-h-96")!;
        const surface = element.closest<HTMLElement>("[data-video-surface]")!;
        const slider = surface.querySelector<HTMLElement>(
          'input[type="range"]'
        )!;
        const bounds = {
          card: cardBounds(mediaBox.parentElement!),
          mediaBox: cardBounds(mediaBox),
          mediaBoxBackground: getComputedStyle(mediaBox).backgroundColor,
          slider: cardBounds(slider),
          surface: cardBounds(surface),
          video: cardBounds(element),
        };

        function cardBounds(target: Element) {
          const rect = target.getBoundingClientRect();
          return {
            top: rect.top,
            right: rect.right,
            bottom: rect.bottom,
            left: rect.left,
            height: rect.height,
            width: rect.width,
          };
        }

        return bounds;
      });

      expect(geometry.mediaBox.height).toBe(384);
      expect(geometry.mediaBoxBackground).toBe("rgba(28, 28, 33, 0.3)");
      for (const bounded of [
        geometry.surface,
        geometry.video,
        geometry.slider,
      ]) {
        expect(bounded.top).toBeGreaterThanOrEqual(geometry.mediaBox.top - 2);
        expect(bounded.right).toBeLessThanOrEqual(geometry.mediaBox.right + 2);
        expect(bounded.bottom).toBeLessThanOrEqual(
          geometry.mediaBox.bottom + 2
        );
        expect(bounded.left).toBeGreaterThanOrEqual(geometry.mediaBox.left - 2);
      }
      expect(geometry.video.bottom).toBeLessThanOrEqual(
        geometry.card.bottom + 2
      );
    }
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 390, height: 600 },
    { width: 1440, height: 1000 },
    { width: 1440, height: 600 },
  ]) {
    test(`fits wave submission video below its header at ${viewport.width}x${viewport.height}`, async ({
      page,
      baseURL,
    }) => {
      await page.setViewportSize(viewport);
      const fixturePath = await installVideoArtworkSandbox(page, baseURL);
      await page.goto(fixturePath, { waitUntil: "domcontentloaded" });
      await waitForRouteReady(page);
      await expect(page).toHaveURL(
        (url) => `${url.pathname}${url.search}` === fixturePath
      );
      await expect(
        page.getByRole("button", { name: "Close panel", exact: true })
      ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
      await dismissNextDevTools(page);
      const artwork = page
        .getByRole("button", { name: "Close panel", exact: true })
        .locator("xpath=ancestor::*[@data-video-viewport]")
        .locator("[data-video-artwork]");
      const video = artwork.getByLabel("Video player", { exact: true });
      await expect(video).toBeVisible({
        timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
      });
      await expect(video).toHaveAttribute(
        "src",
        /\/__video-fixture\/portrait\.mp4$/
      );
      await expect
        .poll(() =>
          video.evaluate((element: HTMLVideoElement) => element.videoWidth)
        )
        .toBeGreaterThan(0);
      await video.evaluate((element: HTMLVideoElement) => element.pause());
      await expect(
        artwork.getByRole("slider", { name: "Seek video" })
      ).toBeVisible();

      const geometry = await video.evaluate((element: HTMLVideoElement) => {
        const player = element.parentElement!.parentElement!;
        const hero = element.closest<HTMLElement>("[data-video-artwork]")!;
        const viewportBounds = element
          .closest<HTMLElement>("[data-video-viewport]")!
          .getBoundingClientRect();
        const bounds = element.getBoundingClientRect();
        const stage = hero.getBoundingClientRect();
        const paddingStyle = getComputedStyle(hero.firstElementChild!);
        const padding =
          Number.parseFloat(paddingStyle.paddingTop) +
          Number.parseFloat(paddingStyle.paddingBottom);
        const rootFontSize = Number.parseFloat(
          getComputedStyle(document.documentElement).fontSize
        );
        const slider = element
          .parentElement!.querySelector("input[type=range]")!
          .getBoundingClientRect();
        const frame =
          player.parentElement!.parentElement!.getBoundingClientRect();
        return {
          height: bounds.height,
          width: bounds.width,
          heightLimit: Number.parseFloat(getComputedStyle(player).maxHeight),
          padding,
          headerReserve: rootFontSize * 4,
          heroHeight: hero.getBoundingClientRect().height,
          viewportHeight: Math.min(window.innerHeight, viewportBounds.height),
          frameWidth: frame.width,
          ratio: element.videoWidth / element.videoHeight,
          centerOffset:
            bounds.left + bounds.width / 2 - frame.left - frame.width / 2,
          verticalCenterOffset:
            bounds.top + bounds.height / 2 - stage.top - stage.height / 2,
          sliderInsets: [
            slider.left - bounds.left,
            bounds.right - slider.right,
            slider.top - bounds.top,
            bounds.bottom - slider.bottom,
          ],
        };
      });
      // The overlay owns its header; its former 95vh/minimum-height frame must
      // not override the shared cap or push the controls below a short screen.
      const availableHeight =
        geometry.viewportHeight - geometry.headerReserve - geometry.padding;
      expect(Number.isFinite(geometry.heightLimit)).toBe(true);
      expect(geometry.heightLimit).toBeGreaterThan(0);
      expect(geometry.heightLimit).toBeLessThanOrEqual(
        availableHeight * 0.95 + 2
      );
      expect(geometry.height).toBeLessThanOrEqual(geometry.heightLimit + 2);
      expect(geometry.heroHeight + geometry.headerReserve).toBeLessThanOrEqual(
        geometry.viewportHeight + 2
      );
      expect(
        geometry.heroHeight + geometry.headerReserve
      ).toBeGreaterThanOrEqual(geometry.viewportHeight - 2);
      expect(
        Math.abs(geometry.width / geometry.height - geometry.ratio)
      ).toBeLessThan(0.01);
      expect(
        Math.abs(
          geometry.width -
            Math.min(geometry.frameWidth, geometry.heightLimit * geometry.ratio)
        )
      ).toBeLessThanOrEqual(2);
      expect(Math.abs(geometry.centerOffset)).toBeLessThanOrEqual(2);
      expect(Math.abs(geometry.verticalCenterOffset)).toBeLessThanOrEqual(2);
      for (const inset of geometry.sliderInsets)
        expect(inset).toBeGreaterThanOrEqual(-2);
    });
  }
}
