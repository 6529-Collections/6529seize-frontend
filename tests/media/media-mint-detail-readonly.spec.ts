import { getStagingVideoFixtures } from "./stagingVideoFixtures";
import { mediaResolverUrlPattern } from "../support/mediaResolverHosts";
import { defineMobileVideoBatteryTest } from "./mobileVideoBatteryCases";
import { defineCollectorsLeaderboardTests } from "./collectorsLeaderboardCases";
import { defineNftMarketActivityTests } from "./nftMarketActivityCases";
import {
  defineNftImageLayoutTests,
  expectContainedImage,
  expectMemeArtworkScrolling,
} from "./imageArtworkLayoutCases";
import type { Locator, Page } from "@playwright/test";
import path from "node:path";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import {
  gotoDocumentWithTransientRetry,
  RESPONSE_TIMEOUT_MS,
} from "../support/routeReadiness";
import { MEMES_MINT_TITLE_PATTERN } from "../support/mintTitle";

async function gotoReady(page: Page, path: string) {
  await gotoDocumentWithTransientRetry(page, path);
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
}

async function expectQuietSectionDivider(section: Locator, width: number) {
  await expect(section).toHaveCSS(
    "border-top-width",
    width >= 768 ? "1px" : "0px"
  );
  for (const side of ["left", "right", "bottom"]) {
    await expect(section).toHaveCSS(`border-${side}-width`, "0px");
  }
  if (width >= 768) {
    await expect(section).toHaveCSS("border-top-color", "rgb(38, 39, 43)");
    await expect(section).toHaveCSS("padding-top", "32px");
  }
}

async function expectFullWidthTabDivider(page: Page, name: string) {
  const navigation = page.getByRole("navigation", { name, exact: true });
  await expect(navigation).toHaveCSS("border-bottom-width", "1px");
  await expect(navigation).toHaveCSS(
    "border-bottom-color",
    "rgba(255, 255, 255, 0.1)"
  );
  const fillsContent = await navigation.evaluate((nav) => {
    const parent = nav.parentElement!;
    const style = getComputedStyle(parent);
    const contentWidth =
      parent.clientWidth -
      Number.parseFloat(style.paddingLeft) -
      Number.parseFloat(style.paddingRight);
    return Math.abs(nav.getBoundingClientRect().width - contentWidth) <= 1;
  });
  expect(fillsContent, "Primary tab divider spans the content width").toBe(
    true
  );
}

async function expectUniformMarketplaceIcons(page: Page) {
  const links = page.getByRole("link", {
    name: /^Open (OpenSea|Blur\.io|Manifold\.xyz|Rarible)$/,
  });
  await expect(links.first()).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
  for (const link of await links.all()) {
    await expect(link.getByRole("img")).toHaveCSS("width", "24px");
    await expect(link.getByRole("img")).toHaveCSS("height", "24px");
  }
}

async function expectFullCollectLabel(button: Locator) {
  const fits = await button.evaluate((element) => {
    const label = element.querySelector(":scope > span");
    if (!label) return false;
    const range = document.createRange();
    range.selectNodeContents(label);
    const text = range.getBoundingClientRect();
    const bounds = element.getBoundingClientRect();
    const styles = getComputedStyle(element);
    return (
      text.left >= bounds.left + Number.parseFloat(styles.paddingLeft) - 1 &&
      text.right <= bounds.right - Number.parseFloat(styles.paddingRight) + 1 &&
      range.getClientRects().length > 0 &&
      text.height <= bounds.height
    );
  });
  expect(fits, "Collect's complete label fits inside its button padding").toBe(
    true
  );
}

async function expectTradingPanelLayout(page: Page) {
  const panel = page.getByTestId("collect-detail-panel");
  const actions = panel.getByTestId("collect-inline-actions");
  const collect = actions.getByRole("button", { name: /^Collect [0-9]/ });
  const connect = panel.getByRole("button", {
    name: "Connect wallet",
    exact: true,
  });
  const market = page.getByRole("button", {
    name: "View listings & offers",
    exact: true,
  });
  await expect(collect).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
  await expect(collect).toBeDisabled();
  await expect(connect).toHaveCount(1);
  await expect(market).toHaveCount(1);
  const actionsBox = (await actions.boundingBox())!;
  const collectBox = (await collect.boundingBox())!;
  const offerBox = (await actions
    .getByRole("button", { name: /^Make an offer:/ })
    .boundingBox())!;
  const connectBox = (await connect.boundingBox())!;
  const marketBox = (await market.boundingBox())!;
  const supplyBox = (await page
    .getByText("Supply details & rankings", { exact: true })
    .boundingBox())!;
  if ((page.viewportSize()?.width ?? 0) >= 768) {
    expect(marketBox.y).toBeGreaterThanOrEqual(
      actionsBox.y + actionsBox.height
    );
    expect(marketBox.y + marketBox.height).toBeLessThan(supplyBox.y);
    const marketplaces = page.getByText("Marketplaces", { exact: true });
    await expect(marketplaces).toHaveCount(1);
    const marketplaceIcon = page
      .getByRole("link", { name: "Open OpenSea", exact: true })
      .getByRole("img");
    await expect(marketplaceIcon).toHaveCSS("width", "24px");
    await expect(marketplaceIcon).toHaveCSS("height", "24px");
    const links = (await page
      .getByRole("link", { name: "Open OpenSea", exact: true })
      .boundingBox())!;
    const label = (await marketplaces.boundingBox())!;
    const group = (await page
      .getByText("Marketplaces", { exact: true })
      .locator("..")
      .boundingBox())!;
    expect(label.x).toBeGreaterThan(marketBox.x + marketBox.width);
    expect(group.y + group.height / 2).toBeCloseTo(
      marketBox.y + marketBox.height / 2,
      0
    );
    expect(links.x).toBeGreaterThan(marketBox.x + marketBox.width);
    expect(group.x + group.width).toBeCloseTo(
      actionsBox.x + actionsBox.width,
      0
    );
    if (group.height <= 28) {
      expect(links.y + links.height / 2).toBeCloseTo(
        label.y + label.height / 2,
        0
      );
    } else {
      expect(links.y).toBeGreaterThanOrEqual(label.y + label.height);
    }
  } else {
    expect(marketBox.y).toBeGreaterThan(supplyBox.y + supplyBox.height);
  }
  await expect(
    panel.getByRole("button", { name: "View listings & offers", exact: true })
  ).toHaveCount(0);
  expect(connectBox.y + connectBox.height).toBeLessThan(collectBox.y);
  expect(collectBox.height).toBeCloseTo(44, 0);
  expect(offerBox.height).toBeCloseTo(44, 0);
  expect(connectBox.height).toBeCloseTo(44, 0);
  const more = panel.getByRole("button", { name: /^More trading actions for/ });
  const moreBox = (await more.boundingBox())!;
  // Collect gets its intrinsic width before the secondary label can truncate.
  expect(collectBox.x).toBeCloseTo(actionsBox.x, 0);
  expect(offerBox.width).toBeGreaterThanOrEqual(44);
  if (Math.abs(collectBox.y - offerBox.y) < 1) {
    expect(collectBox.width).toBeGreaterThanOrEqual(offerBox.width - 1);
    expect(offerBox.x - collectBox.x - collectBox.width).toBeCloseTo(8, 0);
  } else {
    // At the narrowest sizes, preserve the full price and usable secondary targets.
    expect(collectBox.width).toBeCloseTo(actionsBox.width, 0);
    expect(offerBox.x).toBeCloseTo(actionsBox.x, 0);
    expect(offerBox.y - collectBox.y - collectBox.height).toBeCloseTo(8, 0);
  }
  expect(moreBox.y).toBeCloseTo(offerBox.y, 0);
  await expectFullCollectLabel(collect);
  expect(moreBox.height).toBeCloseTo(44, 0);
  expect(moreBox.width).toBeCloseTo(44, 0);
  expect(moreBox.x - offerBox.x - offerBox.width).toBeCloseTo(8, 0);
  expect(moreBox.x + moreBox.width).toBeCloseTo(
    actionsBox.x + actionsBox.width,
    0
  );
  await expect(
    panel.getByRole("button", { name: "List", exact: true })
  ).toHaveCount(0);
  await expect(
    panel.getByRole("button", { name: /^Review offers:/ })
  ).toHaveCount(0);
  await expect(more).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(
    page
      .getByTestId("collect-detail-panel")
      .locator("[data-collect-detail-strip]")
  ).toHaveCount(0);
  if (actionsBox.width < 420) {
    expect(connectBox.width).toBeCloseTo(actionsBox.width, 0);
  } else {
    expect(connectBox.width).toBeLessThan(170);
  }
  await expect(collect).toHaveCSS("white-space", "nowrap");
  const offer = actions.getByRole("button", { name: /^Make an offer:/ });
  await expect(offer).toHaveCSS("white-space", "nowrap");
  await expect(offer).toHaveCSS("overflow", "hidden");
  await expect(offer).toHaveCSS("text-overflow", "ellipsis");
  const guidance = page
    .getByTestId("collect-detail-panel")
    .locator("[data-collect-connection-header] [role='status']");
  const guidanceBox = (await guidance.boundingBox())!;
  expect(guidanceBox.y + guidanceBox.height).toBeLessThan(collectBox.y);
  expect(guidanceBox.x).toBeCloseTo(actionsBox.x, 0);
  // Wallet guidance remains adjacent to its existing Connect action.
  if (Math.abs(connectBox.y - guidanceBox.y) > 12) {
    expect(connectBox.y).toBeGreaterThanOrEqual(
      guidanceBox.y + guidanceBox.height + 12
    );
  }
}

