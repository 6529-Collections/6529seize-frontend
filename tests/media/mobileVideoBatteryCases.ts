import { expect, test } from "../testHelpers";
import { gotoReady } from "../support/routeReadiness";

/** The same source-unload and position contract applies to native and mobile web. */
export function defineMobileVideoBatteryTest(
  title: string,
  isSupportedProject: (name: string) => boolean
) {
  test(`${title} @surface @medium @readonly`, async ({ page }, testInfo) => {
    // Desktop/Electron retain their existing buffering policy. The mobile web
    // caller also keeps its existing staging-only video fixture qualification.
    test.skip(
      !isSupportedProject(testInfo.project.name),
      "This source-unload contract applies to mobile battery-saving environments"
    );
    await gotoReady(page, "/the-memes/549");
    const video = page.getByLabel("Video player", { exact: true });
    await video.scrollIntoViewIfNeeded();
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => element.readyState)
      )
      .toBeGreaterThanOrEqual(1);
    const pauseButton = page
      .getByRole("button", { name: "Pause video", exact: true })
      .first();
    await expect(pauseButton).toBeVisible();
    await pauseButton.click();
    await page
      .getByRole("button", { name: "Unmute video", exact: true })
      .first()
      .click();
    await video.evaluate((element: HTMLVideoElement) => {
      element.currentTime = 1;
    });
    const source = await video.getAttribute("src");
    expect(source).toBeTruthy();
    if (!source)
      throw new Error("Visible artwork video did not attach its source");
    const originalStyle = await video.evaluate((element) => {
      const wrapper = element.parentElement!.parentElement!;
      const style = wrapper.getAttribute("style");
      wrapper.style.transform = "translateY(300vh)";
      return style;
    });
    await expect(video).not.toHaveAttribute("src");
    await video.evaluate((element, style) => {
      const wrapper = element.parentElement!.parentElement!;
      if (style === null) wrapper.removeAttribute("style");
      else wrapper.setAttribute("style", style);
    }, originalStyle);
    await expect(video).toHaveAttribute("src", source);
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => element.currentTime)
      )
      .toBeCloseTo(1, 1);
    expect(
      await video.evaluate((element: HTMLVideoElement) => element.muted)
    ).toBe(false);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(video).not.toHaveAttribute("src");
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        value: "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await expect(video).toHaveAttribute("src", source);
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => element.readyState)
      )
      .toBeGreaterThanOrEqual(1);
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => element.currentTime)
      )
      .toBeCloseTo(1, 1);
    expect(
      await video.evaluate((element: HTMLVideoElement) => element.paused)
    ).toBe(true);
    expect(
      await video.evaluate((element: HTMLVideoElement) => element.muted)
    ).toBe(false);
  });
}
