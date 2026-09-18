import type { Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";
import { MEMES_MINT_TITLE_PATTERN } from "../support/mintTitle";

async function gotoReady(page: Page, path: string) {
  await gotoDocumentWithTransientRetry(page, path);
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
}

async function expectNavigation(page: Page, name: string) {
  await expect(page.getByRole("navigation", { name })).toBeVisible();
}

async function expectTableHasRows(page: Page, regionName: string) {
  const region = page.getByRole("region", { name: regionName });
  await expect(
    region.getByRole("table", { name: "NFT activity" }).getByRole("row").first()
  ).toBeVisible({ timeout: 20000 });
}

function isLocalBaseURL(baseURL?: string) {
  if (!baseURL) {
    return true;
  }

  const hostname = new URL(baseURL).hostname;

  return hostname === "localhost" || hostname === "127.0.0.1";
}

function isProductionBaseURL(baseURL?: string) {
  if (!baseURL) {
    return false;
  }

  return new URL(baseURL).hostname === "6529.io";
}

test.describe("Media, mint, and detail read-only coverage @surface @medium @large @readonly", () => {
  test("renders The Memes card detail shell", async ({ page }) => {
    await gotoReady(page, "/the-memes/1");

    await expect(page).toHaveTitle("6529Seizing | The Memes #1");
    await expect(
      page.getByRole("heading", { level: 1, name: "Card 1 - 6529Seizing" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to The Memes" })
    ).toHaveAttribute("href", "/the-memes");
    await expectNavigation(page, "Meme page sections");
    await expect(
      page.getByRole("button", { name: "Overview" })
    ).toHaveAttribute("aria-current", "page");
    await expect(
      page.getByRole("button", { name: "Collectors" })
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "History" })).toBeVisible();
    await expect(
      page.getByRole("button", { name: "References" })
    ).toBeVisible();
    await expect(
      page.locator("img#the-art-fullscreen-img[alt='6529Seizing']")
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Full screen" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Open in new tab" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Download media" })
    ).toBeVisible();
  });

  test("renders The Memes activity focus with locale-preserving links", async ({
    baseURL,
    page,
  }) => {
    await gotoReady(page, "/the-memes/1?focus=activity&locale=de-DE");

    await expectNavigation(page, "Meme history sections");
    await expect(page.getByRole("button", { name: "History" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(
      page.getByRole("tab", { name: "Card Activity" })
    ).toBeVisible();
    await expect(
      page.getByRole("tab", { name: "Card Activity" })
    ).toHaveAttribute("aria-selected", "true");
    await expect(page.getByRole("tab", { name: "Timeline" })).toBeVisible();
    await expect(
      page.getByRole("region", { name: "The Memes card activity" })
    ).toBeVisible();
    if (!isLocalBaseURL(baseURL)) {
      await expectTableHasRows(page, "The Memes card activity");
    }
    await expect(
      page.getByRole("link", { name: "View SZN 1 cards" })
    ).toHaveAttribute(
      "href",
      "/the-memes?szn=1&sort=age&sort_dir=ASC&locale=de-DE"
    );
  });

  test("renders The Memes mint page read-only", async ({ page }) => {
    await gotoReady(page, "/the-memes/mint");

    await expect(page).toHaveTitle(MEMES_MINT_TITLE_PATTERN);
    await expect(page.getByText("Retrieving Mint information")).toBeHidden({
      timeout: 15000,
    });
    await expect(
      page.locator("main a[href^='/the-memes/']").first()
    ).toBeVisible({ timeout: 15000 });
    await expect(
      page.locator("main [data-nft-media-renderer]").first()
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Distribution Plan" })
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Edition Size" }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Minting Approach" })
    ).toBeVisible();
    await expect(page.getByRole("cell", { name: "Mint Price" })).toBeVisible();
    await expect(
      page.getByRole("cell", { name: "Status" }).first()
    ).toBeVisible();
  });

  test("renders Meme Lab card activity focus with locale-preserving links", async ({
    baseURL,
    page,
  }) => {
    await gotoReady(page, "/meme-lab/1?focus=activity&locale=de-DE");

    await expect(page).toHaveTitle(
      "Spread the Memes | Meme Lab #1 | Card Activity"
    );
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Meme Lab Card 1 - Spread the Memes",
      })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Back to Meme Lab" })
    ).toHaveAttribute("href", "/meme-lab?locale=de-DE");
    await expectNavigation(page, "Meme Lab page sections");
    await expectNavigation(page, "Meme Lab history sections");
    await expect(page.getByRole("button", { name: "History" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(
      page.getByRole("region", { name: "Meme Lab activity" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Card Volumes" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Card Activity" })
    ).toBeVisible();
    if (!isLocalBaseURL(baseURL)) {
      await expect(
        page.getByRole("table").first().getByRole("row").nth(1)
      ).toBeVisible();
    }
    await expect(
      page.locator("img#the-art-fullscreen-img[alt='Spread the Memes']")
    ).toBeVisible();
  });

  test.describe("production ReMemes detail fixture", () => {
    test.skip(
      ({ baseURL }) => !isProductionBaseURL(baseURL),
      "this ReMeme detail fixture is only stable against production data"
    );

    test("renders ReMemes detail tabs without mutation", async ({ page }) => {
      await gotoReady(
        page,
        "/rememes/0xfb7dc9be63e53e24b217c02c16f3952ac3546e5f/7"
      );

      await expect(
        page.getByRole("link", { name: "Back to ReMemes" })
      ).toHaveAttribute("href", "/rememes");
      await expect(page).toHaveTitle(
        /^SeizeGenart \| ReMemes(?: \| 6529\.io)?$/
      );
      await expect(
        page.getByRole("heading", { level: 1, name: "ReMemes - SeizeGenart" })
      ).toBeVisible();
      await expectNavigation(page, "ReMemes page sections");
      await expect(
        page.getByRole("button", { name: "Overview" })
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByRole("region", { name: "ReMeme details" })
      ).toBeVisible();
      await expect(
        page.locator("main img[alt='SeizeGenart']").first()
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "View Genart Memes on Etherscan" })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Open @kkostya on X" })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Open OpenSea" })
      ).toBeVisible();
      await expect(
        page.getByRole("link", { name: "Open Rarible" })
      ).toBeVisible();

      await page.getByRole("button", { name: "Metadata" }).click();
      await expect(
        page.getByRole("button", { name: "Metadata" })
      ).toHaveAttribute("aria-pressed", "true");
      await page.getByRole("button", { name: "References" }).click();
      await expect(
        page.getByRole("button", { name: "References" })
      ).toHaveAttribute("aria-pressed", "true");
    });
  });
});

