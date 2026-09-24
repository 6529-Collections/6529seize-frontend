import type { Locator } from "@playwright/test";
import { expect, test, waitForRouteReady } from "../testHelpers";
import { installImageArtworkSandbox } from "../support/videoArtworkSandbox";

export async function expectContainedImage(image: Locator) {
  await expect(image).toBeVisible();
  await expect
    .poll(() =>
      image.evaluate((element: HTMLImageElement) => element.naturalWidth)
    )
    .toBeGreaterThan(0);
  const geometry = await image.evaluate((element: HTMLImageElement) => {
    const frame = element.closest<HTMLElement>("[data-artwork-image-frame]")!;
    const bounds = element.getBoundingClientRect();
    const outer = frame.getBoundingClientRect();
    const scale = Math.min(
      bounds.width / element.naturalWidth,
      bounds.height / element.naturalHeight
    );
    return {
      fit: getComputedStyle(element).objectFit,
      width: element.naturalWidth * scale,
      height: element.naturalHeight * scale,
      frameWidth: outer.width,
      frameHeight: outer.height,
      cap: Number.parseFloat(getComputedStyle(frame).maxHeight),
      x: bounds.x + bounds.width / 2 - outer.x - outer.width / 2,
      y: bounds.y + bounds.height / 2 - outer.y - outer.height / 2,
    };
  });
  expect(geometry.fit).toBe("contain");
  expect(geometry.height).toBeGreaterThan(0);
  expect(geometry.height).toBeLessThanOrEqual(geometry.cap + 2);
  expect(geometry.width).toBeLessThanOrEqual(geometry.frameWidth + 2);
  expect(
    Math.min(
      Math.abs(geometry.width - geometry.frameWidth),
      Math.abs(geometry.height - geometry.frameHeight)
    )
  ).toBeLessThanOrEqual(2);
  expect(Math.abs(geometry.x)).toBeLessThanOrEqual(2);
  expect(Math.abs(geometry.y)).toBeLessThanOrEqual(2);
}

