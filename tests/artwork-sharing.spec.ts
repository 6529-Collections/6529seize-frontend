import type { Locator, Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

import { gotoDocumentWithTransientRetry } from "./support/routeReadiness";
import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
} from "./testHelpers";

const FORMATS = [
  { name: "Feed · 4:5", key: "portrait", width: 1080, height: 1350 },
  { name: "Square · 1:1", key: "square", width: 1080, height: 1080 },
  { name: "Story · 9:16", key: "story", width: 1080, height: 1920 },
  { name: "Landscape · 1.91:1", key: "landscape", width: 1200, height: 630 },
] as const;

const ARTWORKS = [
  { name: "Meme", path: "/the-memes/1", kind: "memes", tokenId: "1" },
  {
    name: "Gradient",
    path: "/6529-gradient/1",
    kind: "gradient",
    tokenId: "1",
  },
  {
    name: "NextGen",
    path: "/nextgen/token/10000000315",
    kind: "nextgen",
    tokenId: "10000000315",
  },
] as const;

async function expectDialogFits(page: Page, dialog: Locator) {
  await expectNoHorizontalOverflow(page);
  const dimensions = await dialog.evaluate((element) => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
    left: element.getBoundingClientRect().left,
    right: element.getBoundingClientRect().right,
    viewportWidth: window.innerWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(
    dimensions.clientWidth + 1
  );
  expect(dimensions.left).toBeGreaterThanOrEqual(0);
  expect(dimensions.right).toBeLessThanOrEqual(dimensions.viewportWidth);
}

async function expectCanonicalShareLinks(
  dialog: Locator,
  canonicalUrl: string
) {
  const x = dialog.getByRole("link", { name: "Share on X", exact: true });
  const facebook = dialog.getByRole("link", { name: "Facebook", exact: true });
  const farcaster = dialog.getByRole("link", {
    name: "Farcaster",
    exact: true,
  });
  for (const link of [x, facebook, farcaster]) {
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  }
  const xUrl = new URL((await x.getAttribute("href"))!);
  expect(xUrl.hostname).toBe("x.com");
  expect(xUrl.searchParams.get("text")).toContain(`\n${canonicalUrl}`);
  const facebookUrl = new URL((await facebook.getAttribute("href"))!);
  expect(facebookUrl.hostname).toBe("www.facebook.com");
  expect(facebookUrl.searchParams.get("u")).toBe(canonicalUrl);
  const farcasterUrl = new URL((await farcaster.getAttribute("href"))!);
  expect(farcasterUrl.hostname).toBe("farcaster.xyz");
  expect(farcasterUrl.searchParams.get("embeds[]")).toBe(canonicalUrl);
  await dialog
    .getByRole("button", { name: "Caption and link", exact: true })
    .click();
  await expect(
    dialog.getByRole("textbox", { name: "Caption and link" })
  ).toHaveValue(
    new RegExp(`${canonicalUrl.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`)
  );
  await dialog
    .getByRole("button", { name: "Caption and link", exact: true })
    .click();
}

test.describe("Individual artwork sharing @readonly @surface", () => {
  for (const artwork of ARTWORKS) {
    test(`${artwork.name} offers accessible link sharing and social image downloads`, async ({
      page,
    }, testInfo) => {
      test.setTimeout(180000);
      // Native projects open a device share sheet; component tests cover that File handoff.
      test.skip(
        !testInfo.project.name.startsWith("web-"),
        "Browser downloads use the web flow; native sharesheets need device verification."
      );
      await gotoDocumentWithTransientRetry(
        page,
        `${artwork.path}?locale=en-US`
      );
      const trigger = page.getByTestId("artwork-share-trigger");
      await expect(trigger).toBeVisible({ timeout: 45000 });
      if (artwork.kind === "nextgen") {
        const originalImage = page
          .locator('section[aria-label$=" artwork"] img')
          .first();
        await expect
          .poll(() =>
            originalImage.evaluate(
              (image: HTMLImageElement) =>
                image.complete && image.naturalWidth > 0
            )
          )
          .toBe(true);
        await expect(originalImage).not.toHaveAttribute(
          "src",
          /pebbles-loading/
        );
      }
      await trigger.scrollIntoViewIfNeeded();
      await expect(trigger).toHaveAccessibleName("Share artwork");
      await expect(trigger).toHaveText("");
      await page.screenshot({
        path: testInfo.outputPath(`${artwork.kind}-artwork-controls.png`),
      });
      await trigger.click({ trial: true });
      await expect
        .poll(() =>
          trigger.evaluate((element) => {
            const bounds = element.getBoundingClientRect();
            return [0.5, 0.75].map((fraction) => {
              const target = document.elementFromPoint(
                bounds.left + bounds.width * fraction,
                bounds.top + bounds.height / 2
              );
              return target !== null && element.contains(target);
            });
          })
        )
        .toEqual([true, true]);
      await trigger.focus();
      await trigger.press("Enter");
      const dialog = page.getByRole("dialog", {
        name: "Share artwork",
        exact: true,
      });
      const close = dialog.getByRole("button", {
        name: "Close artwork sharing",
      });
      await expect(dialog).toBeVisible();
      await expect(close).toBeFocused();
      await expect(
        dialog.getByRole("img", { name: /^Share image for / })
      ).toBeInViewport();
      await expect(
        dialog.getByTestId("artwork-image-primary")
      ).toBeInViewport();
      await expectCanonicalShareLinks(dialog, `https://6529.io${artwork.path}`);
      await expect(
        dialog.getByRole("button", { name: "Copy link", exact: true })
      ).toBeVisible();
      await expect(
        dialog.getByRole("button", { name: "Copy caption", exact: true })
      ).toBeVisible();
      await expectDialogFits(page, dialog);

      await close.press("Shift+Tab");
      const reverseFocus = await dialog.evaluate((element) => ({
        insideDialog: element.contains(document.activeElement),
        browserChrome:
          !document.hasFocus() && document.activeElement === document.body,
      }));
      // Native dialogs may cycle through browser chrome, but never the background page.
      expect(reverseFocus.insideDialog || reverseFocus.browserChrome).toBe(
        true
      );
      await page.keyboard.press("Tab");
      await expect(close).toBeFocused();

      const formats = artwork.kind === "memes" ? FORMATS : [FORMATS[0]];
      for (const format of formats) {
        await test.step(`${format.name} exports a ${format.width}×${format.height} PNG`, async () => {
          const formatSelect = dialog.getByRole("combobox", {
            name: "Image format",
          });
          await formatSelect.selectOption(format.key);
          await expect(formatSelect).toHaveValue(format.key);
          const preview = dialog.getByRole("img", {
            name: /^Share image for /,
          });
          await expect(preview).toBeVisible({ timeout: 35000 });
          await expect
            .poll(() =>
              preview.evaluate((image: HTMLImageElement) => image.naturalWidth)
            )
            .toBe(format.width);
          expect(
            await preview.evaluate(
              (image: HTMLImageElement) => image.naturalHeight
            )
          ).toBe(format.height);
          await expectDialogFits(page, dialog);
          await dialog.screenshot({
            path: testInfo.outputPath(
              `${artwork.kind}-${format.key}-share-dialog.png`
            ),
          });

          const downloadPromise = page.waitForEvent("download");
          await dialog
            .getByRole("link", { name: "Download image", exact: true })
            .click();
          const download = await downloadPromise;
          expect(download.suggestedFilename()).toBe(
            `6529-${artwork.kind}-${artwork.tokenId}-${format.key}.png`
          );
          const downloadedPath = await download.path();
          expect(downloadedPath).not.toBeNull();
          const png = await readFile(downloadedPath!);
          expect(png.subarray(0, 8).toString("hex")).toBe("89504e470d0a1a0a");
          expect(png.readUInt32BE(16)).toBe(format.width);
          expect(png.readUInt32BE(20)).toBe(format.height);
        });
      }

      await expectAxeClean(page, {
        include: ["dialog[open]"],
        route: artwork.path,
      });
      await dialog.evaluate((element) => element.scrollTo({ top: 0 }));
      await dialog.screenshot({
        path: testInfo.outputPath(`${artwork.kind}-share-dialog.png`),
      });
      await page.keyboard.press("Escape");
      await expect(dialog).toHaveCount(0);
      await expect(trigger).toBeFocused();
    });
  }
});