async function expectDetailActionHover(page: Page, button: Locator) {
  await expect(button).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  await expect(button).toHaveCSS("border-color", "rgb(55, 55, 62)");
  const supportsHover = await page.evaluate(
    () => matchMedia("(hover: hover) and (pointer: fine)").matches
  );
  if (!supportsHover) return;
  await button.hover();
  await expect(button).toHaveCSS("background-color", "rgb(28, 28, 33)");
  await expect(button).toHaveCSS("border-color", "rgb(76, 76, 85)");
  await expect(button).toHaveCSS("color", "rgb(255, 255, 255)");
  if ((await button.getAttribute("aria-haspopup")) === "menu") {
    await expect
      .poll(() =>
        button.evaluate((element) =>
          getComputedStyle(element.querySelector("svg")!).getPropertyValue(
            "color"
          )
        )
      )
      .toBe("rgb(255, 255, 255)");
  }
  await page.mouse.down();
  try {
    await expect(button).toHaveCSS("background-color", "rgb(19, 19, 22)");
  } finally {
    // Release outside; dismiss a menu that opens on the trigger press.
    await page.mouse.move(0, 0);
    await page.mouse.up();
    await page.keyboard.press("Escape");
  }
  await expect(button).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
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
  for (const card of [
    {
      name: "Memes",
      route: "/the-memes/1",
      detailsId: "meme-card-live-details",
      priceLabel: "Mint price",
      editionLabel: "Edition size",
      statistics: [
        "Edition size",
        "Ex. research",
        "Ex. museum & research",
        "Holding wallets",
        "TDH rate",
      ],
    },
    {
      name: "Meme Lab",
      route: "/meme-lab/1",
      detailsId: "meme-lab-card-live-details",
      priceLabel: "Mint Price",
      editionLabel: "Edition Size",
      statistics: ["Edition Size", "Collection"],
    },
  ]) {
    test(`groups ${card.name} mint metadata above statistics on desktop and retains phone order`, async ({
      page,
    }, info) => {
      await gotoReady(page, card.route);
      const details = page.getByTestId(card.detailsId);
      const date = details.getByText("Mint date", { exact: true });
      const price = details.getByText(card.priceLabel, { exact: true });
      const edition = details.getByText(card.editionLabel, { exact: true });
      for (const width of [390, 767, 768, 1024, 1600]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect(date).toHaveCount(1);
        await expect(price).toHaveCount(1);
        const mintSection = details
          .getByText("Mint date", { exact: true })
          .locator("xpath=ancestor::section[1]");
        await expect(
          mintSection.getByText(card.priceLabel, { exact: true })
        ).toHaveCount(width >= 768 ? 1 : 0);
        for (const label of [
          "Mint date",
          card.priceLabel,
          ...card.statistics,
        ]) {
          await expect(details.getByText(label, { exact: true })).toBeVisible();
        }
        const dateBounds = (await details
          .getByText("Mint date", { exact: true })
          .locator("..")
          .boundingBox())!;
        const priceBounds = (await details
          .getByText(card.priceLabel, { exact: true })
          .locator("..")
          .boundingBox())!;
        const editionBounds = (await edition.boundingBox())!;
        if (width >= 768) {
          expect(dateBounds.y).toBeCloseTo(priceBounds.y, 0);
          const valueOffset = await date.evaluate((element, priceLabel) => {
            const section = element.closest("section");
            const price = Array.from(
              section?.querySelectorAll("div") ?? []
            ).find((candidate) => candidate.textContent === priceLabel);
            const dateValue = element.nextElementSibling;
            const priceValue = price?.nextElementSibling;
            if (!dateValue || !priceValue)
              throw new Error("Both mint values must remain available");
            return (
              dateValue.getBoundingClientRect().top -
              priceValue.getBoundingClientRect().top
            );
          }, card.priceLabel);
          expect(valueOffset).toBeCloseTo(0, 0);
          expect(dateBounds.x + dateBounds.width).toBeLessThanOrEqual(
            priceBounds.x
          );
          expect(
            Math.max(
              dateBounds.y + dateBounds.height,
              priceBounds.y + priceBounds.height
            )
          ).toBeLessThan(editionBounds.y);
          for (const link of await details
            .getByRole("link", {
              name: /^(Distribution Plan|Main Stage Submission)$/,
            })
            .all()) {
            const bounds = (await link.boundingBox())!;
            expect(bounds.y).toBeGreaterThanOrEqual(
              priceBounds.y + priceBounds.height
            );
            expect(bounds.y + bounds.height).toBeLessThan(editionBounds.y);
          }
        } else {
          expect(dateBounds.y + dateBounds.height).toBeLessThan(
            editionBounds.y
          );
          expect(priceBounds.y).toBeGreaterThan(
            editionBounds.y + editionBounds.height
          );
        }
        await expectNoHorizontalOverflow(page);
      }
      await details.screenshot({
        path: info.outputPath("mint-details-desktop.png"),
      });
    });
  }

  test("keeps the Supply details chevron beside its label and opens content below", async ({
    page,
    isMobile,
  }, info) => {
    await gotoReady(page, "/the-memes/1");
    const viewport = page.viewportSize()!;
    await expect(
      page.getByText("Supply details & rankings", { exact: true })
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    for (const width of [767, 768]) {
      await page.setViewportSize({ width, height: 1000 });
      const spacing = await page
        .getByText("Supply details & rankings", { exact: true })
        .evaluate((element) => {
          const text = element.firstChild;
          const arrow = element.querySelector("svg");
          if (!text || !arrow)
            throw new Error("Supply disclosure needs its label and chevron");
          const range = document.createRange();
          range.selectNodeContents(text);
          const icon = arrow.getBoundingClientRect();
          return {
            textGap: icon.left - range.getBoundingClientRect().right,
            rightGap: element.getBoundingClientRect().right - icon.right,
          };
        });
      expect(width >= 768 ? spacing.textGap : spacing.rightGap).toBeCloseTo(
        width >= 768 ? 4 : 0,
        0
      );
      await expectNoHorizontalOverflow(page);
    }
    await page.setViewportSize(viewport);
    await expect(page.getByTestId("collect-inline-actions")).toBeVisible({
      timeout: RESPONSE_TIMEOUT_MS,
    });
    if (isMobile)
      await expect(
        page.getByRole("button", { name: "Open menu", exact: true })
      ).toBeVisible();
    const supply = page.getByText("Supply details & rankings", { exact: true });
    const supplyDetails = page
      .getByText("Supply details & rankings", { exact: true })
      .locator("..");
    const supplyChevron = page
      .getByText("Supply details & rankings", { exact: true })
      .locator("svg");
    await expect(supplyDetails).not.toHaveAttribute("open");
    await expect(supplyChevron).toHaveCSS("transform", "none");
    await supply.focus();
    await supply.press("Enter");
    await expect(supplyDetails).toHaveAttribute("open", "");
    await expect(supplyChevron).toHaveCSS(
      "transform",
      "matrix(-1, 0, 0, -1, 0, 0)"
    );
    const supplyContent = page
      .getByText("Supply details & rankings", { exact: true })
      .locator("..")
      .locator(":scope > div");
    await expect(supplyContent).toBeVisible();
    const summaryBounds = (await supply.boundingBox())!;
    const contentBounds = (await supplyContent.boundingBox())!;
    expect(contentBounds.y).toBeGreaterThanOrEqual(
      summaryBounds.y + summaryBounds.height
    );
    if (!isMobile) {
      await supplyDetails.evaluate((element) =>
        element.scrollIntoView({ block: "start" })
      );
      await supplyDetails.screenshot({
        path: info.outputPath("supply-details-open.png"),
      });
    }
    await supply.press("Space");
    await expect(supplyDetails).not.toHaveAttribute("open");
    await expect(supplyChevron).toHaveCSS("transform", "none");
    await expect(supply).toBeFocused();
  });

  test("preserves Meme card controls while scrolling and switching phone tabs", async ({
    page,
    isMobile,
  }, info) => {
    await gotoReady(page, "/the-memes/1");
    const actions = page.getByTestId("collect-inline-actions");
    await expect(actions).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(
      page.getByText("Loading this artwork…", { exact: true })
    ).toBeHidden({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(
      page.getByText("Loading listings", { exact: true })
    ).toBeHidden({ timeout: RESPONSE_TIMEOUT_MS });
    await expectMemeArtworkScrolling(page);
    const sticky = page.getByTestId("collect-sticky-actions");
    const offer = actions.getByRole("button", { name: /^Make an offer:/ });
    await offer.focus();
    await offer.press("Enter");
    const offerDialog = page.getByRole("dialog");
    const offerConnect = offerDialog.getByRole("button", {
      name: "Connect wallet",
      exact: true,
    });
    const offerReview = offerDialog.getByRole("button", {
      name: "Review offer",
      exact: true,
    });
    await expect(offerConnect).toBeVisible();
    await expect(sticky).toBeHidden();
    await offerConnect.scrollIntoViewIfNeeded();
    await expect(offerConnect).toBeInViewport();
    await expect(offerConnect).toHaveCount(1);
    await expect(offerReview).toBeDisabled();
    const guidanceBox = (await offerDialog
      .getByText("Connect a wallet in this profile to prepare this action.", {
        exact: true,
      })
      .boundingBox())!;
    const connectionBox = (await offerConnect.boundingBox())!;
    const priceBox = (await offerDialog
      .getByRole("textbox", { name: "Unit price (WETH)", exact: true })
      .boundingBox())!;
    expect(guidanceBox.y + guidanceBox.height).toBeLessThan(priceBox.y);
    expect(connectionBox.y + connectionBox.height).toBeLessThan(priceBox.y);
    await expect(offerConnect).toHaveAttribute("type", "button");
    await page.keyboard.press("Escape");
    await expect(offerDialog).toHaveCount(0);
    await expect(offer).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Change", exact: true })
    ).toHaveCount(0);
    await expectTradingPanelLayout(page);
    await page.getByTestId("collect-detail-panel").screenshot({
      path: info.outputPath("trading-panel.png"),
    });
    if (!isMobile) {
      await expect(sticky).toBeHidden();
      await expect(
        page.getByRole("button", { name: /^Show all .* properties$/ })
      ).toBeVisible();
      const market = page.getByRole("button", {
        name: "View listings & offers",
        exact: true,
      });
      await expect(market).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(market).toHaveCSS("color", "rgb(147, 147, 159)");
      await market.hover();
      await expect(market).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
      await expect(market).toHaveCSS("color", "rgb(239, 239, 241)");
      await page
        .getByRole("button", { name: "View listings & offers", exact: true })
        .locator("../..")
        .screenshot({ path: info.outputPath("market-link-hover.png") });
      const reviewOffers = page
        .getByTestId("collect-detail-panel")
        .getByRole("button", { name: /^More trading actions for/ });
      // The same review flow is reached through the existing keyboard-accessible menu.
      await reviewOffers.focus();
      await reviewOffers.press("Enter");
      await page.getByRole("menuitem", { name: /^Review offers:/ }).click();
      const reviewDialog = page.getByRole("dialog");
      await expect(reviewDialog.getByRole("heading")).toBeVisible();
      await expect(
        reviewDialog.getByText("Choose an order", { exact: true })
      ).toBeVisible();
      const walletSummary = page
        .getByRole("dialog")
        .locator("[data-collect-wallet-summary]");
      await expect(
        walletSummary.getByRole("button", {
          name: "Connect wallet",
          exact: true,
        })
      ).toBeVisible();
      const walletBox = (await walletSummary.boundingBox())!;
      const orderBookBox = (await page
        .getByRole("dialog")
        .locator("[data-collect-order-book]")
        .boundingBox())!;
      expect(walletBox.y + walletBox.height).toBeLessThan(orderBookBox.y);
      await expect(
        reviewDialog.getByRole("button", {
          name: "Review exact terms",
          exact: true,
        })
      ).toBeDisabled();
      await expect(sticky).toBeHidden();
      await page.keyboard.press("Escape");
      await expect(reviewDialog).toHaveCount(0);
      await expect(reviewOffers).toBeFocused();
      await market.click();
      await expect(page).toHaveURL(/focus=listings-and-offers/);
      await expectNoHorizontalOverflow(page);
      return;
    }
    await expect(actions).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await actions.scrollIntoViewIfNeeded();
    await expect(sticky).toHaveAttribute("aria-hidden", "true");
    const nav = page.getByRole("navigation", { name: "Meme page sections" });
    await nav.evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.evaluate(() => window.scrollBy(0, 240));
    await expect(sticky).toHaveAttribute("aria-hidden", "false");
    await expect(
      sticky.getByRole("button", { name: /^Make an offer:/ })
    ).toBeVisible();
    await expect
      .poll(async () => (await nav.boundingBox())?.y)
      .toBeLessThanOrEqual(1);
    const phoneViewport = page.viewportSize()!;
    // Sticky controls follow the single-column layout, including narrow tablets.
    for (const width of [
      320, 359, 360, 390, 420, 485, 639, 640, 653, 767, 768, 900, 1023,
    ]) {
      await page.setViewportSize({ width, height: phoneViewport.height });
      await expectTradingPanelLayout(page);
      await actions.scrollIntoViewIfNeeded();
      await expect(sticky).toHaveAttribute("aria-hidden", "true");
      if (width === 390 || width === 900) {
        await page.getByTestId("collect-detail-panel").screenshot({
          path: info.outputPath(
            `trading-panel-${width === 900 ? "medium" : "mobile"}.png`
          ),
        });
      }
      await nav.evaluate((element) =>
        element.scrollIntoView({ block: "start" })
      );
      await page.evaluate(() => window.scrollBy(0, 120));
      await expect(sticky).toBeVisible();
      await expect(sticky).toBeInViewport();
      await expect(nav).toHaveCSS("position", "sticky");
      await expect
        .poll(async () => (await nav.boundingBox())?.y)
        .toBeCloseTo(0, 0);
      const buttons = sticky.getByRole("button");
      const collectBounds = (await buttons.first().boundingBox())!;
      const offerBounds = (await buttons.last().boundingBox())!;
      expect(collectBounds.width).toBeGreaterThanOrEqual(offerBounds.width - 1);
      expect(offerBounds.width).toBeGreaterThanOrEqual(44);
      await expectFullCollectLabel(buttons.first());
      await expectNoHorizontalOverflow(page);
    }
    await page.setViewportSize({ width: 1024, height: phoneViewport.height });
    await expectTradingPanelLayout(page);
    await expect(sticky).toBeHidden();
    await expect(nav).toHaveCSS("position", "relative");
    await page.setViewportSize(phoneViewport);
    await nav.evaluate((element) => element.scrollIntoView({ block: "start" }));
    await page.evaluate(() => window.scrollBy(0, 240));
    const showProperties = page.getByRole("button", {
      name: /^Show all .* properties$/,
    });
    await expect(showProperties).toBeVisible();
    await showProperties.click();
    await expect(
      page.getByRole("button", { name: "Show fewer", exact: true }).last()
    ).toHaveAttribute("aria-expanded", "true");
    await nav
      .getByRole("button", { name: "Listings & offers", exact: true })
      .click();
    const marketPanel = page.getByRole("region", {
      name: "Listings & offers",
      exact: true,
    });
    await marketPanel
      .getByRole("button", { name: "Collect", exact: true })
      .first()
      .click();
    const reviewSelected = marketPanel.getByRole("button", {
      name: "Review selected listings (1)",
      exact: true,
    });
    await expect(reviewSelected).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(reviewSelected).toBeInViewport();
    await expect(sticky).toBeHidden();
    // A hidden market tab retains selection without hiding the card actions.
    await nav.getByRole("button", { name: "Overview", exact: true }).click();
    await expect(sticky).toBeVisible();
    await nav
      .getByRole("button", { name: "Listings & offers", exact: true })
      .click();
    await expect(reviewSelected).toBeInViewport();
    await expect(sticky).toBeHidden();
    await marketPanel
      .getByRole("button", { name: "Remove", exact: true })
      .click();
    await expect(reviewSelected).toHaveCount(0);
    await expect(sticky).toBeVisible();
    await nav.getByRole("button", { name: "Collectors", exact: true }).click();
    await expect(page).toHaveURL(/focus=collectors/);
    await expect(
      page
        .getByRole("list", { name: "Collectors leaderboard" })
        .getByRole("listitem")
        .first()
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(
      page
        .getByRole("group", { name: "Sort collectors by" })
        .getByRole("button", { name: "Balance", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Download.*CSV/i })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await nav.getByRole("button", { name: "History", exact: true }).click();
    await expect(page).toHaveURL(/focus=activity/);
    await expect(
      nav.getByRole("button", { name: "History", exact: true })
    ).toBeInViewport();
    await expect(
      page.getByRole("tab", { name: "Card Activity" })
    ).toBeVisible();
  });

  test("keeps Meme Collect labels complete and actions clear of the desktop rail", async ({
    page,
    context,
    baseURL,
  }, info) => {
    // Keep the consent overlay from covering the sticky action targets.
    await context.addCookies([
      { name: "essential-cookies-consent", value: "true", url: baseURL! },
      { name: "performance-cookies-consent", value: "false", url: baseURL! },
    ]);
    await gotoReady(page, "/the-memes/1");
    const panel = page.getByTestId("collect-detail-panel");
    const sticky = page.getByTestId("collect-sticky-actions");
    const collect = panel.getByRole("button", { name: /^Collect [0-9]/ });
    const stickyCollect = page
      .getByTestId("collect-sticky-actions")
      .locator('button[type="submit"]');
    for (const width of [
      320, 359, 360, 375, 390, 399, 400, 430, 479, 480, 639, 640, 767, 768,
      1023, 1024, 1052, 1088, 1100, 1200, 1280, 1440, 1680,
    ]) {
      await page.setViewportSize({ width, height: 900 });
      await expectTradingPanelLayout(page);
      await expectNoHorizontalOverflow(page);
      await expect(collect).toHaveCSS("background-color", "rgb(63, 105, 252)");
      await expect(collect).toHaveCSS("opacity", "0.5");
      await expect(stickyCollect).toBeDisabled();
      for (const property of ["background-color", "color", "opacity"]) {
        await expect(stickyCollect).toHaveCSS(
          property,
          await collect.evaluate(
            (element, name) => getComputedStyle(element).getPropertyValue(name),
            property
          )
        );
      }
      const guidance = page
        .getByTestId("collect-detail-panel")
        .locator("[data-collect-connection-header] span");
      await expect(guidance).toHaveCSS("text-wrap-style", "pretty");
      if (width < 1024) {
        await page
          .getByRole("navigation", { name: "Meme page sections" })
          .evaluate((element) => element.scrollIntoView({ block: "start" }));
        await expect(sticky).toBeVisible();
        const stickyOffer = sticky.getByRole("button", {
          name: /^Make an offer:/,
        });
        await expectFullCollectLabel(stickyCollect);
        // Measure both controls in one frame while the sticky bar slides in.
        const stickyRow = await sticky.evaluate((element) => {
          const collectBox = element
            .querySelector('button[type="submit"]')!
            .getBoundingClientRect();
          const offerBox = element
            .querySelector('button[type="button"]')!
            .getBoundingClientRect();
          return {
            yOffset: offerBox.y - collectBox.y,
            gap: offerBox.x - collectBox.right,
            offerWidth: offerBox.width,
          };
        });
        expect(stickyRow.yOffset).toBeCloseTo(0, 0);
        expect(stickyRow.gap).toBeCloseTo(8, 0);
        expect(stickyRow.offerWidth).toBeGreaterThanOrEqual(44);
        await expect(stickyOffer).toHaveCSS("overflow", "hidden");
        await expect(stickyOffer).toHaveCSS("text-overflow", "ellipsis");
        const sidebar = page.getByLabel("Primary sidebar", { exact: true });
        const railRight = (await sidebar.isVisible())
          ? (await sidebar.boundingBox())!.x +
            (await sidebar.boundingBox())!.width
          : 0;
        await expect
          .poll(async () => (await sticky.boundingBox())!.x)
          .toBeCloseTo(railRight, 0);
        expect((await sticky.boundingBox())!.width).toBeCloseTo(
          width - railRight,
          0
        );
      } else {
        await expect(sticky).toBeHidden();
      }
      if (width === 360 || width === 1024) {
        await panel.screenshot({
          path: info.outputPath(`trading-panel-${width}.png`),
        });
      }
      if (width === 390) {
        await expectDetailActionHover(
          page,
          sticky.getByRole("button", { name: /^Make an offer:/ })
        );
      }
      if (width === 1024) {
        await expectDetailActionHover(
          page,
          panel.getByRole("button", { name: /^Make an offer:/ })
        );
        await expectDetailActionHover(
          page,
          panel.getByRole("button", { name: /^More trading actions for/ })
        );
      }
    }
  });

  for (const listed of [true, false]) {
    test(`keeps one Meme trading placeholder throughout initial loading (${listed ? "listed" : "unlisted"})`, async ({
      page,
      context,
      baseURL,
    }, info) => {
      await context.addCookies([
        { name: "essential-cookies-consent", value: "true", url: baseURL! },
        { name: "performance-cookies-consent", value: "false", url: baseURL! },
      ]);
      let releaseAsset!: () => void;
      let releaseOrders!: () => void;
      let releaseCapabilities!: () => void;
      const assetGate = new Promise<void>((resolve) => {
        releaseAsset = resolve;
      });
      const ordersGate = new Promise<void>((resolve) => {
        releaseOrders = resolve;
      });
      const capabilitiesGate = new Promise<void>((resolve) => {
        releaseCapabilities = resolve;
      });
      let ordersRequested = false;
      let capabilitiesRequested = false;
      await page.route("**/api/collect/assets**", async (route) => {
        await assetGate;
        await route.continue();
      });
      await page.route("**/api/market/orders**", async (route) => {
        ordersRequested = true;
        await ordersGate;
        if (
          !listed &&
          new URL(route.request().url()).pathname === "/api/market/orders"
        ) {
          await route.fulfill({ json: { orders: [], next: null } });
        } else {
          await route.continue();
        }
      });
      await page.route("**/api/collect/capabilities", async (route) => {
        capabilitiesRequested = true;
        await capabilitiesGate;
        await route.continue();
      });
      try {
        await gotoReady(page, "/the-memes/1");
        const panel = page.getByTestId("collect-detail-panel");
        const loading = page
          .getByTestId("collect-detail-panel")
          .locator("[data-collect-detail-loading]");
        await expect(loading).toBeVisible();
        await page.evaluate(() => document.fonts.ready);
        const viewport = page.viewportSize()!;
        const widths = [320, 360, 375, 390, 430, 768, 1023, 1024, 1440];
        for (const width of widths) {
          await page.setViewportSize({ width, height: viewport.height });
          const rows = page
            .getByTestId("collect-detail-panel")
            .locator('[data-collect-detail-loading] > [aria-hidden="true"]');
          await expect(rows).toHaveCount(2);
          const actionsBox = (await rows.nth(0).boundingBox())!;
          const detailBox = (await rows.nth(1).boundingBox())!;
          const panelBox = (await panel.boundingBox())!;
          expect(actionsBox.height).toBe(44);
          expect(detailBox.height).toBe(16);
          expect(detailBox.y - actionsBox.y - actionsBox.height).toBeCloseTo(
            16,
            0
          );
          // Reserve the compact action + delivery layout, without temporary rows or padding.
          expect(panelBox.height).toBeCloseTo(76, 0);
          await expect(panel).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
          await expect(panel).toHaveCSS("border-width", "0px");
          if (width === 360 || width === 1024) {
            await panel.screenshot({
              path: info.outputPath(`trading-loading-${width}.png`),
            });
          }
        }
        await page.setViewportSize(viewport);
        const initialBox = (await panel.boundingBox())!;
        const expectStableLoading = async () => {
          await expect(loading).toHaveCount(1);
          await expect(loading).toBeVisible();
          await expect(
            loading.getByText("Loading this artwork…", { exact: true })
          ).toBeAttached();
          await expect(
            page.getByRole("button", {
              name: "View listings & offers",
              exact: true,
            })
          ).toHaveCount(1);
          await expect(
            panel.getByRole("button", { name: /^Make an offer:/ })
          ).toHaveCount(0);
          await expect(
            panel.getByRole("button", { name: /^Review offers:/ })
          ).toHaveCount(0);
          await expect(
            panel.getByRole("button", { name: "Connect wallet", exact: true })
          ).toHaveCount(0);
          await expect(page.getByTestId("collect-sticky-actions")).toHaveCount(
            0
          );
          expect((await panel.boundingBox())!.height).toBeCloseTo(
            initialBox.height,
            0
          );
        };
        await expectStableLoading();
        await panel.screenshot({
          path: info.outputPath("trading-loading.png"),
        });
        releaseAsset();
        await expect
          .poll(() => ordersRequested && capabilitiesRequested)
          .toBe(true);
        await expectStableLoading();
        const ordersResponse = page.waitForResponse(
          (response) =>
            new URL(response.url()).pathname === "/api/market/orders" &&
            response.ok()
        );
        releaseOrders();
        await ordersResponse;
        await expectStableLoading();
        releaseCapabilities();
        await expect(loading).toHaveCount(0);
        if (listed) {
          await expectTradingPanelLayout(page);
        } else {
          await expect(
            panel.getByText("This artwork is not currently listed.", {
              exact: true,
            })
          ).toBeVisible();
          await expect(
            panel.getByRole("button", { name: /^Collect/ })
          ).toHaveCount(0);
        }
        for (const width of widths) {
          await page.setViewportSize({ width, height: viewport.height });
          // Loading keeps its reserve, but resolved controls must not retain a
          // blank footer (especially for the shorter connected-wallet states).
          await expect
            .poll(async () => {
              const panelBox = (await panel.boundingBox())!;
              const actionsBox = (await panel
                .getByTestId("collect-inline-actions")
                .boundingBox())!;
              return (
                panelBox.y + panelBox.height - actionsBox.y - actionsBox.height
              );
            })
            .toBeCloseTo(0, 0);
          await expectNoHorizontalOverflow(page);
          if (width === 360 || width === 1024) {
            await panel.screenshot({
              path: info.outputPath(`trading-loaded-${width}.png`),
            });
          }
        }
      } finally {
        releaseAsset();
        releaseOrders();
        releaseCapabilities();
      }
    });
  }

  test("fills the Meme action row when no eligible listing is available", async ({
    page,
  }) => {
    await page.route("**/api/market/orders**", async (route) => {
      if (new URL(route.request().url()).pathname !== "/api/market/orders") {
        return route.continue();
      }
      return route.fulfill({ json: { orders: [], next: null } });
    });
    await gotoReady(page, "/the-memes/1");
    const panel = page.getByTestId("collect-detail-panel");
    await expect(
      panel.getByText("This artwork is not currently listed.", { exact: true })
    ).toBeVisible();
    const row = panel.getByTestId("collect-inline-actions");
    const offer = row.getByRole("button", { name: /^Make an offer:/ });
    await expect(row.getByRole("button", { name: /^Collect/ })).toHaveCount(0);
    await expect(
      panel.getByRole("button", { name: "Connect wallet", exact: true })
    ).toBeEnabled();
    await expect(
      panel.getByRole("button", { name: "List", exact: true })
    ).toBeVisible();
    await expect(
      panel.getByRole("button", { name: /^More trading actions for/ })
    ).toBeVisible();
    for (const width of [
      320, 359, 360, 375, 390, 399, 400, 430, 479, 480, 639, 640, 767, 768,
      1023, 1024, 1052, 1088, 1100, 1200, 1280, 1440, 1680,
    ]) {
      await page.setViewportSize({ width, height: 900 });
      const bounds = (await page
        .getByTestId("collect-detail-panel")
        .locator("[data-collect-action-group]")
        .boundingBox())!;
      const offerBounds = (await offer.boundingBox())!;
      expect(offerBounds.x).toBeCloseTo(bounds.x, 0);
      expect(offerBounds.height).toBeCloseTo(44, 0);
      const listBounds = (await row
        .getByRole("button", { name: "List", exact: true })
        .boundingBox())!;
      const moreBounds = (await row
        .getByRole("button", { name: /^More trading actions for/ })
        .boundingBox())!;
      expect(listBounds.y).toBeCloseTo(moreBounds.y, 0);
      expect(moreBounds.x - listBounds.x - listBounds.width).toBeCloseTo(8, 0);
      expect(listBounds.y).toBeCloseTo(offerBounds.y, 0);
      const listContentWidth = await row
        .getByRole("button", { name: "List", exact: true })
        .evaluate((button) => {
          const range = document.createRange();
          range.selectNodeContents(button);
          const styles = getComputedStyle(button);
          return (
            range.getBoundingClientRect().width +
            Number.parseFloat(styles.paddingLeft) +
            Number.parseFloat(styles.paddingRight) +
            Number.parseFloat(styles.borderLeftWidth) +
            Number.parseFloat(styles.borderRightWidth)
          );
        });
      expect(listBounds.width).toBeCloseTo(listContentWidth, 0);
      expect(offerBounds.width).toBeCloseTo(
        bounds.width - listBounds.width - moreBounds.width - 16,
        0
      );
      expect(listBounds.x - offerBounds.x - offerBounds.width).toBeCloseTo(
        8,
        0
      );
      expect(moreBounds.width).toBeCloseTo(44, 0);
      await expectNoHorizontalOverflow(page);
    }
    await offer.click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("textbox", { name: "Unit price (WETH)", exact: true })
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Review offer", exact: true })
    ).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(offer).toBeFocused();
    const more = panel.getByRole("button", {
      name: /^More trading actions for/,
    });
    await more.click();
    await page.getByRole("menuitem", { name: /^Review offers:/ }).click();
    await expect(
      dialog.getByText("No executable orders were returned for this artwork.", {
        exact: true,
      })
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Review exact terms", exact: true })
    ).toBeDisabled();
    await page.keyboard.press("Escape");
    await expect(more).toBeFocused();
  });

  defineCollectorsLeaderboardTests();
  defineNftMarketActivityTests();
  for (const { name, route, collapseOnMobile } of [
    { name: "Meme", route: "/the-memes/1", collapseOnMobile: true },
    { name: "Meme Lab", route: "/meme-lab/1", collapseOnMobile: false },
  ]) {
    test(`expands and collapses ${name} properties at the supported breakpoints`, async ({
      page,
      isMobile,
    }, info) => {
      await gotoReady(page, route);
      if (collapseOnMobile || !isMobile) {
        await expect(page.getByTestId("collect-inline-actions")).toBeVisible({
          timeout: RESPONSE_TIMEOUT_MS,
        });
      }
      await expect(
        page.getByText("Loading this artwork…", { exact: true })
      ).toBeHidden({ timeout: RESPONSE_TIMEOUT_MS });
      await expect(
        page.getByText("Loading listings", { exact: true })
      ).toBeHidden({ timeout: RESPONSE_TIMEOUT_MS });
      if (isMobile) {
        await expect(
          page.getByRole("button", { name: "Open menu", exact: true })
        ).toBeVisible();
      }
      const section = page
        .getByRole("heading", { name: "Properties", exact: true })
        .locator("../..");
      const toggle = section.getByRole("button", {
        name: /^Show all .* properties$/,
      });
      await expect(section).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
      const tiles = page
        .getByRole("heading", { name: "Properties", exact: true })
        .locator("../..")
        .locator(":scope > div[id] > div");
      const total = await tiles.count();
      expect(total).toBeGreaterThan(6);
      for (const width of [390, 639, 640, 767, 768, 1600]) {
        await page.setViewportSize({ width, height: 1000 });
        if (width < 768 && (!collapseOnMobile || width >= 640)) {
          await expect(toggle).toBeHidden();
          await expect(tiles.filter({ visible: true })).toHaveCount(total);
        } else {
          await expect(toggle).toBeVisible();
          await expect(toggle).toHaveAttribute("aria-expanded", "false");
          await expect(tiles.filter({ visible: true })).toHaveCount(6);
          if (width >= 768) {
            await expect(toggle).toHaveCSS("border-top-width", "0px");
            await expect(toggle).toHaveCSS(
              "background-color",
              "rgba(0, 0, 0, 0)"
            );
            await expect(toggle).toHaveCSS("font-weight", "500");
            const buttonBounds = (await toggle.boundingBox())!;
            const sectionBounds = (await section.boundingBox())!;
            expect(buttonBounds.width).toBeLessThan(sectionBounds.width / 2);
            const rows = await tiles
              .filter({ visible: true })
              .evaluateAll((items) => [
                ...new Set(
                  items.map((item) => item.getBoundingClientRect().top)
                ),
              ]);
            expect(rows).toHaveLength(2);
          }
          await toggle.scrollIntoViewIfNeeded();
          await toggle.focus();
          await expect(toggle).toBeFocused();
          await toggle.press("Enter");
          const fewer = section.getByRole("button", {
            name: "Show fewer",
            exact: true,
          });
          await expect(fewer).toHaveAttribute("aria-expanded", "true");
          await expect(tiles.filter({ visible: true })).toHaveCount(total);
          await fewer.press("Space");
          await expect(toggle).toHaveAttribute("aria-expanded", "false");
          await expect(toggle).toBeFocused();
          await expect(tiles.filter({ visible: true })).toHaveCount(6);
        }
        await expectNoHorizontalOverflow(page);
        if (width === 390 || width === 1600) {
          await section.screenshot({
            path: info.outputPath(`properties-${width}.png`),
          });
        }
      }
    });
  }

  test("unifies desktop card typography across Memes and Meme Lab", async ({
    page,
  }, info) => {
    await gotoReady(page, "/the-memes/1");
    const properties = page.getByRole("heading", {
      name: "Properties",
      exact: true,
    });
    const editionSize = page
      .getByText("Edition size", { exact: true })
      .locator("..")
      .getByRole("definition");
    const season = page.getByRole("link", { name: "View SZN 1 cards" });
    for (const width of [390, 767, 768, 1600]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(properties).toHaveCSS(
        "font-size",
        width >= 768 ? "16px" : "12px"
      );
      await expect(properties).toHaveCSS(
        "text-transform",
        width >= 768 ? "none" : "uppercase"
      );
      await expect(editionSize).toHaveCSS("font-size", "14px");
      for (const name of ["Arweave links", "Properties", "TDH breakdown"]) {
        await expect(
          page
            .getByRole("heading", { name, exact: true })
            .locator("xpath=ancestor::section[1]")
        ).toHaveCSS("border-top-width", "0px");
      }
      await expectQuietSectionDivider(
        page
          .getByRole("heading", { name: "Stats", exact: true })
          .locator("xpath=ancestor::section[1]/.."),
        width
      );
      await expectUniformMarketplaceIcons(page);
      await expect(season).toHaveCSS(
        "border-top-width",
        width >= 768 ? "0px" : "1px"
      );
      if (width >= 768) {
        await expectFullWidthTabDivider(page, "Meme page sections");
        await expect(season).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
        await expect(season).toHaveCSS("padding-left", "0px");
      }
      await expectNoHorizontalOverflow(page);
    }
    await page
      .getByRole("heading", { level: 1 })
      .locator("xpath=ancestor::header")
      .screenshot({ path: info.outputPath("memes-calendar-desktop.png") });
    await gotoReady(page, "/meme-lab/1");
    const labProperties = page.getByRole("heading", {
      name: "Properties",
      exact: true,
    });
    const labValue = page
      .getByText("Edition Size", { exact: true })
      .locator("../..")
      .locator(":scope > div:last-child > span:first-child");
    const nextCard = page.getByRole("link", { name: "Next NFT", exact: true });
    for (const width of [390, 767, 768, 1600]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(labProperties).toHaveCSS(
        "font-size",
        width >= 768 ? "16px" : "12px"
      );
      await expect(labProperties).toHaveCSS(
        "text-transform",
        width >= 768 ? "none" : "uppercase"
      );
      await expect(labValue).toHaveCSS("font-size", "14px");
      await expectQuietSectionDivider(
        page
          .getByRole("heading", { name: "Properties", exact: true })
          .locator("xpath=ancestor::section[1]"),
        width
      );
      await expectUniformMarketplaceIcons(page);
      await expect(nextCard).toHaveCSS(
        "border-top-left-radius",
        width >= 768 ? "8px" : "9999px"
      );
      await expect(nextCard).toHaveAttribute("href", "/meme-lab/2");
      if (width >= 768) {
        await expectFullWidthTabDivider(page, "Meme Lab page sections");
      }
      await expectNoHorizontalOverflow(page);
    }
    await page.screenshot({ path: info.outputPath("meme-lab-desktop.png") });
    await page
      .getByRole("heading", { name: "Properties", exact: true })
      .locator("../..")
      .screenshot({ path: info.outputPath("meme-lab-properties-desktop.png") });
  });

  test("aligns Gradient desktop typography and navigation with card controls", async ({
    page,
  }, info) => {
    await gotoReady(page, "/6529-gradient/1");
    const value = page
      .getByText("Unweighted TDH", { exact: true })
      .locator("..")
      .locator(":scope > div:last-child");
    const previous = page.getByRole("link", {
      name: "Previous NFT",
      exact: true,
    });
    await expect(value).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    const gradientStats = page
      .getByText("Unweighted TDH", { exact: true })
      .locator("xpath=ancestor::section[1]");
    for (const width of [390, 767, 768, 1600]) {
      await page.setViewportSize({ width, height: 1000 });
      await expect(gradientStats).toHaveCSS("border-bottom-width", "1px");
      await expect(value).toHaveCSS("font-size", "14px");
      await expect(value).toHaveCSS("font-weight", "600");
      await expect(previous).toHaveCSS(
        "border-top-left-radius",
        width >= 768 ? "8px" : "9999px"
      );
      await expect(previous).toHaveAttribute("href", "/6529-gradient/0");
      await expectUniformMarketplaceIcons(page);
      const market = page.getByRole("button", {
        name: "View listings & offers",
        exact: true,
      });
      await expect(market).toHaveCSS(
        "font-size",
        width >= 768 ? "14px" : "13px"
      );
      if (width >= 768) {
        await expectFullWidthTabDivider(page, "Overview");
        await expect(page.getByTestId("collect-inline-actions")).toBeVisible({
          timeout: RESPONSE_TIMEOUT_MS,
        });
        await expect(
          page.getByRole("button", { name: "Connect wallet", exact: true })
        ).toHaveCSS("background-color", "rgb(236, 236, 238)");
      } else {
        await expect(page.getByTestId("collect-inline-actions")).toHaveCount(0);
      }
      await expect(page.getByTestId("collect-sticky-actions")).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    }
    await previous.focus();
    await expect(previous).toBeFocused();
    await expect(previous).toHaveCSS("outline-style", "solid");
    await expect(previous).toHaveCSS("outline-width", "2px");
    await page.screenshot({ path: info.outputPath("gradient-desktop.png") });
  });

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

  test("recovers a historical Timeline image using the same Arweave transaction", async ({
    page,
  }) => {
    const tx = "IFosq_ZN9_PrDSQmq65JTjeB2GnnfPSFoHxRazxC4PY";
    const primary = `https://arweave.net/${tx}/timeline-history.png`;
    // The deployed build's media resolver: media.6529.io in production, the
    // separate content domain on staging. The path stays exact.
    const fallback = mediaResolverUrlPattern(
      `/arweave/${tx}/timeline-history.png`
    );
    const requests: string[] = [];
    await page.route("**/api/nft_history/**", async (route) => {
      await route.fulfill({
        json: {
          data: [
            {
              nft_id: 1,
              contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
              uri: `https://arweave.net/${tx}`,
              transaction_date: "2024-01-01T00:00:00Z",
              created_at: "2024-01-01T00:00:00Z",
              transaction_hash: `0x${"1".repeat(64)}`,
              block: 1,
              description: {
                event: "Edit",
                changes: [{ key: "image", from: primary, to: "" }],
              },
            },
          ],
          next: null,
        },
      });
    });
    await page.route(primary, async (route) => {
      requests.push(route.request().url());
      await route.fulfill({ status: 503, body: "Unavailable" });
    });
    await page.route(fallback, async (route) => {
      requests.push(route.request().url());
      await route.fulfill({
        contentType: "image/png",
        body: Buffer.from(
          "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+ip1sAAAAASUVORK5CYII=",
          "base64"
        ),
      });
    });
    await gotoReady(page, "/the-memes/1?focus=timeline");
    const timeline = page.getByRole("region", {
      name: "The Memes card timeline",
    });
    const preview = timeline.getByRole("img");
    await expect(preview).toHaveAttribute("src", fallback);
    await expect
      .poll(() =>
        preview.evaluate((image: HTMLImageElement) => image.naturalWidth)
      )
      .toBeGreaterThan(0);
    expect(requests).toHaveLength(2);
    expect(requests[0]).toBe(primary);
    expect(requests[1]).toMatch(fallback);
    await expect(
      timeline.getByRole("link", { name: "Open metadata URI" })
    ).toHaveAttribute("href", `https://arweave.net/${tx}`);
    const date = timeline.getByRole("heading", { level: 5 });
    const desktop = (page.viewportSize()?.width ?? 1280) >= 768;
    await expect(
      timeline.getByRole("heading", { level: 5 }).locator("..")
    ).toHaveCSS(
      "background-color",
      desktop ? "rgba(0, 0, 0, 0)" : "rgb(255, 255, 255)"
    );
    if (desktop) {
      await expect(date).toHaveCSS("font-size", "12px");
      await expect(date).toHaveCSS("font-weight", "400");
      await expect(timeline.getByText("Edit", { exact: true })).toHaveCSS(
        "font-weight",
        "600"
      );
    }
    await expectNoHorizontalOverflow(page);
    await gotoReady(page, "/meme-lab/1?focus=timeline");
    await expect(
      page.getByRole("heading", { level: 5 }).locator("..")
    ).toHaveCSS(
      "background-color",
      desktop ? "rgba(0, 0, 0, 0)" : "rgb(255, 255, 255)"
    );
  });

  for (const recordedFormat of [true, false]) {
    test(`keeps a removed Timeline video paused until Play with ${recordedFormat ? "recorded" : "missing"} historical format`, async ({
      page,
    }) => {
      const primary =
        "https://arweave.net/RNN6a_VraO1wM7Cmmv95okPU0Zqsnt3sc_CEBMNqNBw";
      const changes = [{ key: "animation", from: primary, to: "" }];
      if (recordedFormat)
        changes.push({ key: "animation_details::format", from: "MP4", to: "" });
      await page.route("**/api/nft_history/**", async (route) => {
        await route.fulfill({
          json: {
            data: [
              {
                nft_id: 1,
                contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
                uri: "https://example.com/historical-metadata",
                transaction_date: "2024-01-01T00:00:00Z",
                created_at: "2024-01-01T00:00:00Z",
                transaction_hash: `0x${"1".repeat(64)}`,
                block: 1,
                description: { event: "Edit", changes },
              },
            ],
            next: null,
          },
        });
      });
      await page.route(primary, async (route) => {
        await route.fulfill({
          contentType: "video/mp4",
          headers: { "access-control-allow-origin": "*" },
          path: path.resolve("tests/media/fixtures/portrait.mp4"),
        });
      });
      await gotoReady(page, "/the-memes/1?focus=timeline");
      const timeline = page.getByRole("region", {
        name: "The Memes card timeline",
      });
      const video = timeline.getByLabel("Removed Animation preview video");
      // Mobile attaches a never-opened video source only once it is in view.
      await video.scrollIntoViewIfNeeded();
      await expect(video).toHaveAttribute("src", primary);
      await expect(video).toHaveAttribute(
        "aria-label",
        "Removed Animation preview video"
      );
      await expect(timeline.getByRole("img")).toHaveCount(0);
      await expect
        .poll(() =>
          video.evaluate((element: HTMLVideoElement) => element.videoWidth)
        )
        .toBeGreaterThan(0);
      await expect(video).toHaveJSProperty("autoplay", false);
      await expect(video).toHaveJSProperty("paused", true);
      await timeline
        .getByRole("button", { name: "Play video", exact: true })
        .first()
        .click();
      await expect(video).toHaveJSProperty("paused", false);
      await expectNoHorizontalOverflow(page);
    });
  }

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
    await expect(page.getByRole("tab", { name: "Card Activity" })).toHaveCSS(
      "font-size",
      "12px"
    );
    await expect(page.getByRole("tab", { name: "Card Activity" })).toHaveCSS(
      "border-radius",
      "9999px"
    );
    await expect(page.getByRole("tab", { name: "Card Activity" })).toHaveCSS(
      "height",
      "32px"
    );
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

  test("renders The Memes mint page read-only", async ({ page }, testInfo) => {
    await gotoReady(page, "/the-memes/mint");

    await expect(page).toHaveTitle(MEMES_MINT_TITLE_PATTERN);
    await expect(page.getByText("Retrieving Mint information")).toBeHidden({
      timeout: 15000,
    });
    await expect(
      page.locator("main a[href^='/the-memes/']").first()
    ).toBeVisible({ timeout: 15000 });
    const media = page.locator("main [data-nft-media-renderer]").first();
    const readMediaState = () =>
      media.evaluateAll((elements) => {
        const element = elements[0];
        if (!element) return { loaded: false, reason: "Missing mint artwork" };
        const image = element instanceof HTMLImageElement ? element : null;
        const bounds = element.getBoundingClientRect();
        return {
          loaded:
            !image ||
            (image.complete &&
              image.naturalWidth > 0 &&
              image.naturalHeight > 0),
          tag: element.tagName,
          src: image?.currentSrc ?? element.getAttribute("src"),
          complete: image?.complete,
          naturalWidth: image?.naturalWidth,
          naturalHeight: image?.naturalHeight,
          width: bounds.width,
          height: bounds.height,
        };
      });
    try {
      // Mint data can be ready before the original gateway image has decoded.
      await expect
        .poll(readMediaState, {
          timeout: 20000,
          message: "Mint artwork image must finish loading successfully",
        })
        .toMatchObject({ loaded: true });
      await expect(media).toBeVisible();
    } finally {
      const mediaState = await readMediaState().catch((error: unknown) => ({
        error: String(error),
      }));
      await testInfo.attach("mint-artwork-state", {
        body: Buffer.from(JSON.stringify(mediaState, null, 2)),
        contentType: "application/json",
      });
    }
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

    // The route shell and server title precede the client card data. Wait for
    // the named card before asserting its final activity title.
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "Meme Lab Card 1 - Spread the Memes",
      })
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(page).toHaveTitle(
      "Spread the Memes | Meme Lab #1 | Card Activity"
    );
    await expect(
      page.getByRole("link", { name: "Back to Meme Lab" })
    ).toHaveAttribute("href", "/meme-lab?locale=de-DE");
    await expectNavigation(page, "Meme Lab page sections");
    await expectNavigation(page, "Meme Lab history sections");
    await expect(page.getByRole("tab", { name: "Card Activity" })).toHaveCSS(
      "font-size",
      "14px"
    );
    await expect(page.getByRole("tab", { name: "Card Activity" })).toHaveCSS(
      "height",
      "32px"
    );
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
      ({ baseURL }) =>
        !isProductionBaseURL(baseURL) &&
        !(
          isLocalBaseURL(baseURL) &&
          process.env["PLAYWRIGHT_ENV"] === "production"
        ),
      "this ReMeme fixture requires production data; local production-API previews opt in with PLAYWRIGHT_ENV=production"
    );

    test("renders ReMemes detail tabs without mutation", async ({
      page,
    }, info) => {
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

      const external = page.getByRole("link", {
        name: "View Genart Memes on Etherscan",
      });
      const metadataTab = page.getByRole("button", { name: "Metadata" });
      for (const width of [390, 767, 768, 1600]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect(external).toHaveCSS("font-size", "14px");
        await expectUniformMarketplaceIcons(page);
        await expect(metadataTab).toHaveCSS(
          "font-weight",
          width >= 768 ? "500" : "600"
        );
        if (width >= 768) {
          await expectFullWidthTabDivider(page, "ReMemes page sections");
        }
        await expectNoHorizontalOverflow(page);
      }
      await page.screenshot({ path: info.outputPath("rememes-desktop.png") });

      await page.getByRole("button", { name: "Metadata" }).click();
      await expect(
        page.getByRole("button", { name: "Metadata" })
      ).toHaveAttribute("aria-pressed", "true");
      await expect(
        page.getByRole("heading", { name: "Metadata", exact: true })
      ).toHaveCSS("font-size", "16px");
      for (const width of [390, 767, 768, 1600]) {
        await page.setViewportSize({ width, height: 1000 });
        await expect(
          page
            .getByRole("heading", { name: "Metadata", exact: true })
            .locator("xpath=ancestor::section[1]")
        ).toHaveCSS("border-top-width", "0px");
        await expectNoHorizontalOverflow(page);
      }
      await page.getByRole("button", { name: "References" }).click();
      await expect(
        page.getByRole("button", { name: "References" })
      ).toHaveAttribute("aria-pressed", "true");
    });
  });
});

