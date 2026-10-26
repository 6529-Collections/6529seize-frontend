import { expect, test } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import path from "node:path";
import { expectNoHorizontalOverflow } from "../testHelpers";

const LAB = "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb";
const ZERO = "0x0000000000000000000000000000000000000000";
const asset = {
  asset_key: `1:${LAB}:70`,
  chain_id: 1,
  contract: LAB,
  token_id: "70",
  family: "memelab",
  name: "Meme Lab artwork",
  image_url: "https://collect-fixtures.test/art.jpeg",
  artist_ids: [],
  season: null,
  traits: [],
  hodl_rate: 0,
  tdh_eligible: false,
};
const SEAPORT = "0x0000000000000068f116a894984e2db1123eb395";
const WETH = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
const listing = {
  identity: { protocol_address: SEAPORT, order_hash: "0x" + "a".repeat(64) },
  asset_key: asset.asset_key,
  maker: "0x1111111111111111111111111111111111111111",
  recipient: ZERO,
  side: "LISTING",
  quantity: "3",
  available_quantity: "3",
  purchase_quantity: "1",
  quantity_step: "1",
  currency: ZERO,
  total_wei: "120000000000000000",
  net_wei: "120000000000000000",
  fees: [],
  start_time: "1",
  end_time: "2000000000",
};
const captured = (bid: boolean, index = 0) => ({
  order_key: bid ? `lab-offer-${index}` : "lab-listing",
  order_id:
    "0x" + (bid ? (index + 11).toString(16).padStart(64, "0") : "a".repeat(64)),
  source: "opensea",
  protocol: SEAPORT,
  collection_slug: "memelab6529",
  side: bid ? "bid" : "ask",
  scope: "token",
  maker: listing.maker,
  token_id: "70",
  original_quantity: "3",
  remaining_quantity: "3",
  currency: {
    address: bid ? WETH : ZERO,
    symbol: bid ? "WETH" : "ETH",
    decimals: 18,
  },
  total_price_raw: bid
    ? String(BigInt(20 - index) * 3_000_000_000_000_000n)
    : listing.total_wei,
  unit_price: bid ? `0.${String(20 - index).padStart(3, "0")}` : "0.04",
  starts_at: new Date(1000).toISOString(),
  expires_at: new Date(2000000000000).toISOString(),
  observed_at: new Date().toISOString(),
  applicability: "token",
  liquidity_group: bid ? "offer" : "listing",
  caveats: [],
});

const nft = {
  id: 70,
  contract: LAB,
  name: asset.name,
  artist: "Lab artist",
  artist_seize_handle: "",
  description: "An edition from Meme Lab.",
  image: asset.image_url,
  animation: "",
  icon: asset.image_url,
  thumbnail: asset.image_url,
  scaled: asset.image_url,
  mint_date: "2024-01-01T00:00:00Z",
  created_at: "2024-01-01T00:00:00Z",
  token_type: "ERC1155",
  supply: 100,
  mint_price: 0,
  collection: "Meme Lab",
  meme_references: [],
  uri: "",
  has_distribution: false,
  market_cap: 0,
  floor_price: 0,
  highest_offer: 0,
  total_volume_last_24_hours: 0,
  total_volume_last_7_days: 0,
  total_volume_last_1_month: 0,
  total_volume: 0,
  metadata: { attributes: [], image_details: { format: "JPEG" } },
};
const meta = {
  id: 70,
  metadata_collection: "Meme Lab",
  name: asset.name,
  website: "",
  meme_references: [],
  edition_size: 100,
  edition_size_rank: 1,
  collection_size: 100,
  museum_holdings: 0,
  museum_holdings_rank: 1,
  edition_size_cleaned: 100,
  edition_size_cleaned_rank: 1,
  hodlers: 40,
  hodlers_rank: 1,
  percent_unique: 0.4,
  percent_unique_rank: 1,
  percent_unique_cleaned: 0.4,
  percent_unique_cleaned_rank: 1,
  burnt: 0,
  edition_size_not_burnt: 100,
  edition_size_not_burnt_rank: 1,
  percent_unique_not_burnt: 0.4,
  percent_unique_not_burnt_rank: 1,
};

