import type { Locator, Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  seedStagingAccessCookie,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { gotoReady, gotoReadyWithApiResponse } from "../support/routeReadiness";
import { isMobileSurfaceProject } from "../support/surfaceSimulation";
import { installReadonlyMutationGuard } from "../support/readonlyMutationGuard";

const SETTLE_TIMEOUT_MS = 45000;
const NEXTGEN_TOKEN_ID = "10000000315";

const COLLECTION_GRID_WIDTHS = [
  320, 390, 639, 640, 767, 768, 1023, 1024, 1199, 1200, 1279, 1280, 1440, 1600,
  1920,
];

async function readCollectionGrid(item: Locator) {
  return item.evaluate((element) => {
    const grid = element.closest(".tw-grid");
    if (!grid) throw new Error("Expected a collection card grid");
    const rect = grid.getBoundingClientRect();
    const style = getComputedStyle(grid);
    return {
      // Ignore subpixel remainder distribution between equal tracks while
      // retaining every column and its width to the nearest rendered pixel.
      columns: style.gridTemplateColumns
        .split(" ")
        .map((width) => Math.round(Number.parseFloat(width))),
      columnGap: style.columnGap,
      rowGap: style.rowGap,
      left: rect.left,
      width: rect.width,
      cardWidth: Math.round(
        grid.firstElementChild?.getBoundingClientRect().width ?? 0
      ),
    };
  });
}

async function readSettledCollectionGrid(item: Locator) {
  let latest = await readCollectionGrid(item);
  let previous: string | undefined;
  await expect
    .poll(async () => {
      latest = await readCollectionGrid(item);
      const current = JSON.stringify(latest);
      const settled = current === previous;
      previous = current;
      return settled;
    })
    .toBe(true);
  return latest;
}

async function isAnyVisible(locator: Locator) {
  const count = await locator.count();
  for (let index = 0; index < Math.min(count, 8); index++) {
    if (
      await locator
        .nth(index)
        .isVisible()
        .catch(() => false)
    ) {
      return true;
    }
  }
  return false;
}

async function expectAnyVisible(
  candidates: Locator[],
  message: string,
  timeout = SETTLE_TIMEOUT_MS
) {
  await expect
    .poll(
      async () => {
        for (const candidate of candidates) {
          if (await isAnyVisible(candidate)) {
            return true;
          }
        }
        return false;
      },
      { message, timeout }
    )
    .toBe(true);
}

async function expectCardsOrEmpty(
  page: Page,
  cardLocator: Locator,
  message: string
) {
  await expect
    .poll(
      async () => {
        if (await isAnyVisible(cardLocator)) {
          return "cards";
        }
        if (
          await page
            .getByText(/Nothing here yet|No .+ found/i)
            .first()
            .isVisible()
            .catch(() => false)
        ) {
          return "empty";
        }
        return "waiting";
      },
      { message, timeout: SETTLE_TIMEOUT_MS }
    )
    .toMatch(/^(cards|empty)$/);
  await expectNoHorizontalOverflow(page);
}

function mainButton(page: Page, name: string) {
  return page.locator("main").getByRole("button", { name });
}

function nextGenSectionLink(page: Page, name: string) {
  return page
    .getByRole("navigation", { name: "NextGen sections" })
    .getByRole("link", { name, exact: true });
}

function detailButton(page: Page, name: string) {
  return mainButton(page, name).last();
}

// Empty when the filters wrap flush with the title and, from 390px, share one
// row; otherwise a description of the misalignment. Tolerance is half a pixel.
async function filterAlignmentProblem(
  title: Locator,
  collection: Locator,
  activity: Locator,
  width: number
) {
  const titleBounds = await title.boundingBox();
  const collectionBounds = await collection.boundingBox();
  if (!titleBounds || !collectionBounds)
    return "title or filter is not laid out";
  if (
    collectionBounds.y >= titleBounds.y + titleBounds.height &&
    Math.abs(collectionBounds.x - titleBounds.x) >= 0.5
  ) {
    return `wrapped filters start at x=${collectionBounds.x}, title at x=${titleBounds.x}`;
  }
  if (width >= 390) {
    const activityBounds = await activity.boundingBox();
    if (!activityBounds) return "activity filter is not laid out";
    if (Math.abs(collectionBounds.y - activityBounds.y) >= 0.5) {
      return `filters sit on different rows: y=${collectionBounds.y} and y=${activityBounds.y}`;
    }
  }
  return "";
}

async function expectCollectionTitle(
  page: Page,
  projectName: string,
  title: string
) {
  if (isMobileSurfaceProject(projectName)) {
    await expect(
      page.getByRole("button", { name: `Collection: ${title}` })
    ).toBeVisible();
    return;
  }

  await expect(page.getByRole("heading", { name: title })).toBeVisible();
}

test.describe("NextGen and collections read-only coverage @surface @medium @large @readonly", () => {
  test("NFT activity filters fit narrow screens without resizing", async ({
    page,
  }) => {
    await gotoReady(page, "/nft-activity");
    const collection = page.getByRole("button", {
      name: "Collection: All Collections",
      exact: true,
    });
    const activity = page.getByRole("button", {
      name: "Activity type: All activity",
      exact: true,
    });
    const title = page.getByRole("heading", {
      level: 1,
      name: "NFT Activity",
      exact: true,
    });
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      for (const trigger of [collection, activity]) {
        await expect(trigger).toBeInViewport({ ratio: 1 });
        await expect(trigger).toHaveCSS("height", "36px");
        await expect(trigger).toHaveCSS("font-size", "12px");
      }
      await expectNoHorizontalOverflow(page);
      // The filter row switches between its desktop and mobile alignment when
      // the page re-renders after the resize, so wait for the layout to settle.
      await expect
        .poll(
          () => filterAlignmentProblem(title, collection, activity, width),
          {
            message: `NFT activity filters align with the title at ${width}px`,
          }
        )
        .toBe("");
    }
  });

  test("NextGen landing exposes public collection navigation", async ({
    page,
  }) => {
    await gotoReady(page, "/nextgen");

    await expect(page).toHaveTitle(/NextGen/);
    await expect(
      page.getByRole("navigation", { name: "NextGen sections" })
    ).toBeVisible();
    await expect(
      page
        .locator("main")
        .getByRole("heading", { level: 1, name: "Pebbles", exact: true })
    ).toBeVisible();
    for (const item of ["Collections", "Artists", "About"]) {
      await expect(nextGenSectionLink(page, item)).toBeVisible();
    }
    await expect(
      page.getByRole("link", { name: "Explore Collection" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Featured Artist" })
    ).toBeVisible();
  });

  test("NextGen about page keeps product context readable", async ({
    page,
  }) => {
    await gotoReady(page, "/nextgen/about");

    await expect(page).toHaveTitle(/About.*NextGen|NextGen/);
    await expectAnyVisible(
      [
        page.getByRole("heading", { name: /About NextGen/i }),
        page.getByText("on-chain generative art NFT contract"),
      ],
      "Expected the NextGen about page to render explanatory content"
    );
  });

  test("NextGen collections list settles with public collection cards", async ({
    page,
  }) => {
    const response = await gotoReadyWithApiResponse(
      page,
      "/nextgen/collections",
      (url) => url.pathname === "/api/nextgen/collections"
    );
    const body = (await response.json()) as { data?: unknown };
    expect(Array.isArray(body.data)).toBe(true);

    await expect(
      page.getByRole("heading", { level: 1, name: "Collections" })
    ).toBeVisible();
    const statusFilter = page.getByRole("button", {
      name: "Filter collections by status",
    });
    await expect(statusFilter).toBeVisible();
    await expect(statusFilter).toHaveText("All statuses");
    await expectCardsOrEmpty(
      page,
      page.locator('main a[href*="/nextgen/collection/"]'),
      "Expected NextGen collections to settle with cards or an empty state"
    );

    await expect(statusFilter).toHaveCSS("height", "40px");
    expect(
      await statusFilter.evaluate(
        (button) => button.getBoundingClientRect().width
      )
    ).toBeLessThan(224);
    await statusFilter.click();
    const menu = page.getByRole("menu").filter({
      has: page.getByRole("menuitem", { name: "All statuses", exact: true }),
    });
    const rows = menu.getByRole("menuitem");
    await expect(rows).toHaveText([
      "All statuses",
      "Live",
      "Upcoming",
      "Completed",
    ]);
    await expect(rows.first()).toHaveAttribute("aria-current", "true");
    const columns = await rows.evaluateAll((options) =>
      options.map((option) => option.getBoundingClientRect().left)
    );
    expect(new Set(columns).size).toBe(1);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    await expect(statusFilter).toBeFocused();
  });

  test("NextGen collection detail tabs remain navigable", async ({ page }) => {
    await gotoReady(page, "/nextgen/collection/pebbles");

    await expect(page).toHaveTitle(/Pebbles.*NextGen/);
    await expect(
      page.getByRole("heading", { level: 1, name: /^Pebbles by/ })
    ).toBeVisible();
    for (const tab of ["Overview", "About", "Provenance", "Trait Sets"]) {
      await expect(detailButton(page, tab)).toBeVisible();
    }

    await detailButton(page, "About").click();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/nextgen/collection/pebbles/about"
    );

    await detailButton(page, "Trait Sets").click();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/nextgen/collection/pebbles/top-trait-sets"
    );
  });

  test("NextGen collection art page exposes token browse links", async ({
    isMobile,
    page,
  }, testInfo) => {
    await gotoReady(page, "/nextgen/collection/pebbles/art");

    await expect(page).toHaveTitle(/Art.*Pebbles|Pebbles.*Art|Pebbles/);
    await expect(page.getByRole("heading", { name: "The Art" })).toBeVisible();
    const sort = page.getByRole("button", { name: /^Sort:/ });
    await expect(sort).toBeVisible();
    await expect(sort).toHaveCSS("height", "40px");
    if (!isMobile) {
      for (const name of ["Sort ascending", "Sort descending"]) {
        const direction = page.getByRole("button", { name, exact: true });
        await expect(direction).toHaveCSS("height", "36px");
        await expect(direction).toHaveCSS("width", "36px");
        await expect(
          page.getByRole("button", { name, exact: true }).locator("..")
        ).toHaveCSS("height", "40px");
      }
    }
    await expectCardsOrEmpty(
      page,
      page.locator('main a[href*="/nextgen/token/"]'),
      "Expected NextGen collection art to settle with token links or an empty state"
    );
    const listingStatus = page.getByRole("combobox", {
      name: "Listing status",
    });
    if (testInfo.project.name === "capacitor-ios-sim") {
      await expect(listingStatus).toHaveCount(0);
    } else {
      await expect(listingStatus).toBeVisible();
      await expect(listingStatus).toHaveValue("All");
      await listingStatus.scrollIntoViewIfNeeded();
      const coversControl = await listingStatus.evaluate((select) => {
        const bounds = select.closest("label")!.getBoundingClientRect();
        return [
          [bounds.left + 4, bounds.top + bounds.height / 2],
          [bounds.right - 4, bounds.top + bounds.height / 2],
          [bounds.left + bounds.width / 2, bounds.top + 4],
          [bounds.left + bounds.width / 2, bounds.bottom - 4],
        ].every(([x, y]) => document.elementFromPoint(x!, y!) === select);
      });
      expect(coversControl).toBe(true);
    }
    await sort.click();
    const idOption = page.getByRole("button", { name: "ID", exact: true });
    await expect(idOption).toBeVisible();
    const optionBounds = (await idOption.boundingBox())!;
    expect(optionBounds.x).toBeGreaterThanOrEqual(0);
    expect(optionBounds.x + optionBounds.width).toBeLessThanOrEqual(
      page.viewportSize()!.width
    );
    await sort.press("Escape");
    await expect(idOption).toHaveCount(0);
  });

  test("NextGen token detail exposes read-only detail sections", async ({
    page,
  }) => {
    await gotoReady(page, `/nextgen/token/${NEXTGEN_TOKEN_ID}`);

    await expect(page).toHaveTitle(/NextGen|Pebbles|#/);
    for (const tab of ["About", "Provenance", "Display Center", "Rarity"]) {
      await expect(detailButton(page, tab)).toBeVisible();
    }

    await detailButton(page, "Rarity").click();
    await expect(page).toHaveURL(
      (url) => url.pathname === `/nextgen/token/${NEXTGEN_TOKEN_ID}/rarity`
    );
    await waitForRouteReady(page);
    await expect(detailButton(page, "Rarity")).toBeVisible();
  });

  test("The Memes browse page keeps public cards reachable", async ({
    page,
  }, testInfo) => {
    await gotoReady(page, "/the-memes");

    await expect(page).toHaveTitle("The Memes | Collections");
    await expectCollectionTitle(page, testInfo.project.name, "The Memes");
    await expect(
      page.getByRole("region", { name: "Meme sorting" })
    ).toBeVisible();
    await expectCardsOrEmpty(
      page,
      page.getByRole("link", { name: /^View .+, card #\d+/ }),
      "Expected The Memes to settle with cards or an empty state"
    );
  });

  for (const { name, widths } of [
    { name: "phone", widths: [320, 390, 639] },
    { name: "tablet", widths: [640, 767, 768, 1023] },
    { name: "desktop", widths: [1024, 1279, 1280, 1440, 1600, 1920] },
  ]) {
    test(`The Memes refresh skeleton matches the ${name} card grid`, async ({
      browser,
      page,
      baseURL,
    }, testInfo) => {
      // Without scripts, the real streamed route fallback stays visible instead
      // of being replaced by React. No application markup or data is mocked.
      const { userAgent, isMobile, hasTouch } = testInfo.project.use;
      const loadingContext = await browser.newContext({
        ...(baseURL === undefined ? {} : { baseURL }),
        javaScriptEnabled: false,
        viewport: page.viewportSize(),
        ...(userAgent === undefined ? {} : { userAgent }),
        isMobile: isMobile ?? false,
        hasTouch: hasTouch ?? false,
      });
      try {
        await seedStagingAccessCookie(loadingContext, baseURL);
        const guard = await installReadonlyMutationGuard(
          loadingContext,
          baseURL
        );
        const loadingPage = await loadingContext.newPage();
        const path = "/the-memes?sort=age&sort_dir=asc";
        await loadingPage.goto(path, { waitUntil: "domcontentloaded" });
        await expect(
          loadingPage.getByTestId("the-memes-loading-skeleton")
        ).toBeVisible({ timeout: SETTLE_TIMEOUT_MS });
        await gotoReady(page, path);
        const firstCard = page
          .getByRole("link", { name: /^View .+, card #\d+/ })
          .first();
        await expect(firstCard).toBeVisible({ timeout: SETTLE_TIMEOUT_MS });

        const measurements = [];
        for (const width of widths) {
          await loadingPage.setViewportSize({ width, height: 1000 });
          await page.setViewportSize({ width, height: 1000 });
          const skeleton = await loadingPage
            .getByTestId("the-memes-loading-skeleton")
            .locator(".tw-grid")
            .evaluate((grid) => {
              const rect = grid.getBoundingClientRect();
              const style = getComputedStyle(grid);
              return {
                columns: style.gridTemplateColumns,
                gap: style.columnGap,
                width: rect.width,
                left: rect.left,
              };
            });
          // The script-free shell retains its initial navigation gutter on
          // phones. Compare column count/gap there; desktop also verifies exact
          // track widths and position, where the shell is the same in both states.
          const expectedGrid = {
            columnCount: skeleton.columns.split(" ").length,
            gap: skeleton.gap,
          };
          await expect
            .poll(async () =>
              firstCard.evaluate((card) => {
                const grid = card.parentElement!;
                const style = getComputedStyle(grid);
                return {
                  columnCount: style.gridTemplateColumns.split(" ").length,
                  gap: style.columnGap,
                };
              })
            )
            .toEqual(expectedGrid);
          if (width >= 1024) {
            const loaded = await firstCard.evaluate((card) => {
              const grid = card.parentElement!;
              const rect = grid.getBoundingClientRect();
              const style = getComputedStyle(grid);
              return {
                columns: style.gridTemplateColumns,
                gap: style.columnGap,
                width: rect.width,
                left: rect.left,
              };
            });
            expect(loaded).toEqual(skeleton);
          }
          await expectNoHorizontalOverflow(loadingPage);
          await expectNoHorizontalOverflow(page);
          measurements.push({ viewport: width, ...skeleton });
          if (width === 390 || width === 1600) {
            const loadingScreenshot = testInfo.outputPath(
              `loading-${width}.png`
            );
            const loadedScreenshot = testInfo.outputPath(`loaded-${width}.png`);
            await loadingPage.screenshot({ path: loadingScreenshot });
            await page.screenshot({ path: loadedScreenshot });
            await testInfo.attach(`loading-grid-${width}`, {
              path: loadingScreenshot,
              contentType: "image/png",
            });
            await testInfo.attach(`loaded-grid-${width}`, {
              path: loadedScreenshot,
              contentType: "image/png",
            });
          }
        }
        await loadingPage.reload({ waitUntil: "domcontentloaded" });
        await expect(
          loadingPage.getByTestId("the-memes-loading-skeleton")
        ).toBeVisible();
        guard.assertNoBlockedRequests();
        await testInfo.attach("responsive-grid-measurements", {
          body: JSON.stringify(measurements, null, 2),
          contentType: "application/json",
        });
      } finally {
        await loadingContext.close();
      }
    });
  }

  for (const collection of [
    {
      name: "Gradient",
      path: "/6529-gradient?sort=id&sort_dir=asc",
      apiPath: "/api/nfts/gradients",
      cardName: null,
      collectionView: false,
    },
    {
      name: "Meme Lab",
      path: "/meme-lab",
      apiPath: "/api/nfts_memelab",
      cardName: /^View .+, Meme Lab card #\d+/,
      collectionView: false,
    },
    {
      name: "Meme Lab collection",
      path: "/meme-lab?sort=collections",
      apiPath: "/api/lab_extended_data",
      cardName: /^View .+, Meme Lab card #\d+/,
      collectionView: true,
    },
    {
      name: "ReMemes",
      path: "/rememes",
      apiPath: "/api/rememes",
      cardName: /^View .+, ReMeme #\d+/,
      collectionView: false,
    },
  ]) {
    test(`${collection.name} loading skeleton matches the responsive card grid`, async ({
      page,
    }, testInfo) => {
      let release = () => {};
      const gate = new Promise<void>((resolve) => {
        release = resolve;
      });
      const matchesRequest = (url: URL) =>
        url.pathname === collection.apiPath &&
        (!collection.collectionView || url.searchParams.has("collection"));
      await page.route(matchesRequest, async (route) => {
        // Fetch real data immediately, holding only its delivery to the page.
        const response = await route.fetch();
        await gate;
        await route.fulfill({ response });
      });
      const pendingRequest = page.waitForRequest((request) =>
        matchesRequest(new URL(request.url()))
      );
      try {
        await gotoReady(page, collection.path);
        if (collection.collectionView) {
          // Discover a real published collection instead of relying on a slug
          // whose availability may differ between staging and production.
          const collectionLink = page
            .getByRole("link", { name: /^View .+ collection$/ })
            .first();
          await expect(collectionLink).toBeVisible({
            timeout: SETTLE_TIMEOUT_MS,
          });
          await collectionLink.click();
        }
        await pendingRequest;
        const skeleton = page.getByTestId("collection-grid-skeleton");
        await expect(skeleton).toBeVisible();
        await expect(skeleton).toHaveAttribute("aria-hidden", "true");
        const measurements = [];
        for (const width of COLLECTION_GRID_WIDTHS) {
          await page.setViewportSize({ width, height: 1000 });
          const grid = await readSettledCollectionGrid(skeleton);
          measurements.push({ viewport: width, grid });
          await expectNoHorizontalOverflow(page);
          if (width === 390 || width === 1600) {
            const path = testInfo.outputPath(`loading-${width}.png`);
            await page.screenshot({ path });
            await testInfo.attach(`loading-grid-${width}`, {
              path,
              contentType: "image/png",
            });
          }
        }
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect(skeleton).toHaveCSS("animation-name", "none");
        release();
        await expect(skeleton).toBeHidden({ timeout: SETTLE_TIMEOUT_MS });
        const firstCard =
          collection.cardName === null
            ? page
                .getByRole("main")
                .locator('a[href^="/6529-gradient/"]')
                .first()
            : page.getByRole("link", { name: collection.cardName }).first();
        await expect(firstCard).toBeVisible({ timeout: SETTLE_TIMEOUT_MS });
        for (const { viewport: width, grid } of measurements) {
          await page.setViewportSize({ width, height: 1000 });
          await expect.poll(() => readCollectionGrid(firstCard)).toEqual(grid);
          await expectNoHorizontalOverflow(page);
          if (width === 390 || width === 1600) {
            const path = testInfo.outputPath(`loaded-${width}.png`);
            await page.screenshot({ path });
            await testInfo.attach(`loaded-grid-${width}`, {
              path,
              contentType: "image/png",
            });
          }
        }
        await testInfo.attach("responsive-grid-measurements", {
          body: JSON.stringify(measurements, null, 2),
          contentType: "application/json",
        });
      } finally {
        release();
        await page.unrouteAll({ behavior: "wait" });
      }
    });
  }

  test("Meme Lab browse page keeps public cards reachable", async ({
    page,
  }, testInfo) => {
    await gotoReady(page, "/meme-lab");

    await expect(page).toHaveTitle("Meme Lab | Collections");
    await expectCollectionTitle(page, testInfo.project.name, "Meme Lab");
    await expect(
      page.getByRole("region", { name: "Meme Lab sorting" })
    ).toBeVisible();
    await expectCardsOrEmpty(
      page,
      page.getByRole("link", { name: /^View .+, Meme Lab card #\d+/ }),
      "Expected Meme Lab to settle with cards or an empty state"
    );
  });

  test("Meme Lab pagination keeps keyboard focus through loading", async ({
    page,
  }) => {
    let releasePage = () => {};
    const pageGate = new Promise<void>((resolve) => {
      releasePage = resolve;
    });
    await page.route(
      (url) =>
        url.pathname === "/api/nfts_memelab" &&
        url.searchParams.get("page") === "2",
      async (route) => {
        await pageGate;
        await route.fallback();
      }
    );

    try {
      await gotoReady(page, "/meme-lab");
      const results = page.getByRole("region", { name: "Meme Lab cards" });
      const status = page.getByRole("main").getByRole("status");
      const next = results.getByRole("button", { name: "Next page" });
      await expect(next).toBeEnabled({ timeout: SETTLE_TIMEOUT_MS });
      await next.focus();
      await next.press("Enter");

      await expect(results).toBeFocused();
      await expect(results).toHaveAttribute("aria-busy", "true");
      await expect(status).toHaveText("Fetching");

      releasePage();
      await expect(results).toHaveAttribute("aria-busy", "false", {
        timeout: SETTLE_TIMEOUT_MS,
      });
      await expect(status).toHaveText(/^Page 2 of /);
      await expect(results).toBeFocused();
      await page.keyboard.press("Tab");
      await expect(
        results
          .getByRole("link", { name: /^View .+, Meme Lab card #\d+/ })
          .first()
      ).toBeFocused();
    } finally {
      releasePage();
    }
  });

  test("6529 Gradient browse page keeps public cards reachable", async ({
    page,
  }, testInfo) => {
    await gotoReady(page, "/6529-gradient?sort=id&sort_dir=asc");

    await expect(page).toHaveTitle("6529 Gradient | Collections");
    await expectCollectionTitle(page, testInfo.project.name, "6529 Gradient");
    await expect(
      page.getByRole("region", { name: "Gradient sorting" })
    ).toBeVisible();
    await expectCardsOrEmpty(
      page,
      page.locator('main a[href*="/6529-gradient/"]'),
      "Expected 6529 Gradient to settle with cards or an empty state"
    );
  });

  test("ReMemes browse page keeps public filters and cards reachable", async ({
    page,
  }) => {
    await gotoReadyWithApiResponse(
      page,
      "/rememes",
      (url) => url.pathname === "/api/rememes"
    );

    await expect(page).toHaveTitle("ReMemes | Collections");
    await expectAnyVisible(
      [
        page.getByAltText("ReMemes"),
        page.getByRole("button", { name: "Collection: ReMemes" }),
      ],
      "Expected ReMemes collection header to render"
    );
    for (const filter of [/^Sort:/, /^Token Type:/, /^Meme Reference:/]) {
      await expect(page.getByRole("button", { name: filter })).toBeVisible();
    }
    await expect(
      page.getByRole("link", { name: "Add ReMeme" })
    ).toHaveAttribute("href", "/rememes/add");
    await expectCardsOrEmpty(
      page,
      page.getByRole("link", { name: /^View .+, ReMeme #\d+/ }),
      "Expected ReMemes to settle with cards or an empty state"
    );
  });
});