test.describe("Staging image artwork sizing @surface @medium @large @readonly", () => {
  // Meme 551 is qualified as a still-image fixture only on staging; other
  // environments have independent collections and keep their existing fixtures.
  test.skip(
    ({ baseURL }) =>
      !baseURL || new URL(baseURL).hostname !== "staging.6529.io",
    "Meme 551 image fixture runs on staging"
  );
  defineNftImageLayoutTests();
});

test.describe("Staging video artwork sizing @surface @medium @large @readonly", () => {
  // This fixture is unavailable outside staging; skip only those environments.
  test.skip(({ baseURL }) => {
    if (!baseURL) return true;
    try {
      return new URL(baseURL).hostname !== "staging.6529.io";
    } catch {
      return true;
    }
  }, "video fixture qualification runs on staging only");

  defineMobileVideoBatteryTest(
    "mobile browser artwork stops offscreen buffering and restores position after tab hiding",
    (project) => project === "web-mobile-chromium"
  );

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
    for (const shape of ["portrait", "square"] as const) {
      test(`contains and centers ${shape} video at ${viewport.width}x${viewport.height}`, async ({
        page,
      }, testInfo) => {
        await page.setViewportSize(viewport);
        const fixture = (await getStagingVideoFixtures(page))[shape];
        await testInfo.attach("qualified-video-fixture", {
          body: Buffer.from(JSON.stringify({ shape, ...fixture })),
          contentType: "application/json",
        });
        await gotoReady(page, `/the-memes/${fixture.id}`);
        const video = page.getByLabel("Video player", { exact: true });
        await expect(video).toBeVisible();
        // Offscreen artwork defers its source. Bring it into view before
        // waiting for metadata; CSS visibility alone does not guarantee this.
        await video.scrollIntoViewIfNeeded();
        await expect(video).toBeInViewport();
        await expect
          .poll(() =>
            video.evaluate((element: HTMLVideoElement) => element.videoWidth)
          )
          .toBeGreaterThan(0);
        const dimensions = await video.evaluate(
          (element: HTMLVideoElement) => ({
            width: element.videoWidth,
            height: element.videoHeight,
          })
        );
        expect(dimensions.width / dimensions.height).toBeCloseTo(
          fixture.width / fixture.height,
          2
        );
        // Native metadata can load before React hydrates the artwork controls.
        await expect(
          page.getByRole("slider", { name: "Seek video" })
        ).toBeEnabled({ timeout: 20000 });
        await video.evaluate((element: HTMLVideoElement) => element.pause());
        await expect(
          page.getByRole("button", { name: "Play video", exact: true }).first()
        ).toBeVisible();
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

        // Poster slides use the image budget independently of the animation.
        await page
          .getByRole("button", { name: "Show next artwork media" })
          .click();
        const poster = page
          .getByRole("img")
          .locator("xpath=self::*[@id='the-art-fullscreen-img']");
        await expectContainedImage(poster);
        await expect(video).toBeHidden();
        await page
          .getByRole("button", { name: "Show previous artwork media" })
          .click();
        await expect(video).toBeVisible();
        await expect(poster).toBeHidden();
        await expect(
          page.getByRole("slider", { name: "Seek video" })
        ).toBeVisible();
      });
    }
  }
});
