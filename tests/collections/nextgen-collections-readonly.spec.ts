import type { Locator, Page } from "@playwright/test";

import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { isMobileSurfaceProject } from "../support/surfaceSimulation";

const SETTLE_TIMEOUT_MS = 45000;
const RESPONSE_TIMEOUT_MS = 20000;
const NEXTGEN_TOKEN_ID = "10000000315";

type ApiResponseMatcher = (url: URL) => boolean;

async function gotoReady(page: Page, path: string) {
  await page.goto(path, { waitUntil: "domcontentloaded" });
  await waitForRouteReady(page);
  await expectNoHorizontalOverflow(page);
  await expect(page).not.toHaveTitle("404 | PAGE NOT FOUND");
}

async function waitForApiResponse(page: Page, matches: ApiResponseMatcher) {
  const response = await page.waitForResponse(
    (candidate) => {
      try {
        return matches(new URL(candidate.url()));
      } catch {
        return false;
      }
    },
    { timeout: RESPONSE_TIMEOUT_MS }
  );
  expect(response.ok(), `${response.url()} returned ${response.status()}`).toBe(
    true
  );
  return response;
}

async function gotoReadyWithApiResponse(
  page: Page,
  path: string,
  matches: ApiResponseMatcher
) {
  const responsePromise = waitForApiResponse(page, matches);
  await gotoReady(page, path);
  return responsePromise;
}

async function isAnyVisible(locator: Locator) {
  const count = await locator.count();
  for (let index = 0; index < Math.min(count, 8); index++) {
    if (await locator.nth(index).isVisible().catch(() => false)) {
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
}

function mainButton(page: Page, name: string) {
  return page.locator("main").getByRole("button", { name });
}

function detailButton(page: Page, name: string) {
  return mainButton(page, name).last();
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
  test("NextGen landing exposes public collection navigation", async ({
    page,
  }) => {
    await gotoReady(page, "/nextgen");

    await expect(page).toHaveTitle(/NextGen/);
    await expectAnyVisible(
      [
        page.getByAltText("nextgen"),
        page.getByRole("button", { name: "Collections" }),
      ],
      "Expected the NextGen header to render"
    );
    await expect(
      page.locator("main").getByRole("heading", { name: "Featured" }).first()
    ).toBeVisible();
    for (const item of ["Collections", "Artists", "About"]) {
      await expect(mainButton(page, item).first()).toBeVisible();
    }
    await expect(
      page.getByRole("button", { name: "Explore Collection" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Featured Artist" })
    ).toBeVisible();
  });

  test("NextGen about page keeps product context readable", async ({ page }) => {
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
    await expect(
      page.getByRole("button", { name: "Status: ALL" })
    ).toBeVisible();
    await expectCardsOrEmpty(
      page,
      page.locator('main a[href*="/nextgen/collection/"]'),
      "Expected NextGen collections to settle with cards or an empty state"
    );
  });

  test("NextGen collection detail tabs remain navigable", async ({ page }) => {
    await gotoReady(page, "/nextgen/collection/pebbles");

    await expect(page).toHaveTitle(/Pebbles.*NextGen/);
    await expect(
      page.getByText("Pebbles", { exact: true }).first()
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
    page,
  }) => {
    await gotoReady(page, "/nextgen/collection/pebbles/art");

    await expect(page).toHaveTitle(/Art.*Pebbles|Pebbles.*Art|Pebbles/);
    await expect(page.getByRole("heading", { name: "The Art" })).toBeVisible();
    await expect(page.getByRole("button", { name: /^Sort:/ })).toBeVisible();
    await expectCardsOrEmpty(
      page,
      page.locator('main a[href*="/nextgen/token/"]'),
      "Expected NextGen collection art to settle with token links or an empty state"
    );
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

    await expect(page).toHaveTitle("The Memes");
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

  test("Meme Lab browse page keeps public cards reachable", async ({
    page,
  }, testInfo) => {
    await gotoReady(page, "/meme-lab");

    await expect(page).toHaveTitle("Meme Lab");
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

  test("6529 Gradient browse page keeps public cards reachable", async ({
    page,
  }, testInfo) => {
    await gotoReady(page, "/6529-gradient?sort=id&sort_dir=asc");

    await expect(page).toHaveTitle("6529 Gradient");
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
    await gotoReady(page, "/rememes");

    await expect(page).toHaveTitle("ReMemes | Collections");
    await expectAnyVisible(
      [page.getByAltText("ReMemes"), page.getByText("ReMemes", { exact: true })],
      "Expected ReMemes title or logo to render"
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
