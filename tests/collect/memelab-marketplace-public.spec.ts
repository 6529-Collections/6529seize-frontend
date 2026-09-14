import { expect, test } from "@playwright/test";
import path from "node:path";

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
  quantity_step: "1",
  currency: ZERO,
  total_wei: "120000000000000000",
  net_wei: "120000000000000000",
  fees: [],
  start_time: "1",
  end_time: "2000000000",
};
const captured = (bid: boolean) => ({
  order_key: bid ? "lab-offer" : "lab-listing",
  order_id: "0x" + (bid ? "b" : "a").repeat(64),
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
  total_price_raw: bid ? "60000000000000000" : listing.total_wei,
  unit_price: bid ? "0.02" : "0.04",
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
}, info) => {
  expect(new URL(baseURL ?? "").hostname).toMatch(/^(localhost|127\.0\.0\.1)$/);
  await context.addCookies([
    { name: "essential-cookies-consent", value: "true", url: baseURL! },
    { name: "performance-cookies-consent", value: "false", url: baseURL! },
  ]);
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
    if (url.pathname === "/api/market/orders")
      return route.fulfill({
        json: {
          orders: url.searchParams.get("side") === "LISTING" ? [listing] : [],
          next: null,
        },
      });
    if (url.pathname.startsWith("/api/market-depth/"))
      return route.fulfill({
        json: {
          contract: LAB,
          token_id: "70",
          status: "fresh",
          as_of: new Date().toISOString(),
          snapshots: [],
          books: [false, true].map((bid) => ({
            currency: captured(bid).currency,
            asks: bid
              ? []
              : [
                  {
                    unit_price: "0.04",
                    quantity: "3",
                    cumulative_quantity: "3",
                    order_count: 1,
                  },
                ],
            bids: bid
              ? [
                  {
                    unit_price: "0.02",
                    quantity: "3",
                    cumulative_quantity: "3",
                    order_count: 1,
                  },
                ]
              : [],
            best_ask: bid ? null : "0.04",
            best_bid: bid ? "0.02" : null,
            ask_order_count: bid ? 0 : 1,
            bid_order_count: bid ? 1 : 0,
          })),
          orders: [captured(false), captured(true)],
          order_count: 2,
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
    market.getByRole("button", { name: "Sell", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^(Refresh|Refresh orders)$/ })
  ).toHaveCount(0);
  expect(lookups).toContain("memelab");
  expect(lookups).not.toContain("memes");
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
  await page.screenshot({
    path: info.outputPath("meme-lab-marketplace.png"),
    fullPage: true,
  });
});