// Cards 549 (portrait) and 550 (square) are video fixtures on staging. Other environments
// have independent collections, so their existing detail fixtures stay intact.
test.describe("Staging video artwork sizing @surface @medium @large @readonly", () => {
  // This fixture is unavailable outside staging; skip only those environments.
  test.skip(({ baseURL }) => {
    if (!baseURL) return true;
    try {
      return new URL(baseURL).hostname !== "staging.6529.io";
    } catch {
      return true;
    }
  }, "video fixtures 549 and 550 are qualified on staging only");

  test("centers homepage artwork without resizing when its column grows", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1440, height: 1000 });
    await gotoReady(page, "/");
    const column = page
      .getByText(/^(Latest Drop|Next Drop)$/)
      .locator("..")
      .locator("[data-home-artwork-column]");
    await expect(column).toBeVisible();
    const video = column.getByLabel("Video player", { exact: true });
    // The live homepage rotates between image and video drops. This regression
    // needs a video; fixed video fixtures below still run when the homepage is an image.
    test.skip(
      (await video.count()) === 0,
      "Current homepage drop is not a video"
    );
    await expect(video).toBeVisible();
    await expect
      .poll(() =>
        video.evaluate((element: HTMLVideoElement) => element.videoWidth)
      )
      .toBeGreaterThan(0);
    const geometry = await column.evaluate(async (element: HTMLElement) => {
      const frame = element.firstElementChild as HTMLElement;
      const baseline = frame.getBoundingClientRect();
      const originalStyle = element.getAttribute("style");
      const initialColumn = element.getBoundingClientRect();
      const initialOffset =
        baseline.top +
        baseline.height / 2 -
        initialColumn.top -
        initialColumn.height / 2;
      try {
        element.style.minHeight = `${initialColumn.height + 180}px`;
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        );
        const bounds = frame.getBoundingClientRect();
        const outer = element.getBoundingClientRect();
        return {
          initialOffset,
          finalOffset:
            bounds.top + bounds.height / 2 - outer.top - outer.height / 2,
          widthChange: bounds.width - baseline.width,
          heightChange: bounds.height - baseline.height,
          height: baseline.height,
        };
      } finally {
        if (originalStyle === null) element.removeAttribute("style");
        else element.setAttribute("style", originalStyle);
      }
    });
    expect(geometry.height).toBeGreaterThan(0);
    expect(Math.abs(geometry.initialOffset)).toBeLessThanOrEqual(2);
    expect(Math.abs(geometry.finalOffset)).toBeLessThanOrEqual(2);
    expect(Math.abs(geometry.widthChange)).toBeLessThanOrEqual(2);
    expect(Math.abs(geometry.heightChange)).toBeLessThanOrEqual(2);
  });

  for (const viewport of [
    { width: 390, height: 844 },
    { width: 390, height: 600 },
    { width: 1440, height: 1000 },
    { width: 1440, height: 600 },
  ]) {
    for (const tokenId of [549, 550]) {
      test(`contains and centers video ${tokenId} at ${viewport.width}x${viewport.height}`, async ({
        page,
      }) => {
        await page.setViewportSize(viewport);
        await gotoReady(page, `/the-memes/${tokenId}`);
        const video = page.getByLabel("Video player", { exact: true });
        await expect(video).toBeVisible();
        await expect
          .poll(() =>
            video.evaluate((element: HTMLVideoElement) => element.videoWidth)
          )
          .toBeGreaterThan(0);
        await video.evaluate((element: HTMLVideoElement) => element.pause());
        await expect(
          page.getByRole("slider", { name: "Seek video" })
        ).toBeVisible();

        const geometry = await video.evaluate((element: HTMLVideoElement) => {
          const bounds = element.getBoundingClientRect();
          const frame = element.closest("section")!.getBoundingClientRect();
          const stageElement = element.closest<HTMLElement>(
            "[data-artwork-stage]"
          )!;
          const stage = stageElement.getBoundingClientRect();
          const player = element.parentElement!.parentElement!;
          const playerStyle = getComputedStyle(player);
          const heightLimit = Number.parseFloat(playerStyle.maxHeight);
          const shellReserve = [
            "--stream-route-loading-header-reserve",
            "--stream-route-loading-bottom-reserve",
          ].reduce(
            (total, property) =>
              total +
              (Number.parseFloat(playerStyle.getPropertyValue(property)) || 0),
            0
          );
          const scale = Math.min(
            bounds.width / element.videoWidth,
            bounds.height / element.videoHeight
          );
          const width = element.videoWidth * scale;
          const height = element.videoHeight * scale;
          const left = bounds.left + (bounds.width - width) / 2;
          const top = bounds.top + (bounds.height - height) / 2;
          const slider = element
            .parentElement!.querySelector("input[type=range]")!
            .getBoundingClientRect();
          return {
            height,
            heightLimit,
            shellReserve,
            expectedWidth: Math.min(
              frame.width,
              (heightLimit * element.videoWidth) / element.videoHeight
            ),
            width,
            widthGap: frame.width - width,
            heightGap: frame.height - height,
            centerX: left + width / 2 - (frame.left + frame.width / 2),
            centerY: top + height / 2 - (frame.top + frame.height / 2),
            stageCenterY: top + height / 2 - (stage.top + stage.height / 2),
            background: getComputedStyle(stageElement).backgroundColor,
            sliderInsets: [
              slider.left - left,
              left + width - slider.right,
              slider.top - top,
              top + height - slider.bottom,
            ],
          };
        });
        expect(Math.abs(geometry.centerX)).toBeLessThanOrEqual(2);
        expect(Math.abs(geometry.centerY)).toBeLessThanOrEqual(2);
        expect(Math.abs(geometry.stageCenterY)).toBeLessThanOrEqual(2);
        expect(geometry.background).toBe("rgb(19, 19, 22)");
        expect(
          Math.min(Math.abs(geometry.widthGap), Math.abs(geometry.heightGap))
        ).toBeLessThanOrEqual(2);
        // The requested screen-height cap replaces unconditional full-width sizing.
        expect(Number.isFinite(geometry.heightLimit)).toBe(true);
        expect(geometry.heightLimit).toBeGreaterThan(0);
        expect(geometry.heightLimit).toBeLessThanOrEqual(
          Math.max(1, viewport.height - geometry.shellReserve) * 0.95 + 2
        );
        expect(geometry.height).toBeLessThanOrEqual(geometry.heightLimit + 2);
        expect(
          Math.abs(geometry.width - geometry.expectedWidth)
        ).toBeLessThanOrEqual(2);
        for (const inset of geometry.sliderInsets)
          expect(inset).toBeGreaterThanOrEqual(-2);

        // Reproduce the recording's changing details/ownership space without
        // depending on wallet-specific API timing or modifying remote data.
        const shifts = await video.evaluate(
          async (element: HTMLVideoElement) => {
            const artwork = element.closest<HTMLElement>(
              "[data-video-artwork]"
            )!;
            const column = artwork.parentElement!;
            const originalStyle = column.getAttribute("style");
            const baseline = element.getBoundingClientRect();
            const ownershipPanel = document.createElement("div");
            ownershipPanel.style.cssText = "height: 180px; flex: none";
            ownershipPanel.setAttribute("aria-hidden", "true");
            const measurements: number[] = [];
            artwork.append(ownershipPanel);
            try {
              for (const height of [1600, 2100, 1300]) {
                column.style.height = `${height}px`;
                column.style.flex = "none";
                await new Promise<void>((resolve) => {
                  requestAnimationFrame(() =>
                    requestAnimationFrame(() => resolve())
                  );
                });
                const bounds = element.getBoundingClientRect();
                const stage = element
                  .closest("[data-artwork-stage]")!
                  .getBoundingClientRect();
                measurements.push(
                  Math.abs(bounds.width - baseline.width),
                  Math.abs(bounds.height - baseline.height),
                  Math.abs(
                    artwork.getBoundingClientRect().height -
                      column.getBoundingClientRect().height
                  ),
                  Math.abs(
                    bounds.top +
                      bounds.height / 2 -
                      stage.top -
                      stage.height / 2
                  )
                );
              }
            } finally {
              ownershipPanel.remove();
              if (originalStyle === null) column.removeAttribute("style");
              else column.setAttribute("style", originalStyle);
            }
            return measurements;
          }
        );
        for (const shift of shifts) expect(shift).toBeLessThanOrEqual(2);
      });
    }
  }
});