export function defineNftImageLayoutTests() {
  for (const width of [390, 1023]) {
    test(`homepage image uses natural height without gaps at ${width}px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height: 844 });
      await page.goto("/");
      await waitForRouteReady(page);
      const column = page
        .getByText(/^(Latest Drop|Next Drop)$/)
        .locator("..")
        .locator("[data-home-artwork-column]");
      await expect(column).toBeVisible();
      await expect(column).toHaveAttribute(
        "data-home-artwork-is-image",
        /^(true|false)$/
      );
      test.skip(
        (await column.getAttribute("data-home-artwork-is-image")) === "false",
        "Current homepage media data identifies a non-image drop"
      );
      const image = column
        .getByRole("img")
        .locator("xpath=self::*[ancestor::*[@data-artwork-image-frame]]")
        .first();
      await expect(image).toBeVisible();
      await expect(image).toHaveJSProperty("tagName", "IMG");
      await expect
        .poll(() =>
          image.evaluate((element: HTMLImageElement) => element.naturalWidth)
        )
        .toBeGreaterThan(0);
      const layout = await image.evaluate((element: HTMLImageElement) => {
        const column = element.closest("[data-home-artwork-column]");
        if (!column) {
          throw new Error("Homepage image is missing its artwork column");
        }
        const detailsElement = column.nextElementSibling;
        if (!detailsElement) {
          throw new Error(
            "Homepage artwork column is missing its details sibling"
          );
        }
        const artwork = column.getBoundingClientRect();
        const bounds = element.getBoundingClientRect();
        const details = detailsElement.getBoundingClientRect();
        return {
          width: bounds.width,
          availableWidth: artwork.width,
          height: bounds.height,
          naturalHeight:
            (bounds.width * element.naturalHeight) / element.naturalWidth,
          topGap: bounds.top - artwork.top,
          bottomGap: details.top - bounds.bottom,
        };
      });
      expect(layout.width).toBeGreaterThan(0);
      expect(
        Math.abs(layout.width - layout.availableWidth)
      ).toBeLessThanOrEqual(2);
      expect(
        Math.abs(layout.height - layout.naturalHeight)
      ).toBeLessThanOrEqual(2);
      expect(Math.abs(layout.topGap)).toBeLessThanOrEqual(2);
      expect(Math.abs(layout.bottomGap)).toBeLessThanOrEqual(2);
    });
  }

  for (const viewport of [
    { width: 390, height: 600 },
    { width: 1440, height: 1000 },
    { width: 1440, height: 600 },
  ]) {
    test(`fits Meme image without shifting as details grow at ${viewport.width}x${viewport.height}`, async ({
      page,
    }) => {
      await page.setViewportSize(viewport);
      await page.goto("/the-memes/551");
      await waitForRouteReady(page);
      const image = page
        .getByRole("img")
        .locator("xpath=self::*[@data-artwork-image]");
      await expectContainedImage(image);
      const shift = await image.evaluate(async (element: HTMLImageElement) => {
        const column = element.closest("[data-image-artwork]")!.parentElement!;
        const before = element.getBoundingClientRect();
        const originalStyle = column.getAttribute("style");
        try {
          (column as HTMLElement).style.minHeight =
            `${column.getBoundingClientRect().height + 300}px`;
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve())
          );
          const after = element.getBoundingClientRect();
          return {
            top: after.top - before.top,
            height: after.height - before.height,
            width: after.width - before.width,
          };
        } finally {
          if (originalStyle === null) column.removeAttribute("style");
          else column.setAttribute("style", originalStyle);
        }
      });
      for (const delta of Object.values(shift))
        expect(Math.abs(delta)).toBeLessThanOrEqual(2);
    });
  }

  test("fits homepage image to details and the screen cap", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 600 });
    await page.goto("/");
    await waitForRouteReady(page);
    const column = page
      .getByText(/^(Latest Drop|Next Drop)$/)
      .locator("..")
      .locator("[data-home-artwork-column]");
    await expect(column).toBeVisible();
    await expect(column).toHaveAttribute(
      "data-home-artwork-is-image",
      /^(true|false)$/
    );
    test.skip(
      (await column.getAttribute("data-home-artwork-is-image")) === "false",
      "Current homepage media data identifies a non-image drop"
    );
    const image = column
      .getByRole("img")
      .locator("xpath=self::*[ancestor::*[@data-artwork-image-frame]]")
      .first();
    await expectContainedImage(image);
    const layout = await image.evaluate((element: HTMLImageElement) => {
      const column = element.closest("[data-home-artwork-column]")!;
      const frame = element.closest("[data-artwork-image-frame]")!;
      return {
        frame: frame.getBoundingClientRect().height,
        details: column.nextElementSibling!.getBoundingClientRect().height,
      };
    });
    expect(layout.frame).toBeLessThanOrEqual(layout.details + 2);
  });
}

export function defineWaveImageLayoutTests() {
  for (const viewport of [
    { width: 390, height: 600 },
    { width: 1440, height: 600 },
  ]) {
    for (const dimensions of [
      { width: 700, height: 1000 },
      { width: 1000, height: 1000 },
      { width: 1600, height: 900 },
    ]) {
      test(`fits ${dimensions.width}x${dimensions.height} submission image at ${viewport.width}x${viewport.height}`, async ({
        page,
        baseURL,
      }) => {
        await page.setViewportSize(viewport);
        const route = await installImageArtworkSandbox(
          page,
          baseURL,
          dimensions
        );
        await page.goto(route);
        await waitForRouteReady(page);
        const close = page.getByRole("button", {
          name: "Close panel",
          exact: true,
        });
        await expect(close).toBeVisible();
        const image = page
          .getByRole("button", { name: "Close panel", exact: true })
          .locator("xpath=ancestor::*[@data-video-viewport]")
          .locator("[data-image-artwork]")
          .getByRole("img");
        await expectContainedImage(image);
        const layout = await image.evaluate((element: HTMLImageElement) => {
          const frame = element.closest<HTMLElement>(
            "[data-artwork-image-frame]"
          )!;
          const hero = element.closest<HTMLElement>("[data-image-artwork]")!;
          const overlay = element.closest<HTMLElement>(
            "[data-video-viewport]"
          )!;
          const header = Number.parseFloat(
            getComputedStyle(overlay).getPropertyValue("--video-header-reserve")
          );
          const paddingStyle = getComputedStyle(hero.firstElementChild!);
          const padding =
            Number.parseFloat(paddingStyle.paddingTop) +
            Number.parseFloat(paddingStyle.paddingBottom);
          return {
            cap: frame.getBoundingClientRect().height,
            padding,
            header: Number.isFinite(header)
              ? header
              : 4 *
                Number.parseFloat(
                  getComputedStyle(document.documentElement).fontSize
                ),
            available: Math.min(
              window.innerHeight,
              overlay.getBoundingClientRect().height
            ),
          };
        });
        expect(layout.cap).toBeLessThanOrEqual(
          (layout.available - layout.header - layout.padding) * 0.95 + 2
        );
      });
    }
  }
}
