import path from "node:path";
import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  dismissNextDevTools,
  getSandboxApiOrigin,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";
import { installImageArtworkSandbox } from "../support/videoArtworkSandbox";
import { defineSubmissionArtworkPreviewTests } from "./waveImagePreviewCases";

test.describe("Submission artwork previews @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Submission artwork tests require an isolated local mock API."
  );

  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  defineSubmissionArtworkPreviewTests();

  for (const posterSource of ["device", "generated", "missing"] as const) {
    test(`shows an additional video ${posterSource} preview without requesting the original before Play`, async ({
      page,
      baseURL,
    }, testInfo) => {
      const fixturePath = await installImageArtworkSandbox(page, baseURL, {
        width: 960,
        height: 540,
      });
      const apiOrigin = getSandboxApiOrigin(baseURL);
      const cloudfront =
        process.env["NEXT_PUBLIC_CLOUDFRONT_DOMAIN"] ??
        "https://d3lqz0a4bldqgf.cloudfront.net";
      const original = `${cloudfront}/drops/additional-video-fixture/process.MP4`;
      const posterFile =
        posterSource === "device"
          ? "process_device.jpg"
          : "process_poster.0000001.jpg";
      const headers = { "access-control-allow-origin": "*" };
      await page.route(
        `${apiOrigin}/api/v2/drops/00000000-0000-4000-8000-000000000530/metadata`,
        (route) =>
          route.fulfill({
            headers,
            json: [
              {
                data_key: "additional_media",
                data_value: JSON.stringify({
                  artwork_commentary_media: [original],
                }),
              },
            ],
          })
      );
      await page.route(
        `${cloudfront}/renditions/drops/additional-video-fixture/process/**`,
        (route) => {
          if (
            posterSource === "missing" ||
            !route.request().url().endsWith(posterFile)
          ) {
            return route.fulfill({ status: 404, headers });
          }
          return route.fulfill({
            headers,
            contentType: "image/png",
            path: path.resolve("public/test-wave-icon.png"),
          });
        }
      );
      const originalRequests: string[] = [];
      await page.route(original, (route) => {
        originalRequests.push(route.request().method());
        return route.fulfill({
          headers,
          contentType: "video/mp4",
          path: path.resolve("tests/media/fixtures/portrait.mp4"),
        });
      });
      await page.goto(fixturePath, { waitUntil: "domcontentloaded" });
      await waitForRouteReady(page);
      await dismissNextDevTools(page);
      const section = page
        .getByRole("heading", { name: "Additional Media", exact: true })
        .locator("..");
      const video = section.getByLabel("Video player", { exact: true });
      await video.scrollIntoViewIfNeeded();
      const expectedPoster =
        posterSource === "missing"
          ? "/video-preview-placeholder.svg"
          : `${cloudfront}/renditions/drops/additional-video-fixture/process/poster/${posterFile}`;
      await expect(video).toHaveAttribute("poster", expectedPoster);
      await expect(video).toHaveAttribute("preload", "none");
      expect(
        await video.evaluate(async (element: HTMLVideoElement) => {
          const image = new Image();
          image.src = element.poster;
          await image.decode();
          return image.naturalWidth > 0 && image.naturalHeight > 0;
        })
      ).toBe(true);
      expect(originalRequests).toHaveLength(0);
      expect(
        await video.evaluate((element: HTMLVideoElement) => element.readyState)
      ).toBe(0);
      await expectNoHorizontalOverflow(page);
      await testInfo.attach("additional-video-preview", {
        body: await section.screenshot(),
        contentType: "image/png",
      });
      // Native controls stay keyboard-operable. Space is the browser's Play action.
      await video.focus();
      await video.press("Space");
      await expect.poll(() => originalRequests.length).toBeGreaterThan(0);
      await expect
        .poll(() =>
          video.evaluate((element: HTMLVideoElement) => element.videoWidth)
        )
        .toBeGreaterThan(0);
      await video.evaluate((element: HTMLVideoElement) => element.pause());
    });
  }
});