test("Meme Lab shares card trading actions and market navigation before wallet connection", async ({
  page,
  context,
  baseURL,
  isMobile,
}, info) => {
  expect(new URL(baseURL ?? "").hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
  await context.addCookies([
    { name: "essential-cookies-consent", value: "true", url: baseURL! },
    { name: "performance-cookies-consent", value: "false", url: baseURL! },
  ]);
  let offersOnly = false;
  let listingsOnly = false;
  let additionalCurrency = false;
  let reviewRequestGate: Promise<void> | null = null;
  let offerRequestGate: Promise<void> | null = null;
  const reviewOffers = [
    "b",
    "c",
    ...Array.from({ length: 10 }, (_, index) => String(index)),
  ].map((hash) => ({
    ...listing,
    identity: { protocol_address: SEAPORT, order_hash: "0x" + hash.repeat(64) },
    side: "OFFER",
    currency: WETH,
  }));
  const writes: string[] = [];
  const lookups: string[] = [];
  await page.route("**/*", async (route) => {
    const request = route.request(),
      url = new URL(request.url());
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      if (/\/(collect|market)\//.test(url.pathname)) writes.push(url.pathname);
      return route.abort("blockedbyclient");
    }
    if (url.hostname === "collect-fixtures.test")
      return route.fulfill({
        path: path.resolve("public/the-memes-4.jpeg"),
        contentType: "image/jpeg",
      });
    if (url.pathname === "/api/lab_extended_data")
      return route.fulfill({ json: { data: [meta], count: 1 } });
    if (url.pathname === "/api/nfts_memelab")
      return route.fulfill({ json: { data: [nft], count: 1 } });
    if (url.pathname === "/api/collect/assets") {
      lookups.push(url.searchParams.get("family") ?? "");
      return route.fulfill({
        json: {
          data: [asset],
          count: 1,
          page: 1,
          next: false,
          catalog_version: "lab",
        },
      });
    }
    if (url.pathname === "/api/collect/capabilities")
      return route.fulfill({
        json: {
          version: "lab",
          chain_id: 1,
          profile_scope: "PROFILE",
          families: ["memes", "memelab", "gradients", "pebbles"],
          actions: ["BUY", "OFFER", "LIST", "ACCEPT"].map((action) => ({
            action,
            enabled: true,
            reason: null,
          })),
          provider: "fixture",
          creator_fees: "REQUIRED",
          platform_fee_bps: 0,
        },
      });
    if (url.pathname === `/api/market/orders/${listing.identity.order_hash}`) {
      if (reviewRequestGate) await reviewRequestGate;
      return route.fulfill({ json: listing });
    }
    if (url.pathname === "/api/market/batch-capabilities")
      return route.fulfill({
        json: {
          available: true,
          chain_id: 1,
          currency: ZERO,
          execution_policy: "ALL_OR_REVERT",
          max_orders: 128,
          max_allocations: 256,
          max_calldata_bytes: 1048576,
        },
      });
    if (url.pathname === "/api/market/orders") {
      const isOffer = url.searchParams.get("side") === "OFFER";
      if (isOffer && offerRequestGate) await offerRequestGate;
      return route.fulfill({
        json: {
          orders: isOffer ? reviewOffers : [listing],
          next: null,
        },
      });
    }
    if (url.pathname.startsWith("/api/market-depth/"))
      return route.fulfill({
        json: {
          contract: LAB,
          token_id: "70",
          status: "fresh",
          as_of: new Date().toISOString(),
          snapshots: [],
          books: [
            ...[false, true].map((bid) => ({
              currency: captured(bid).currency,
              asks:
                bid || offersOnly
                  ? []
                  : [
                      {
                        unit_price: "0.04",
                        quantity: "3",
                        cumulative_quantity: "3",
                        order_count: 1,
                      },
                    ],
              bids:
                bid && !listingsOnly
                  ? Array.from({ length: 12 }, (_, index) => ({
                      unit_price: captured(true, index).unit_price,
                      quantity: index === 8 ? "6" : "3",
                      cumulative_quantity: String(
                        (index + 1 + (index >= 8 ? 1 : 0)) * 3
                      ),
                      order_count: index === 8 ? 2 : 1,
                    }))
                  : [],
              best_ask: bid || offersOnly ? null : "0.04",
              best_bid:
                bid && !listingsOnly ? captured(true, 0).unit_price : null,
              ask_order_count: bid || offersOnly ? 0 : 1,
              bid_order_count: bid && !listingsOnly ? 13 : 0,
            })),
            ...(additionalCurrency
              ? [
                  {
                    currency: {
                      address: "0x" + "9".repeat(40),
                      symbol: "USDC",
                      decimals: 6,
                    },
                    asks: [
                      {
                        unit_price: "2",
                        quantity: "1",
                        cumulative_quantity: "1",
                        order_count: 1,
                      },
                    ],
                    bids: [],
                    best_ask: "2",
                    best_bid: null,
                    ask_order_count: 1,
                    bid_order_count: 0,
                  },
                ]
              : []),
          ],
          orders: [
            ...(offersOnly ? [] : [captured(false)]),
            ...(listingsOnly
              ? []
              : [
                  ...Array.from({ length: 12 }, (_, index) =>
                    captured(true, index)
                  ),
                  {
                    ...captured(true, 8),
                    order_key: "lab-offer-extra",
                    order_id: "0x" + "e".repeat(64),
                  },
                ]),
          ],
          order_count: (offersOnly ? 0 : 1) + (listingsOnly ? 0 : 13),
          next: null,
          criteria_order_count: 0,
          notes: [],
        },
      });
    if (url.pathname.startsWith("/api/"))
      return route.fulfill({
        json: { data: [], count: 0, next: false, country: "US", is_eu: false },
      });
    return route.continue();
  });
  await page.goto("/meme-lab/70?focus=listings-and-offers", {
    waitUntil: "domcontentloaded",
  });
  const sections = page.getByRole("navigation", {
    name: "Meme Lab page sections",
  });
  await expect(
    sections.getByRole("button", { name: "Listings & offers" })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("button", { name: "Make an offer: Meme Lab artwork" })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "List", exact: true })
  ).toBeVisible();
  await sections.getByRole("button", { name: "Overview", exact: true }).click();
  await page
    .getByRole("button", { name: "View listings & offers", exact: true })
    .click();
  await expect(page).toHaveURL(/focus=listings-and-offers/);
  await expect(
    sections.getByRole("button", { name: "Listings & offers" })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("region", { name: "Listings & offers", exact: true })
  ).toBeVisible();
  const market = page.getByRole("region", {
    name: "Listings & offers",
    exact: true,
  });
  await expect(
    market.getByRole("button", { name: "Collect", exact: true })
  ).toBeVisible();
  await expect(
    market.getByRole("button", { name: "Sell", exact: true }).first()
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^(Refresh|Refresh orders)$/ })
  ).toHaveCount(0);
  await expect(market).toHaveAttribute("tabindex", "-1");
  await expect(market).toHaveCSS("border-top-width", "0px");
  if (!isMobile) {
    for (const [summary, table, heading] of [
      ["Lowest listing · ETH", "Listings for ETH", "Listings · ETH"],
      ["Highest offer · WETH", "Offers for WETH", "Offers · WETH"],
    ] as const) {
      const summaryBounds = (await market
        .getByText(summary, { exact: true })
        .boundingBox())!;
      const tableBounds = (await market
        .getByRole("table", { name: table, exact: true })
        .boundingBox())!;
      expect(summaryBounds.x).toBeCloseTo(tableBounds.x, 0);
      await expect(
        market
          .getByText(summary, { exact: true })
          .locator("..")
          .getByRole("definition")
      ).toHaveCSS("font-size", "16px");
      const hiddenHeading = market.getByRole("heading", {
        name: heading,
        exact: true,
      });
      await expect(hiddenHeading).toBeAttached();
      expect((await hiddenHeading.boundingBox())!.width).toBeLessThanOrEqual(1);
    }
  }
  const offers = market.getByRole("table", { name: "Offers for WETH" });
  const levels = offers.getByRole("button", { name: /^Offers at / });
  await expect(levels).toHaveCount(10);
  const firstLevel = levels.first();
  await expect(firstLevel).toHaveCSS("font-size", "13px");
  await firstLevel.focus();
  await page.keyboard.press("Enter");
  await expect(firstLevel).toBeFocused();
  await expect(firstLevel).toHaveAttribute("aria-expanded", "true");
  await expect(
    offers.getByText("Quoted quantity", { exact: true })
  ).toBeVisible();
  await page.keyboard.press("Enter");
  await expect(firstLevel).toHaveAttribute("aria-expanded", "false");
  const showAll = market.getByRole("button", { name: "Show all levels" });
  await showAll.click();
  await expect(levels).toHaveCount(12);
  await market.getByRole("button", { name: "Show fewer levels" }).click();
  await expect(levels).toHaveCount(10);
  const about = market.getByText("About these prices");
  const source = market.getByText(/^Source: OpenSea/);
  const sourceBounds = (await source.boundingBox())!;
  const aboutBounds = (await about.boundingBox())!;
  expect(aboutBounds.y).toBeGreaterThanOrEqual(
    sourceBounds.y + sourceBounds.height
  );
  const aboutTextLeft = await about.evaluate((element) => {
    const range = document.createRange();
    range.selectNodeContents(element);
    return range.getBoundingClientRect().left;
  });
  expect(aboutTextLeft).toBeCloseTo(sourceBounds.x, 0);
  await about.focus();
  await page.keyboard.press("Enter");
  await expect(
    market.getByText(/Listings can share the same seller inventory/)
  ).toBeVisible();
  await page.keyboard.press("Enter");
  const row = offers.getByRole("row").filter({
    has: page.getByRole("button", {
      name: "Offers at 0.020 WETH",
      exact: true,
    }),
  });
  const priceBounds = (await firstLevel.boundingBox())!;
  const chevronBounds = (await offers
    .getByRole("button", { name: /^Offers at / })
    .first()
    .locator("svg")
    .boundingBox())!;
  const priceTextBounds = (await firstLevel
    .getByText("0.020", { exact: true })
    .boundingBox())!;
  expect(
    chevronBounds.x - priceTextBounds.x - priceTextBounds.width
  ).toBeLessThanOrEqual(10);
  expect(priceBounds.height).toBeGreaterThanOrEqual(44);
  const cells = row.getByRole("cell");
  await expect(cells.first()).toHaveCSS("border-top-left-radius", "12px");
  await expect(cells.last()).toHaveCSS("border-top-right-radius", "12px");
  await expect(cells.first()).toHaveCSS("border-bottom-width", "1px");
  await expect(cells.first()).toHaveCSS("border-top-width", "0px");
  await expect(cells.first()).toHaveCSS("border-left-width", "0px");
  await expect(cells.last()).toHaveCSS("border-right-width", "0px");
  await expect(cells.first()).toHaveCSS(
    "background-color",
    "rgba(63, 105, 252, 0.08)"
  );
  const nextRow = offers.getByRole("row").filter({
    has: page.getByRole("button", {
      name: "Offers at 0.019 WETH",
      exact: true,
    }),
  });
  await expect(nextRow.getByRole("cell").first()).toHaveCSS(
    "border-top-left-radius",
    "0px"
  );
  const outlined = nextRow.getByRole("button", { name: "Sell", exact: true });
  await expect(outlined).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  if (!isMobile) {
    await nextRow.hover();
    await expect(outlined).toHaveCSS("background-color", "rgb(63, 105, 252)");
    await outlined.focus();
    await market.getByText("Highest offer · WETH", { exact: true }).hover();
    await expect(outlined).toHaveCSS("background-color", "rgb(63, 105, 252)");
    await expect(outlined).toHaveCSS("outline-style", "solid");
    await about.focus();
    await expect(outlined).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
  }
  const originalViewport = page.viewportSize()!;
  for (const width of [320, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width + 1);
    const sell = row.getByRole("button", { name: "Sell", exact: true });
    expect((await sell.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    expect((await showAll.boundingBox())!.height).toBeGreaterThanOrEqual(44);
    const tableBounds = (await offers.boundingBox())!;
    const listingTable = (await market
      .getByRole("table", { name: "Listings for ETH" })
      .boundingBox())!;
    const offerSummary = (await market
      .getByText("Highest offer · WETH", { exact: true })
      .boundingBox())!;
    const listingSummary = (await market
      .getByText("Lowest listing · ETH", { exact: true })
      .boundingBox())!;
    expect(offerSummary.y).toBeCloseTo(listingSummary.y, 0);
    expect(offerSummary.x).toBeGreaterThan(listingSummary.x);
    expect(offerSummary.y + offerSummary.height).toBeLessThan(listingTable.y);
    expect(listingSummary.y + listingSummary.height).toBeLessThan(
      listingTable.y
    );
    for (const name of ["Listings · ETH", "Offers · WETH"]) {
      const title = market.getByRole("heading", { name, exact: true });
      expect((await title.boundingBox())!.height).toBeGreaterThan(1);
      await expect(title).toHaveCSS("font-size", "14px");
    }
    await expect(
      market
        .getByText("Highest offer · WETH", { exact: true })
        .locator("..")
        .getByRole("definition")
    ).toHaveCSS("font-size", "14px");
    await expect(firstLevel).toHaveCSS("font-size", "13px");
    expect((await firstLevel.boundingBox())!.x).toBeCloseTo(tableBounds.x, 0);
    const mobilePrice = (await firstLevel
      .getByText("0.020", { exact: true })
      .boundingBox())!;
    expect(mobilePrice.x - tableBounds.x).toBeCloseTo(12, 0);
    const mobileAction = (await sell.boundingBox())!;
    expect(
      tableBounds.x + tableBounds.width - mobileAction.x - mobileAction.width
    ).toBeCloseTo(12, 0);
    expect((await row.boundingBox())!.height).toBeLessThanOrEqual(65);
    expect((await showAll.boundingBox())!.width).toBeCloseTo(
      tableBounds.width,
      0
    );
    const priceHeader = offers.getByRole("columnheader", {
      name: "Price",
      exact: true,
    });
    await expect(priceHeader).toBeAttached();
    expect((await priceHeader.boundingBox())!.height).toBeLessThanOrEqual(1);
    for (const action of [
      sell,
      market.getByRole("button", { name: "Collect", exact: true }),
    ]) {
      await expect(action).toHaveCSS("font-size", "13px");
      expect((await action.boundingBox())!.width).toBeCloseTo(80, 0);
      await expect(action).toHaveCSS("background-clip", "padding-box");
      await expect(action).toHaveCSS("border-top-width", "5px");
      await expect(action).toHaveCSS("border-bottom-width", "5px");
      expect((await action.boundingBox())!.height - 10).toBeCloseTo(34, 0);
    }
    await firstLevel.getByText("Qty", { exact: false }).click();
    await expect(firstLevel).toHaveAttribute("aria-expanded", "true");
    const orderCard = offers.getByRole("listitem").first();
    expect((await orderCard.boundingBox())!.x).toBeCloseTo(tableBounds.x, 0);
    const actionCell = (await row.getByRole("cell").last().boundingBox())!;
    expect(actionCell.x + actionCell.width).toBeCloseTo(
      tableBounds.x + tableBounds.width,
      0
    );
    await firstLevel.click();
    await expect(firstLevel).toHaveAttribute("aria-expanded", "false");
    const groupedRow = offers.getByRole("row").filter({
      has: page.getByRole("button", {
        name: "Offers at 0.012 WETH",
        exact: true,
      }),
    });
    const groupedAction = groupedRow.getByRole("button", {
      name: "Sell",
      exact: true,
    });
    expect((await groupedAction.boundingBox())!.width).toBeCloseTo(80, 0);
    await groupedAction.click();
    await expect(groupedAction).toHaveAttribute("aria-expanded", "true");
    const accept = offers.getByRole("button", {
      name: "Accept offer",
      exact: true,
    });
    await expect(accept).toHaveCount(2);
    await expect(accept.first()).toHaveCSS("white-space", "nowrap");
    await expect(accept.first()).toHaveCSS("padding-left", "12px");
    await expect(accept.first()).toHaveCSS("padding-right", "12px");
    expect((await accept.first().boundingBox())!.width).toBeGreaterThan(80);
    expect((await accept.first().boundingBox())!.height).toBeCloseTo(44, 0);
    await groupedAction.click();
    await expect(groupedAction).toHaveAttribute("aria-expanded", "false");
  }
  for (const width of [768, 1023, 1024]) {
    await page.setViewportSize({ width, height: 1000 });
    const listingBounds = (await market
      .getByRole("table", { name: "Listings for ETH", exact: true })
      .boundingBox())!;
    const offerBounds = (await offers.boundingBox())!;
    if (width < 1024) {
      expect(offerBounds.y).toBeGreaterThan(
        listingBounds.y + listingBounds.height
      );
      expect(offerBounds.x).toBeCloseTo(listingBounds.x, 0);
      expect(offerBounds.width).toBeCloseTo(listingBounds.width, 0);
      const highest = (await market
        .getByText("Highest offer · WETH", { exact: true })
        .boundingBox())!;
      expect(highest.y + highest.height).toBeLessThan(listingBounds.y);
    } else {
      expect(offerBounds.y).toBeCloseTo(listingBounds.y, 0);
      expect(offerBounds.x).toBeGreaterThan(
        listingBounds.x + listingBounds.width
      );
    }
    const groupedPrice = offers.getByRole("button", {
      name: "Offers at 0.012 WETH",
      exact: true,
    });
    await groupedPrice.click();
    const accept = offers.getByRole("button", {
      name: "Accept offer",
      exact: true,
    });
    await expect(accept).toHaveCount(2);
    await expect(accept.first()).toHaveCSS("white-space", "nowrap");
    await expect(accept.first()).toHaveCSS("padding-left", "12px");
    await expect(accept.first()).toHaveCSS("padding-right", "12px");
    await expect(accept.first()).toHaveCSS("border-top-width", "5px");
    await expect(accept.first()).toHaveCSS("border-bottom-width", "5px");
    await expect(accept.first()).toHaveCSS("line-height", "16px");
    expect((await accept.first().boundingBox())!.height).toBeCloseTo(44, 0);
    await groupedPrice.click();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width + 1);
  }
  await page.setViewportSize(originalViewport);
  const collect = market.getByRole("button", { name: "Collect", exact: true });
  await collect.click();
  const remove = market.getByRole("button", { name: "Remove", exact: true });
  await expect(remove).toHaveAttribute("aria-pressed", "true");
  const quantity = market.getByRole("textbox", {
    name: "Quantity",
    exact: true,
  });
  await expect(quantity).toHaveValue("1");
  await quantity.fill("2");
  const selectedPrice = market
    .getByRole("row")
    .filter({ has: page.getByRole("button", { name: "Remove", exact: true }) })
    .getByRole("cell")
    .first();
  await expect(selectedPrice).toHaveCSS("background-color", "rgb(28, 28, 33)");
  const reviewSelected = market.getByRole("button", {
    name: "Review selected listings (1)",
    exact: true,
  });
  const bar = market
    .getByRole("button", { name: "Review selected listings (1)", exact: true })
    .locator("..");
  await expect(bar).toHaveCSS("position", "sticky");
  await quantity.scrollIntoViewIfNeeded();
  await expect(reviewSelected).toBeInViewport();
  await levels.nth(5).scrollIntoViewIfNeeded();
  await expect(reviewSelected).toBeInViewport();
  const dock = page
    .getByRole("navigation", { name: "Primary navigation", exact: true })
    .locator('[data-mobile-bottom-nav-dock="true"]');
  if (await dock.isVisible()) {
    const barBounds = (await bar.boundingBox())!;
    expect(barBounds.y + barBounds.height).toBeLessThanOrEqual(
      (await dock.boundingBox())!.y
    );
  }
  await page.screenshot({
    path: info.outputPath("market-depth-selection.png"),
    fullPage: false,
  });
  // Audit the selected controls; arbitrary scroll offsets can partially reveal
  // another table row behind the sticky bar. Verify focused rows clear it below.
  const selectedScan = await new AxeBuilder({ page })
    .include('table:has([aria-pressed="true"])')
    .include("[data-market-depth-selection-bar]")
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(selectedScan.violations).toEqual([]);
  await levels.nth(6).focus();
  const focusedLevelBounds = (await levels.nth(6).boundingBox())!;
  expect(focusedLevelBounds.y + focusedLevelBounds.height).toBeLessThanOrEqual(
    (await bar.boundingBox())!.y
  );
  const idleButtonBounds = (await reviewSelected.boundingBox())!;
  const idleBarBounds = (await bar.boundingBox())!;
  let releaseReview!: () => void;
  reviewRequestGate = new Promise<void>((resolve) => {
    releaseReview = resolve;
  });
  try {
    await reviewSelected.click();
    await expect(reviewSelected).toHaveAttribute("aria-busy", "true");
    await expect(reviewSelected).toBeDisabled();
    await expect(
      page
        .getByRole("button", { name: /^Review selected listings/ })
        .locator("svg")
    ).toBeVisible();
    await expect(reviewSelected).toHaveCSS("opacity", "1");
    await expect(
      page
        .getByRole("button", { name: /^Review selected listings/ })
        .locator("svg path")
        .last()
    ).toHaveCSS("fill", "rgb(255, 255, 255)");
    await expect(
      page
        .getByRole("button", { name: /^Review selected listings/ })
        .locator("svg path")
        .first()
    ).toHaveCSS("fill", "rgba(255, 255, 255, 0.25)");
    const loadingMessage = market.getByRole("status").filter({
      hasText: "Checking selected listings…",
    });
    await expect(loadingMessage).toHaveCSS("clip", "rect(0px, 0px, 0px, 0px)");
    const loadingButtonBounds = (await reviewSelected.boundingBox())!;
    const loadingBarBounds = (await bar.boundingBox())!;
    for (const dimension of ["x", "y", "width", "height"] as const) {
      expect(loadingButtonBounds[dimension]).toBeCloseTo(
        idleButtonBounds[dimension],
        0
      );
      expect(loadingBarBounds[dimension]).toBeCloseTo(
        idleBarBounds[dimension],
        0
      );
    }
    await page.screenshot({
      path: info.outputPath("market-depth-review-loading.png"),
      fullPage: false,
    });
  } finally {
    releaseReview();
    reviewRequestGate = null;
  }
  const purchaseReview = page.getByRole("dialog", {
    name: "Review your purchase",
    exact: true,
  });
  await expect(
    purchaseReview.getByRole("button", {
      name: "Back to collecting",
      exact: true,
    })
  ).toBeVisible();
  await expect(
    purchaseReview.getByRole("heading", {
      name: "Review your purchase",
      exact: true,
    })
  ).toHaveCSS("clip", "rect(0px, 0px, 0px, 0px)");
  await expect(
    purchaseReview.getByRole("button", { name: "Connect wallet", exact: true })
  ).toBeVisible();
  await expect(
    purchaseReview.getByRole("button", {
      name: "Review live total",
      exact: true,
    })
  ).toBeDisabled();
  await expect(
    purchaseReview.getByRole("button", {
      name: "Review live total",
      exact: true,
    })
  ).toBeInViewport();
  await expect(
    purchaseReview.getByText("#70 · Quantity 2", { exact: true })
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("market-depth-purchase-review.png"),
    fullPage: false,
  });
  const reviewScan = await new AxeBuilder({ page })
    .include('[role="dialog"]')
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  expect(reviewScan.violations).toEqual([]);
  await purchaseReview
    .getByRole("button", { name: "Change", exact: true })
    .click();
  await expect(
    purchaseReview.getByRole("textbox", {
      name: "Or enter a wallet address directly",
      exact: true,
    })
  ).toBeVisible();
  await purchaseReview
    .getByRole("button", { name: "Done", exact: true })
    .click();
  await purchaseReview
    .getByRole("button", { name: "Back to selection", exact: true })
    .click();
  await expect(purchaseReview).toHaveCount(0);
  await expect(reviewSelected).toBeFocused();
  await expect(quantity).toHaveValue("2");
  await remove.click();
  await expect(reviewSelected).toHaveCount(0);
  await expect(quantity).toHaveCount(0);
  expect(lookups).toContain("memelab");
  expect(lookups).not.toContain("memes");
  // Hold the first offer response so the loading-to-picker layout is observable.
  let releaseOffers!: () => void;
  offerRequestGate = new Promise<void>((resolve) => {
    releaseOffers = resolve;
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  const moreActions = page.getByRole("button", {
    name: "More trading actions for Meme Lab artwork",
  });
  await moreActions.click();
  await page
    .getByRole("menuitem", { name: "Review offers: Meme Lab artwork" })
    .click();
  const ordersDialog = page.getByRole("dialog");
  const ordersPanel = page
    .getByRole("dialog")
    .locator(".mobile-wrapper-dialog");
  const orderQuantity = ordersDialog.getByLabel("Quantity", { exact: true });
  let pendingBounds;
  let quantityInput;
  try {
    await expect(ordersDialog.getByRole("status")).toHaveText(
      "Loading artwork"
    );
    await expect(orderQuantity).toHaveCount(1);
    await expect(orderQuantity).toBeHidden();
    await expect(
      ordersDialog.getByRole("button", { name: "Connect wallet", exact: true })
    ).toHaveCount(0);
    await expect(
      ordersDialog.getByRole("button", {
        name: "Review exact terms",
        exact: true,
      })
    ).toHaveCount(0);
    await expect(ordersDialog.getByRole("radio")).toHaveCount(0);
    await expect(
      ordersDialog.getByRole("button", { name: "Close", exact: true })
    ).toBeVisible();
    await expect(
      page.getByRole("dialog").locator('[role="status"] [aria-hidden="true"]')
    ).toHaveCSS("animation-name", "none");
    quantityInput = await orderQuantity.elementHandle();
    pendingBounds = (await ordersPanel.boundingBox())!;
    await ordersPanel.screenshot({
      path: info.outputPath("review-offers-loading.png"),
    });
  } finally {
    releaseOffers();
    offerRequestGate = null;
  }
  await expect(ordersDialog.getByRole("radio")).toHaveCount(
    reviewOffers.length
  );
  await expect(orderQuantity).toBeVisible();
  expect(
    await orderQuantity.evaluate(
      (element, original) => element === original,
      quantityInput
    )
  ).toBe(true);
  const readyBounds = (await ordersPanel.boundingBox())!;
  for (const dimension of ["x", "y", "width", "height"] as const) {
    expect(readyBounds[dimension]).toBeCloseTo(pendingBounds![dimension], 0);
  }
  const orderChoices = ordersDialog.getByRole("radio");
  const headingBox = (await ordersDialog.getByRole("heading").boundingBox())!;
  const closeBox = (await ordersDialog
    .getByRole("button", { name: "Close", exact: true })
    .boundingBox())!;
  const legendBox = (await page
    .getByRole("dialog")
    .locator("legend")
    .boundingBox())!;
  const firstChoiceBox = (await ordersDialog
    .getByRole("radio")
    .nth(0)
    .locator("..")
    .boundingBox())!;
  const walletSummary = page
    .getByRole("dialog")
    .locator("[data-collect-wallet-summary]");
  const walletSummaryBox = (await walletSummary.boundingBox())!;
  expect(walletSummaryBox.y - closeBox.y - closeBox.height).toBeCloseTo(16, 0);
  expect(
    legendBox.y - walletSummaryBox.y - walletSummaryBox.height
  ).toBeCloseTo(isMobile ? 20 : 24, 0);
  const connectInSummary = walletSummary.getByRole("button", {
    name: "Connect wallet",
    exact: true,
  });
  await expect(connectInSummary).toHaveCount(1);
  await expect(connectInSummary).toHaveAttribute("type", "button");
  await expect(connectInSummary).toHaveCSS(
    "background-color",
    "rgb(236, 236, 238)"
  );
  await expect(
    page
      .getByRole("dialog")
      .locator("[data-collect-order-footer]")
      .getByRole("button", {
        name: "Connect wallet",
        exact: true,
      })
  ).toHaveCount(0);
  expect(legendBox.x).toBeCloseTo(headingBox.x, 0);
  expect(firstChoiceBox.x).toBeCloseTo(headingBox.x, 0);
  expect(firstChoiceBox.y - legendBox.y - legendBox.height).toBeCloseTo(16, 0);
  await expect(orderChoices.nth(0)).not.toBeChecked();
  await expect(orderChoices.nth(1)).not.toBeChecked();
  await ordersDialog.getByRole("radio").nth(0).locator("..").click();
  await orderQuantity.fill("2");
  await orderChoices.nth(1).press("Space");
  await expect(orderChoices.nth(1)).toBeChecked();
  await expect(orderChoices.nth(0)).not.toBeChecked();
  await expect(orderQuantity).toHaveValue("1");
  await expect(
    ordersDialog.getByRole("button", { name: "Connect wallet", exact: true })
  ).toBeVisible();
  await expect(
    ordersDialog.getByRole("button", {
      name: "Review exact terms",
      exact: true,
    })
  ).toBeDisabled();
  {
    const originalViewport = page.viewportSize()!;
    const orderBook = page
      .getByRole("dialog")
      .locator("[data-collect-order-book]");
    const footer = page
      .getByRole("dialog")
      .locator("[data-collect-order-footer]");
    const reviewTerms = ordersDialog.getByRole("button", {
      name: "Review exact terms",
      exact: true,
    });
    for (const viewport of [
      originalViewport,
      isMobile ? { width: 320, height: 568 } : { width: 1280, height: 720 },
    ]) {
      await page.setViewportSize(viewport);
      await expect(orderQuantity).toBeInViewport();
      await expect(reviewTerms).toBeInViewport();
      const footerBefore = (await footer.boundingBox())!;
      const bookBounds = (await orderBook.boundingBox())!;
      expect(bookBounds.y + bookBounds.height).toBeLessThanOrEqual(
        footerBefore.y
      );
      await ordersDialog
        .getByRole("radio")
        .last()
        .locator("..")
        .scrollIntoViewIfNeeded();
      const footerAfter = (await footer.boundingBox())!;
      expect(footerAfter.y).toBeCloseTo(footerBefore.y, 0);
      await expect(reviewTerms).toBeInViewport();
      const lastChoiceBounds = (await ordersDialog
        .getByRole("radio")
        .last()
        .locator("..")
        .boundingBox())!;
      expect(lastChoiceBounds.y + lastChoiceBounds.height).toBeLessThanOrEqual(
        footerAfter.y
      );
      await expect(orderChoices.nth(1)).toBeChecked();
      await expect(orderQuantity).toHaveValue("1");
      await expectNoHorizontalOverflow(page);
    }
    // A very short available viewport must still allow reaching every control.
    await page.setViewportSize({ width: isMobile ? 390 : 1280, height: 400 });
    await reviewTerms.scrollIntoViewIfNeeded();
    await expect(reviewTerms).toBeInViewport();
    const connectWallet = ordersDialog.getByRole("button", {
      name: "Connect wallet",
      exact: true,
    });
    await connectWallet.scrollIntoViewIfNeeded();
    await expect(connectWallet).toBeInViewport();
    await expect(orderChoices.nth(1)).toBeChecked();
    await expect(orderQuantity).toHaveValue("1");
    await page.setViewportSize(originalViewport);
    await ordersDialog.getByRole("heading").scrollIntoViewIfNeeded();
    await ordersDialog
      .getByRole("radio")
      .nth(1)
      .locator("..")
      .scrollIntoViewIfNeeded();
  }
  await ordersPanel.screenshot({
    path: info.outputPath("review-offers-ready.png"),
  });
  await ordersDialog
    .getByRole("button", { name: "Close", exact: true })
    .click();
  await expect(ordersDialog).toHaveCount(0);
  await expect(moreActions).toBeFocused();
  await page.emulateMedia({ reducedMotion: "no-preference" });
  const offer = page.getByRole("button", {
    name: "Make an offer: Meme Lab artwork",
  });
  await offer.click();
  await expect(
    page
      .getByRole("dialog")
      .getByRole("button", { name: "Connect wallet", exact: true })
  ).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(offer).toBeFocused();
  expect(writes).toEqual([]);
  expect(
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  // A single quoted side fills the panel, with both summaries still above it.
  for (const side of ["offers", "listings"] as const) {
    offersOnly = side === "offers";
    listingsOnly = side === "listings";
    await page.reload({ waitUntil: "domcontentloaded" });
    const loneTable = market.getByRole("table", {
      name: offersOnly ? "Offers for WETH" : "Listings for ETH",
      exact: true,
    });
    await expect(loneTable).toBeVisible();
    await expect(market.getByRole("table")).toHaveCount(1);
    const lowest = market.getByText("Lowest listing · ETH", { exact: true });
    const highest = market.getByText("Highest offer · WETH", { exact: true });
    await expect(
      market
        .getByText(
          offersOnly ? "Lowest listing · ETH" : "Highest offer · WETH",
          {
            exact: true,
          }
        )
        .locator("..")
    ).toContainText("—");
    for (const width of [390, 900, 1024, 1440]) {
      await page.setViewportSize({ width, height: 1000 });
      const panelBounds = (await market.boundingBox())!;
      const tableBounds = (await loneTable.boundingBox())!;
      const leftSummary = (await lowest.boundingBox())!;
      const rightSummary = (await highest.boundingBox())!;
      expect(tableBounds.x).toBeCloseTo(panelBounds.x, 0);
      expect(tableBounds.width).toBeCloseTo(panelBounds.width, 0);
      expect(rightSummary.y).toBeCloseTo(leftSummary.y, 0);
      expect(rightSummary.x).toBeGreaterThan(leftSummary.x);
      for (const summary of [leftSummary, rightSummary]) {
        expect(summary.y + summary.height).toBeLessThan(tableBounds.y);
      }
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth)
      ).toBeLessThanOrEqual(width + 1);
      if (width === 390 || width === 1440) {
        await market.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: info.outputPath(`market-depth-${side}-only-${width}.png`),
          fullPage: true,
        });
      }
    }
  }
  offersOnly = true;
  listingsOnly = false;
  additionalCurrency = true;
  await page.reload({ waitUntil: "domcontentloaded" });
  const additionalTable = market.getByRole("table", {
    name: "Listings for USDC",
    exact: true,
  });
  await expect(additionalTable).toBeVisible();
  for (const width of [390, 900]) {
    await page.setViewportSize({ width, height: 1000 });
    // Read both tables in one frame; late card data can move the whole section.
    const { extraBounds, canonicalBounds } = await additionalTable.evaluate(
      (extra, canonical) => {
        if (!canonical) throw new Error("Expected the offers table");
        const bounds = (element: Element) => {
          const { x, y, width, height } = element.getBoundingClientRect();
          return { x, y, width, height };
        };
        return {
          extraBounds: bounds(extra),
          canonicalBounds: bounds(canonical),
        };
      },
      await offers.elementHandle()
    );
    expect(extraBounds.width).toBeCloseTo(canonicalBounds.width, 0);
    expect(extraBounds.x).toBeCloseTo(canonicalBounds.x, 0);
    expect(extraBounds.y).toBeGreaterThan(
      canonicalBounds.y + canonicalBounds.height
    );
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth)
    ).toBeLessThanOrEqual(width + 1);
  }
  await page.setViewportSize(originalViewport);
  await page.screenshot({
    path: info.outputPath("meme-lab-marketplace.png"),
    fullPage: true,
  });
});
