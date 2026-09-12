import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const MEMES = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const ZERO = "0x0000000000000000000000000000000000000000";
const assets = [1, 2, 3].map((id) => ({
  asset_key: `1:${MEMES}:${id}`,
  chain_id: 1,
  contract: MEMES,
  token_id: String(id),
  family: "memes",
  name: `Catalog artwork ${id}`,
  image_url: "https://collect-fixtures.test/art.jpeg",
  artist_ids: ["artist-1"],
  season: 1,
  traits: [],
  hodl_rate: 1,
  tdh_eligible: true,
}));
const catalog = {
  version: "fixture-catalog",
  chain_id: 1,
  seasons: [
    {
      id: 1,
      name: "Season 1",
      asset_keys: assets.map((asset) => asset.asset_key),
      current: false,
    },
  ],
  artists: [
    {
      id: "artist-1",
      name: "Catalog artist",
      asset_keys: assets.map((asset) => asset.asset_key),
      collaboration_asset_keys: [],
    },
  ],
  pebbles_traits: [
    { trait: "Palette", values: ["Blue", "Red"] },
    { trait: "Size", values: ["Small", "Large"] },
    { trait: "Traced", values: ["Yes", "No"] },
  ],
  tdh_snapshot: null,
};

const listings = assets.slice(0, 2).map((asset, index) => ({
  asset,
  order: {
    identity: {
      protocol_address: "0x0000000000000068f116a894984e2db1123eb395",
      order_hash: `0x${String(index + 1).repeat(64)}`,
    },
    asset_key: asset.asset_key,
    maker: "0x0000000000000000000000000000000000000011",
    recipient: ZERO,
    side: "LISTING",
    quantity: "1",
    currency: ZERO,
    total_wei: index ? "20000000000000000" : "10000000000000000",
    net_wei: index ? "20000000000000000" : "10000000000000000",
    fees: [],
    start_time: "1",
    end_time: "2000000000",
  },
}));

