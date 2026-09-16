import { expect, test, type Page } from "@playwright/test";
import path from "node:path";

const MEMES = "0x33fd426905f149f8376e227d0c9d3340aad17af1";
const ZERO = "0x0000000000000000000000000000000000000000";
const ROUTE_TRANSITION_TIMEOUT_MS = 20_000;
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
    total_wei: index ? "24217345000000000" : "10000000000000000",
    net_wei: index ? "24217345000000000" : "10000000000000000",
    fees: [],
    start_time: "1",
    end_time: "2000000000",
  },
}));

function listingsFor(family: string | null) {
  if (family !== "gradients" && family !== "pebbles") return listings;
  const contract =
    family === "gradients"
      ? "0x0c58ef43ff3032005e472cb5709f8908acb00205"
      : "0x45882f9bc325e14fbb298a1df930c43a874b83ae";
  return listings.map((item, index) => {
    const token_id = String(family === "pebbles" ? 10000000001 + index : index);
    const asset_key = `1:${contract}:${token_id}`;
    return {
      ...item,
      asset: { ...item.asset, family, contract, token_id, asset_key },
      order: { ...item.order, asset_key },
    };
  });
}

async function waitForCollectClientReady(page: Page) {
  await expect(
    page.getByRole("heading", {
      level: 1,
      name: "Build your collection",
      exact: true,
    })
  ).toHaveAttribute("data-client-ready", "true", {
    timeout: ROUTE_TRANSITION_TIMEOUT_MS,
  });
}

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
          entries: listingsFor(url.searchParams.get("family")),
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
          family: url.searchParams.get("family") ?? "memes",
          snapshot_id: "tdh-fixture",
          catalog_version: catalog.version,
          status: "FRESH",
          coverage_complete: true,
          evaluated_ask_count: 2,
          observed_at: new Date().toISOString(),
          next: null,
          entries: [...listingsFor(url.searchParams.get("family"))]
            .reverse()
            .map((item, index) => ({
              ...item,
              available_quantity: "1",
              purchase_quantity: "1",
              purchase_cost_wei: item.order.total_wei,
              rate_hundredths: index === 0 ? "400" : "100",
              base_tdh_per_day_hundredths: index === 0 ? "400" : "100",
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
    await page.evaluate(() => document.documentElement.scrollWidth)
  ).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
}

async function listingActionsFit(page: Page) {
  await noHorizontalOverflow(page);
  for (const id of [1, 2]) {
    const action = page.getByRole("button", {
      name: `Add Catalog artwork ${id} to selection`,
      exact: true,
    });
    const card = page.locator("article").filter({ has: action });
    const artwork = card.getByRole("img", {
      name: `Catalog artwork ${id}`,
      exact: true,
    });
    await expect
      .poll(() =>
        artwork.evaluate(
          (node) =>
            node instanceof HTMLImageElement &&
            node.complete &&
            node.naturalWidth > 0
        )
      )
      .toBe(true);
    const actionBounds = (await action.boundingBox())!;
    const cardBounds = (await card.boundingBox())!;
    expect(actionBounds.width).toBeGreaterThanOrEqual(44);
    expect(actionBounds.height).toBeGreaterThanOrEqual(44);
    expect(actionBounds.x).toBeGreaterThanOrEqual(cardBounds.x);
    expect(actionBounds.x + actionBounds.width).toBeLessThanOrEqual(
      cardBounds.x + cardBounds.width + 1
    );
    await expect(
      card.getByText(id === 1 ? "0.01 ETH" : "0.0243 ETH", { exact: true })
    ).toBeVisible();
    if (id === 2) {
      const compactBounds = await card
        .getByText("0.0243 ETH", { exact: true })
        .boundingBox();
      expect(compactBounds!.height).toBeLessThanOrEqual(24);
    }
  }
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
  await waitForCollectClientReady(page);
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
  const checkoutSurface = page
    .getByRole("dialog")
    .locator(":scope > div")
    .first();
  const checkoutBounds = await checkoutSurface.evaluate((node) => {
    const rect = node.getBoundingClientRect();
    const style = getComputedStyle(node);
    return {
      x: rect.x,
      y: rect.y,
      width: rect.width,
      height: rect.height,
      position: style.position,
      transform: style.transform,
      className: node.className,
    };
  });
  await info.attach("checkout-bounds", {
    body: JSON.stringify(checkoutBounds),
    contentType: "application/json",
  });
  expect(checkoutBounds.position).toBe("fixed");
  expect(checkoutBounds.x).toBe(0);
  expect(checkoutBounds.y).toBe(0);
  expect(checkoutBounds.width).toBe(page.viewportSize()!.width);
  expect(checkoutBounds.height).toBe(page.viewportSize()!.height);
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
    fullPage: false,
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
  await waitForCollectClientReady(page);
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
  await waitForCollectClientReady(page);
  await expect(
    page.getByRole("form", { name: "Complete a full set", exact: true })
  ).toBeVisible();
  await noHorizontalOverflow(page);
  await page.screenshot({
    path: info.outputPath("collect-default-planner.png"),
    fullPage: true,
  });
  const lowestListings = page.getByRole("button", {
    name: "Lowest listings",
    exact: true,
  });
  await lowestListings.click();
  await expect(lowestListings).toHaveAttribute("aria-pressed", "true", {
    timeout: ROUTE_TRANSITION_TIMEOUT_MS,
  });
  await expect(page.getByText("0.01 ETH", { exact: true })).toBeVisible({
    timeout: ROUTE_TRANSITION_TIMEOUT_MS,
  });
  const priceDisclosure = page
    .getByText("0.0243 ETH", { exact: true })
    .locator("xpath=ancestor::summary");
  const exactPrice = page.getByText("0.024217345 ETH", { exact: true });
  await expect(priceDisclosure).toBeVisible();
  await expect(exactPrice).toBeHidden();
  const viewport = page.viewportSize()!;
  const widths = viewport.width < 640 ? [320, 390] : [viewport.width];
  for (const width of widths) {
    await page.setViewportSize({ ...viewport, width });
    await priceDisclosure.focus();
    await page.keyboard.press("Enter");
    await expect(exactPrice).toBeVisible();
    await listingActionsFit(page);
    await page.screenshot({
      path: info.outputPath(`collect-listing-prices-${width}.png`),
      fullPage: true,
    });
    await priceDisclosure.click();
    await expect(exactPrice).toBeHidden();
  }
  await page.setViewportSize(viewport);
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
  if (page.viewportSize()!.width < 1024) {
    const target = page.getByRole("button", { name: /^Season / });
    await target.click();
    const sheet = page.getByRole("dialog", { name: "Season" });
    await expect(sheet.getByRole("heading", { name: "Season" })).toBeVisible();
    await expect(sheet.getByRole("searchbox")).toHaveCount(0);
    await sheet
      .getByRole("radio", { name: "Season 1" })
      .locator("xpath=..")
      .click();
    await expect(sheet).toHaveCount(0);
    await expect(target).toContainText("Season 1");
    await expect(target).toBeFocused();
  } else {
    const target = page.getByRole("combobox", { name: "Season", exact: true });
    await target.fill("Season 1");
    await target.press("ArrowDown");
    await target.press("Enter");
    await expect(target).toHaveValue("Season 1");
    await expect(target).toBeFocused();
  }
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

test("short set setups gain keyboard scroll clearance", async ({ page }) => {
  await mockCatalog(page);
  for (const intent of ["season", "full_set"] as const) {
    await page.goto(`/collect?collection=memes&intent=${intent}`, {
      waitUntil: "domcontentloaded",
    });
    const formName =
      intent === "season" ? "Complete a season" : "Complete a full set";
    await expect(
      page.getByRole("form", { name: formName, exact: true })
    ).toBeVisible();
    const surface = page
      .getByRole("form", { name: formName, exact: true })
      .locator("xpath=ancestor::div[contains(@class, 'tailwind-scope')][1]");
    const readPadding = () =>
      surface.evaluate((element) =>
        Number.parseFloat(getComputedStyle(element).paddingBottom)
      );
    const restingPadding = await readPadding();
    await page.evaluate(() =>
      document.documentElement.style.setProperty(
        "--native-keyboard-inset-bottom",
        "320px"
      )
    );
    await expect.poll(readPadding).toBeGreaterThan(restingPadding + 300);
  }
});

test("artist choices stay scrollable and searchable on mobile and desktop", async ({
  page,
}, info) => {
  await mockCatalog(page);
  await page.route("**/api/collect/catalog", async (route) => {
    await route.fulfill({
      json: {
        ...catalog,
        artists: Array.from({ length: 30 }, (_, index) => ({
          id: `artist-${index + 1}`,
          name: `Catalog artist ${index + 1}`,
          asset_keys: assets.map((asset) => asset.asset_key),
          collaboration_asset_keys: [],
        })),
      },
    });
  });
  await page.goto("/collect?collection=memes&intent=artist", {
    waitUntil: "domcontentloaded",
  });
  if (page.viewportSize()!.width < 1024) {
    const artist = page.getByRole("button", { name: /^Artist / });
    await artist.click();
    const sheet = page.getByRole("dialog", { name: "Artist" });
    await expect(sheet.getByRole("heading", { name: "Artist" })).toBeVisible();
    const search = sheet.getByRole("combobox", { name: "Search artists" });
    await expect(search).toBeVisible();
    const choices = sheet.getByRole("listbox", { name: "Artist" });
    expect(await choices.getByRole("option").count()).toBeLessThan(30);
    expect(
      await choices.evaluate(
        (element) => element.scrollHeight > element.clientHeight
      )
    ).toBe(true);
    await search.focus();
    await expect(search).toHaveAttribute("aria-expanded", "true");
    await search.press("End");
    await expect(
      choices.getByRole("option", { name: "Catalog artist 30" })
    ).toBeVisible();
    await search.press("Enter");
    await expect(sheet).toHaveCount(0);
    await expect(artist).toContainText("Catalog artist 30");
    await artist.click();
    await search.fill("Catalog artist 30");
    await expect(
      choices.getByRole("option", { name: "Catalog artist 30" })
    ).toBeVisible();
    await page.screenshot({
      path: info.outputPath("collect-artist-sheet.png"),
    });
    await search.fill("not in this catalog");
    await expect(
      sheet.getByText("No matches. Try another name.")
    ).toBeVisible();
    await search.fill("Catalog artist 20");
    await expect(
      choices.getByRole("option", { name: "Catalog artist 30" })
    ).toHaveCount(0);
    await choices
      .getByRole("option", { name: "Catalog artist 20" })
      .click();
    await expect(sheet).toHaveCount(0);
    await expect(artist).toContainText("Catalog artist 20");
    await expect(artist).toBeFocused();
  } else {
    const artist = page.getByRole("combobox", { name: "Artist", exact: true });
    await artist.click();
    const choices = page.getByRole("listbox");
    await expect(choices).toBeVisible();
    expect(
      await choices.evaluate(
        (element) => element.getBoundingClientRect().height
      )
    ).toBeLessThanOrEqual(257);
    await choices
      .getByRole("option", { name: "Catalog artist 30", exact: true })
      .click();
    await expect(artist).toHaveValue("Catalog artist 30");
    await artist.click();
    await artist.fill("Catalog artist 20");
    await expect(
      choices.getByRole("option", { name: "Catalog artist 20", exact: true })
    ).toBeVisible();
  }
  await noHorizontalOverflow(page);
});

test("one collection selector stays available across set, listings and future TDH", async ({
  page,
}, info) => {
  const mutations = await mockCatalog(page);
  await page.goto("/collect?collection=gradients&intent=full_set", {
    waitUntil: "domcontentloaded",
  });
  await waitForCollectClientReady(page);
  const collection = page.getByRole("button", { name: /^Collection\b/ });
  await expect(collection).toContainText("Gradients");
  await expect(
    page.getByRole("textbox", { name: "Copies per NFT", exact: true })
  ).toHaveCount(0);
  await collection.focus();
  await collection.press("Enter");
  const options = page.getByRole("option");
  await expect(options).toHaveText([
    "The Memes",
    "Gradients",
    "Pebbles · NextGen",
  ]);
  await page
    .getByRole("option", { name: "Pebbles · NextGen", exact: true })
    .click();
  await expect(collection).toBeFocused();
  await expect(page).toHaveURL(/collection=pebbles/);
  await expect(
    page.getByRole("form", { name: "Complete a Pebbles set", exact: true })
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Lowest listings", exact: true })
    .click();
  await expect(collection).toContainText("Pebbles · NextGen");
  await page.getByRole("button", { name: "TDH", exact: true }).click();
  await expect(collection).toContainText("Pebbles · NextGen");
  await page
    .getByRole("button", { name: "Reach target TDH", exact: true })
    .click();
  await expect(collection).toContainText("Pebbles · NextGen");
  await expect(
    page.getByRole("form", { name: "Reach target TDH", exact: true })
  ).toBeVisible();
  await expect(page).toHaveURL(/collection=pebbles/);
  await collection.click();
  await page.getByRole("option", { name: "Gradients", exact: true }).click();
  await expect(page).toHaveURL(/collection=gradients/);
  await expect(page).toHaveURL(/view=projection/);
  await expect(
    page.getByRole("form", { name: "Reach target TDH", exact: true })
  ).toBeVisible();
  const viewport = page.viewportSize()!;
  for (const width of viewport.width < 640 ? [320, 390] : [1440]) {
    await page.setViewportSize({ ...viewport, width });
    await noHorizontalOverflow(page);
    await page.screenshot({
      path: info.outputPath(`collect-collection-target-${width}.png`),
      fullPage: true,
    });
  }
  await page
    .getByRole("button", { name: "Complete a set", exact: true })
    .click();
  await expect(collection).toContainText("Gradients");
  await expect(
    page.getByRole("textbox", { name: "Copies per NFT", exact: true })
  ).toHaveCount(0);
  await collection.click();
  await page.getByRole("option", { name: "The Memes", exact: true }).click();
  await expect(
    page.getByRole("textbox", { name: "Copies per NFT", exact: true })
  ).toBeVisible();
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
  await waitForCollectClientReady(page);
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

test("TDH preserves the selected collection and keeps projection as a separate keyboard-accessible view", async ({
  page,
}, info) => {
  const mutations = await mockCatalog(page);
  await page.goto("/collect?intent=lowest&collection=pebbles", {
    waitUntil: "domcontentloaded",
  });
  await waitForCollectClientReady(page);
  const tab = page.getByRole("button", { name: "TDH", exact: true });
  await tab.focus();
  await tab.press("Enter");
  await expect(tab).toHaveAttribute("aria-pressed", "true", {
    timeout: ROUTE_TRANSITION_TIMEOUT_MS,
  });
  await expect(tab).toBeFocused();
  const collection = page.getByRole("button", { name: /^Collection\b/ });
  await expect(collection).toContainText("Pebbles · NextGen");
  await expect(page).toHaveURL(/collection=pebbles/);
  await expect(
    page.getByRole("region", { name: "Lowest cost TDH", exact: true })
  ).toBeVisible({ timeout: ROUTE_TRANSITION_TIMEOUT_MS });
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
  await expect(collection).toContainText("Pebbles · NextGen");
  await expect(page).toHaveURL(/collection=pebbles/);
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
  const viewport = page.viewportSize()!;
  const widths = viewport.width < 640 ? [320, 390] : [viewport.width];
  for (const width of widths) {
    await page.setViewportSize({ ...viewport, width });
    await listingActionsFit(page);
    await page.screenshot({
      path: info.outputPath(`collect-tdh-prices-${width}.png`),
      fullPage: true,
    });
  }
  await page.setViewportSize(viewport);
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