async function mockCatalog(page: Page, state = { fail: false }) {
  const mutations: string[] = [];
  await page.route("**/*", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (!["GET", "HEAD", "OPTIONS"].includes(request.method())) {
      if (/\/(collect|market)\//.test(url.pathname))
        mutations.push(url.pathname);
      await route.abort("blockedbyclient");
      return;
    }
    if (url.hostname === "collect-fixtures.test") {
      await route.fulfill({
        path: path.resolve("public/the-memes-4.jpeg"),
        contentType: "image/jpeg",
      });
      return;
    }
    if (url.pathname === "/api/collect/catalog") {
      await route.fulfill({ json: catalog });
      return;
    }
    if (url.pathname === "/api/collect/capabilities") {
      await route.fulfill({
        json: {
          version: "fixture",
          chain_id: 1,
          profile_scope: "PROFILE",
          families: ["memes", "gradients", "pebbles"],
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
      return;
    }
    if (url.pathname === "/api/market/batch-capabilities") {
      await route.fulfill({
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
      return;
    }
    if (url.pathname === "/api/collect/assets") {
      if (state.fail)
        await route.fulfill({
          status: 503,
          json: { error: "Catalog temporarily unavailable" },
        });
      else {
        const query = url.searchParams.get("query") ?? "";
        const data = assets.filter(
          (asset) => asset.name.includes(query) || asset.token_id === query
        );
        await route.fulfill({
          json: {
            data,
            count: data.length,
            page: 1,
            next: false,
            catalog_version: catalog.version,
          },
        });
      }
      return;
    }
    if (url.pathname === "/api/market/listings") {
      if (state.fail) {
        await route.fulfill({
          status: 503,
          json: { error: "Listings temporarily unavailable" },
        });
        return;
      }
      await route.fulfill({
        json: {
          entries: listings,
          next: null,
          checked_at: new Date().toISOString(),
          complete: true,
        },
      });
      return;
    }
    if (url.pathname === "/api/collect/tdh-listings") {
      await route.fulfill({
        json: {
          family: "memes",
          snapshot_id: "tdh-fixture",
          catalog_version: catalog.version,
          status: "FRESH",
          coverage_complete: true,
          evaluated_ask_count: 2,
          observed_at: new Date().toISOString(),
          next: null,
          entries: [...listings].reverse().map((item) => ({
            ...item,
            available_quantity: "1",
            purchase_quantity: "1",
            purchase_cost_wei: item.order.total_wei,
            rate_hundredths: item.asset.token_id === "2" ? "400" : "100",
            base_tdh_per_day_hundredths:
              item.asset.token_id === "2" ? "400" : "100",
          })),
        },
      });
      return;
    }
    if (url.pathname === "/api/market/orders") {
      await route.fulfill({ json: { orders: [], next: null } });
      return;
    }
    await route.continue();
  });
  return mutations;
}

async function noHorizontalOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth + 1
    )
  ).toBe(true);
}

test.beforeEach(async ({ baseURL, context }) => {
  expect(
    new URL(baseURL ?? "").hostname,
    "Fixture tests only run against an isolated local frontend"
  ).toMatch(/^(localhost|127\.0\.0\.1)$/);
  await context.addCookies([
    { name: "essential-cookies-consent", value: "true", url: baseURL! },
    { name: "performance-cookies-consent", value: "false", url: baseURL! },
  ]);
});

test("listing selection carries across browsing and opens one wallet-gated purchase review", async ({
  page,
}, info) => {
  const mutations = await mockCatalog(page);
  await page.goto("/collect?collection=memes&intent=lowest", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("heading", { name: "Build your collection", exact: true })
  ).toBeVisible();
  const addFirst = page.getByRole("button", {
    name: "Add Catalog artwork 1 to selection",
    exact: true,
  });
  await addFirst.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const selection = page.getByRole("region", {
    name: "Selected NFTs",
    exact: true,
  });
  await expect(
    selection.getByText("1 selected", { exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Add Catalog artwork 2 to selection",
      exact: true,
    })
    .click();
  await expect(
    selection.getByText("2 selected", { exact: true })
  ).toBeVisible();
  await expect(selection).toBeInViewport();
  await noHorizontalOverflow(page);
  await page.screenshot({
    path: info.outputPath("collect-catalog-selection.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "TDH", exact: true }).click();
  await expect(
    selection.getByText("2 selected", { exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Remove Catalog artwork 1 from selection",
      exact: true,
    })
    .click();
  await expect(
    selection.getByText("1 selected", { exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", {
      name: "Add Catalog artwork 1 to selection",
      exact: true,
    })
    .click();
  const review = selection.getByRole("button", {
    name: "Review purchase",
    exact: true,
  });
  await review.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog");
  await expect(dialog).toHaveCount(1);
  await expect(dialog).toHaveAttribute("aria-modal", "true");
  await expect(
    dialog.getByRole("button", { name: "Connect wallet", exact: true })
  ).toBeVisible();
  await expect(
    dialog.getByRole("button", { name: "Review live total", exact: true })
  ).toBeDisabled();
  await expect(
    dialog.getByRole("button", { name: "Review live total", exact: true })
  ).toBeInViewport();
  const all = dialog.getByRole("checkbox", { name: "Select all", exact: true });
  await expect(all).toBeChecked();
  await dialog
    .getByRole("checkbox", { name: "Select Catalog artwork 1", exact: true })
    .uncheck();
  await expect(
    dialog.getByText("1 of 2 selected", { exact: true })
  ).toBeVisible();
  await all.check();
  await expect(
    dialog.getByText("2 of 2 selected", { exact: true })
  ).toBeVisible();
  await expect
    .poll(() =>
      dialog.evaluate((node) => node.contains(document.activeElement))
    )
    .toBe(true);
  await page.keyboard.press("Tab");
  await expect
    .poll(() =>
      dialog.evaluate((node) => node.contains(document.activeElement))
    )
    .toBe(true);
  const backgroundReview = page.getByRole("button", {
    name: "Review purchase",
    exact: true,
    includeHidden: true,
  });
  await expect
    .poll(() =>
      backgroundReview.evaluate((node) => Boolean(node.closest("[inert]")))
    )
    .toBe(true);
  await noHorizontalOverflow(page);
  await page.screenshot({
    path: info.outputPath("collect-selection-review.png"),
    fullPage: true,
  });
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(review).toBeFocused();
  await selection.getByRole("button", { name: "Clear", exact: true }).click();
  await expect(selection).toHaveCount(0);
  expect(mutations).toEqual([]);
});

test("group offer prices remain per NFT and survive a return to browsing", async ({
  page,
}, info) => {
  const mutations = await mockCatalog(page);
  await page.goto("/collect?collection=memes&intent=lowest", {
    waitUntil: "domcontentloaded",
  });
  for (const id of [1, 2]) {
    await page
      .getByRole("button", {
        name: `Add Catalog artwork ${id} to selection`,
        exact: true,
      })
      .click();
  }
  const open = page.getByRole("button", { name: "Plan offers", exact: true });
  await open.click();
  await expect(
    page.getByRole("heading", { name: "Plan offers", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  const first = page.getByRole("textbox", {
    name: "WETH price per NFT for Catalog artwork 1",
    exact: true,
  });
  const second = page.getByRole("textbox", {
    name: "WETH price per NFT for Catalog artwork 2",
    exact: true,
  });
  await first.fill("0.005");
  await second.fill("0.012");
  await expect(
    page.getByRole("textbox", { name: "Offer budget (WETH)", exact: true })
  ).toHaveCount(0);
  await expect(
    page.getByRole("button", {
      name: "Review offer for Catalog artwork 1",
      exact: true,
    })
  ).toBeDisabled();
  await noHorizontalOverflow(page);
  await page.screenshot({
    path: info.outputPath("collect-group-offers.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Back to collecting", exact: true })
    .click();
  await expect(open).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Plan offers", exact: true })
  ).toBeHidden();
  await open.click();
  await expect(first).toHaveValue("0.005");
  await expect(second).toHaveValue("0.012");
  expect(mutations).toEqual([]);
});

test("set planning is the default and navigation opens observed listings", async ({
  page,
}, info) => {
  const mutations = await mockCatalog(page);
  await page.goto("/collect", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByRole("form", { name: "Complete a full set", exact: true })
  ).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({
    path: info.outputPath("collect-default-planner.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Lowest listings", exact: true })
    .click();
  await expect(page.getByText("0.01 ETH", { exact: true })).toBeVisible();
  await expect(page.getByText("0.02 ETH", { exact: true })).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({
    path: info.outputPath("collect-lowest.png"),
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Complete a set", exact: true })
    .click();
  await expect(
    page.getByRole("form", { name: "Complete a full set", exact: true })
  ).toBeVisible();
  const season = page.getByRole("radio", { name: "Season", exact: true });
  await season.focus();
  await season.press("Space");
  await expect(
    page.getByRole("form", { name: "Complete a season", exact: true })
  ).toBeVisible();
  await expect(season).toBeFocused();
  const target = page.getByRole("combobox", { name: "Season", exact: true });
  await target.fill("Season 1");
  await target.press("ArrowDown");
  await target.press("Enter");
  await expect(target).toHaveValue("Season 1");
  await expect(target).toBeFocused();
  await expect(
    page.getByRole("button", { name: "Connect wallet", exact: true }).last()
  ).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({
    path: info.outputPath("collect-season-public.png"),
    fullPage: true,
  });
  expect(mutations).toEqual([]);
});

test("listing errors remain distinct from empty results and support retry", async ({
  page,
}, info) => {
  const state = { fail: true };
  const mutations = await mockCatalog(page, state);
  await page.goto("/collect?collection=memes&intent=lowest", {
    waitUntil: "domcontentloaded",
  });
  const alert = page
    .getByRole("alert")
    .filter({ hasText: "The catalog could not be loaded" });
  await expect(alert).toBeVisible({ timeout: 30000 });
  await page.screenshot({
    path: info.outputPath("collect-error.png"),
    fullPage: true,
  });
  state.fail = false;
  await alert.getByRole("button", { name: "Try again", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Catalog artwork 1" })
  ).toBeVisible();
  await expect(alert).toHaveCount(0);
  await noHorizontalOverflow(page);
  expect(mutations).toEqual([]);
});

test("TDH opens Memes listings immediately and keeps projection as a separate keyboard-accessible view", async ({
  page,
}, info) => {
  const mutations = await mockCatalog(page);
  await page.goto("/collect?intent=lowest&collection=pebbles", {
    waitUntil: "domcontentloaded",
  });
  const tab = page.getByRole("button", { name: "TDH", exact: true });
  await tab.focus();
  await tab.press("Enter");
  await expect(tab).toBeFocused();
  await expect(
    page.getByRole("button", { name: "The Memes", exact: true })
  ).toHaveAttribute("aria-pressed", "true");
  await expect(
    page.getByRole("region", { name: "Lowest cost TDH", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("article").first()).toContainText(
    "Catalog artwork 2"
  );
  await expect(
    page.getByRole("combobox", { name: "Timeframe", exact: true })
  ).toHaveCount(0);
  const projection = page.getByRole("button", {
    name: "Reach target TDH",
    exact: true,
  });
  await projection.focus();
  await projection.press("Enter");
  const back = page.getByRole("button", {
    name: "Back to TDH listings",
    exact: true,
  });
  await expect(back).toBeFocused();
  await expect(
    page.getByRole("form", { name: "Reach target TDH", exact: true })
  ).toBeVisible();
  await expect(
    page.getByRole("combobox", { name: "Timeframe", exact: true })
  ).toHaveValue("30");
  await expect(page.getByLabel("Target TDH", { exact: true })).toHaveValue("");
  await page.screenshot({
    path: info.outputPath("collect-tdh-target.png"),
    fullPage: true,
  });
  await expect(
    page.getByRole("region", { name: "Lowest cost TDH", exact: true })
  ).toHaveCount(0);
  await back.press("Enter");
  await expect(projection).toBeFocused();
  await expect(page.getByRole("article").first()).toContainText(
    "Catalog artwork 2"
  );
  await noHorizontalOverflow(page);
  await page.screenshot({
    path: info.outputPath("collect-tdh-listings.png"),
    fullPage: true,
  });
  expect(mutations).toEqual([]);
});

test("Pebbles shows one profile row with two custody wallets and canonical Ultimate coverage", async ({
  page,
}, info) => {
  const mutations = await mockCatalog(page);
  const firstWallet = "0x0000000000000000000000000000000000000011";
  const secondWallet = "0x0000000000000000000000000000000000000022";
  const row = {
    owner: firstWallet,
    account_key: `${firstWallet}-${secondWallet}`,
    profile_id: "fixture-profile",
    custody_wallets: [firstWallet, secondWallet],
    handle: "fixture-collector",
    normalised_handle: "fixture-collector",
    consolidation_display: "fixture-collector",
    level: 1,
    tdh: 10,
    rep_score: 0,
    distinct_values_count: 2,
    token_values: [
      {
        value: "Blue",
        tokens: [10000000001],
        token_owners: [{ token_id: 10000000001, wallet: firstWallet }],
      },
      {
        value: "Red",
        tokens: [10000000002],
        token_owners: [{ token_id: 10000000002, wallet: secondWallet }],
      },
    ],
    trait_sets: { palette: 2, size: 2, traced: 2 },
  };
  await page.route("**/api/nextgen/collections/1/traits", (route) =>
    route.fulfill({ json: catalog.pebbles_traits })
  );
  await page.route("**/api/nextgen/collections/1/trait_sets/**", (route) =>
    route.fulfill({ json: { count: 1, data: [row], page: 1, next: false } })
  );
  await page.route(
    "**/api/nextgen/collections/1/ultimate_trait_set?**",
    (route) =>
      route.fulfill({ json: { count: 1, data: [row], page: 1, next: false } })
  );
  await page.goto("/nextgen/collection/pebbles/trait-sets", {
    waitUntil: "domcontentloaded",
  });
  await expect(
    page.getByText("Collector profiles: 1", { exact: true })
  ).toBeVisible();
  await expect(
    page.getByText(
      "Set coverage includes all confirmed wallets in each profile.",
      { exact: true }
    )
  ).toBeVisible();
  await page
    .locator("details")
    .filter({ has: page.getByRole("link", { name: /fixture-collector/ }) })
    .locator("summary")
    .press("Enter");
  await expect(
    page.getByRole("link", {
      name: `Pebbles #1, held by ${firstWallet}`,
      exact: true,
    })
  ).toBeVisible();
  await expect(
    page.getByRole("link", {
      name: `Pebbles #2, held by ${secondWallet}`,
      exact: true,
    })
  ).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({
    path: info.outputPath("pebbles-profile-custody.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: "Ultimate", exact: true }).click();
  await expect(
    page.getByText("Palette values: 2", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("Size values: 2", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Traced values: 2", { exact: true })
  ).toBeVisible();
  await expect(page.getByText("[object Object]", { exact: true })).toHaveCount(
    0
  );
  await noHorizontalOverflow(page);
  await page.screenshot({
    path: info.outputPath("pebbles-profile-ultimate.png"),
    fullPage: true,
  });
  expect(mutations).toEqual([]);
});
