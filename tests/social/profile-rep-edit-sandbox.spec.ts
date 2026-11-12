import type { Page } from "@playwright/test";
import type { ApiGlobalRepCategoryOverview } from "@/generated/models/ApiGlobalRepCategoryOverview";
import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
} from "../testHelpers";
import {
  getSandboxApiOrigin,
  hideNextDevOverlay,
  LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  useLocalSandboxMutationGuard,
} from "../support/localSandbox";

const TARGET = "following-artist-0";
const CATEGORY = "Artist";

async function seedSession(page: Page, role: string | null) {
  const address = "0x0000000000000000000000000000000000000529";
  const jwt = [
    Buffer.from(JSON.stringify({ alg: "none", typ: "JWT" })).toString(
      "base64url"
    ),
    Buffer.from(
      JSON.stringify({ sub: address, role, exp: 2000000000 })
    ).toString("base64url"),
    "",
  ].join(".");
  await page.addInitScript(
    ({ address, jwt, role }) => {
      document.cookie = "essential-cookies-consent=true; path=/";
      document.cookie = "performance-cookies-consent=false; path=/";
      localStorage.setItem("6529-wallet-active-address", address);
      localStorage.setItem(
        "6529-wallet-accounts",
        JSON.stringify([
          {
            address,
            jwt,
            role,
            refreshToken: null,
            authSessionVersion: "v2",
            profileId: "00000000-0000-4000-8000-000000000531",
            profileHandle: "playwright",
          },
        ])
      );
    },
    { address, jwt, role }
  );
}

async function installCategories(page: Page, api: string) {
  await page.route(`${api}/api/**identities/*/subscriptions`, (route) =>
    route.fulfill({ json: { actions: [] } })
  );
  await page.route(
    `${api}/api/profiles/*/rep/categories/*/contributors?*`,
    (route) =>
      route.fulfill({
        json: {
          data: [
            {
              profile: {
                id: "00000000-0000-4000-8000-000000000531",
                handle: "playwright",
                primary_address: "0x0000000000000000000000000000000000000529",
                pfp: "/icon-512.png",
              },
              contribution: 20,
            },
            {
              profile: {
                id: "other-rater",
                handle: "other-rater",
                primary_address: "0x0000000000000000000000000000000000000530",
                pfp: "/icon-512.png",
              },
              contribution: 10,
            },
          ],
          page: 1,
          next: false,
        },
      })
  );
  await page.route(`${api}/api/profiles/*/rep/categories?*`, (route) =>
    route.fulfill({
      json: {
        data: [
          {
            category: CATEGORY,
            total_rep: 20,
            contributor_count: 1,
            authenticated_user_contribution: 20,
            top_contributors: [],
          },
        ],
        page: 1,
        next: false,
        count: 1,
      },
    })
  );
  await page.route(`${api}/api/profiles/*/rep/overview*`, (route) =>
    route.fulfill({
      json: {
        total_rep: 20,
        authenticated_user_contribution: 20,
        contributor_count: 1,
        contributors: { data: [], page: 1, next: false, count: 0 },
      },
    })
  );
}

async function openProfile(page: Page, role: string | null = null) {
  await seedSession(page, role);
  await page.goto(`/${TARGET}`, { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("button", {
      name: "Grant Rep",
      exact: true,
    })
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
}

async function openOwnerProfile(page: Page) {
  // Start a new document to clear query memory. Enter the owner profile through
  // the hydrated shell; direct owner loads have a separate hydration mismatch.
  const profileLoaded = page.waitForResponse((response) =>
    new URL(response.url()).pathname.endsWith(
      "/identities/0x0000000000000000000000000000000000000529"
    )
  );
  await page.goto("/about", { waitUntil: "domcontentloaded" });
  await profileLoaded;
  if ((page.viewportSize()?.width ?? 0) < 1024)
    await page.getByRole("button", { name: "Open menu", exact: true }).click();
  const nativeProfileLink = page.getByRole("link", {
    name: "Open playwright profile",
    exact: true,
  });
  const accountMenu = page.getByRole("button", {
    name: "Open account and profiles menu",
    exact: true,
  });
  await expect(nativeProfileLink.or(accountMenu)).toBeVisible();
  if (await nativeProfileLink.isVisible()) await nativeProfileLink.click();
  else {
    await accountMenu.press("Enter");
    const ownerLink = page.getByRole("link", { name: "Profile", exact: true });
    await expect(ownerLink).toHaveAttribute("href", "/playwright");
    await ownerLink.click();
  }
  await page.waitForURL(/\/playwright$/, {
    waitUntil: "domcontentloaded",
    timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
  });
  await expect(
    page.getByRole("navigation", { name: "Profile sections" })
  ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
}

function categoryPanel(page: Page) {
  return page
    .getByRole("region", { name: `${CATEGORY} REP details`, exact: true })
    .or(
      page
        .getByRole("dialog", { name: CATEGORY, exact: true })
        .locator(".mobile-wrapper-dialog")
    );
}

async function expectDesktopRatingPosition(page: Page, name: string) {
  const viewport = page.viewportSize();
  if (!viewport || viewport.width < 768) return;
  const panel = page
    .getByRole("dialog", { name, exact: true })
    .locator(".mobile-wrapper-dialog");
  await expect
    .poll(async () => {
      const box = await panel.boundingBox();
      return box ? Math.abs(box.y - viewport.height * 0.14) : Infinity;
    })
    .toBeLessThanOrEqual(1);
  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.height).toBeLessThanOrEqual(viewport.height * 0.86 - 24 + 1);
    expect(box.y + box.height).toBeLessThanOrEqual(viewport.height - 24 + 1);
  }
}

async function expectDesktopTagJoin(page: Page, category: string) {
  const tag = page
    .getByRole("button", {
      name: `Open REP category ${category}`,
      exact: true,
    })
    .filter({ visible: true });
  const panel = page.getByRole("region", {
    name: `${category} REP details`,
    exact: true,
  });
  await expect(panel).toBeVisible();
  await expect(tag).toHaveAttribute("aria-expanded", "true");
  await expect(tag.getByRole("region")).toHaveCount(0);
  const tagBox = await tag.boundingBox();
  const panelBox = await panel.boundingBox();
  const bridgeBox = await page
    .getByRole("region", { name: `${category} REP details`, exact: true })
    .locator(':scope > span[aria-hidden="true"]')
    .boundingBox();
  expect(tagBox).not.toBeNull();
  expect(panelBox).not.toBeNull();
  expect(bridgeBox).not.toBeNull();
  if (tagBox && panelBox && bridgeBox) {
    expect(panelBox.y - tagBox.y - tagBox.height).toBeCloseTo(8, 0);
    expect(panelBox.width).toBeGreaterThan(tagBox.width);
    expect(bridgeBox.x).toBeCloseTo(tagBox.x, 0);
    expect(bridgeBox.width).toBeCloseTo(tagBox.width, 0);
    expect(bridgeBox.y).toBeCloseTo(tagBox.y + tagBox.height, 0);
    expect(bridgeBox.height).toBe(8);
  }
  for (const surface of [tag, panel]) {
    await expect(surface).toHaveCSS("border-top-width", "0px");
    await expect(surface).toHaveCSS("--tw-ring-shadow", "0 0 #0000");
  }
}

const allowance = {
  rep_rates_left_for_rater: 80,
  rating_stats: [
    {
      category: CATEGORY,
      rating: 20,
      contributor_count: 1,
      rater_contribution: 20,
    },
  ],
};

test.describe("Profile REP edit dialog @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "REP edits require the local mock API runner."
  );

  test.beforeEach(async ({ page, context, baseURL }) => {
    await hideNextDevOverlay(context);
    await installCategories(page, getSandboxApiOrigin(baseURL));
  });

  test("loads an inline contribution, restores category focus, and saves the desired total", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    let release: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    let rating = 20;
    const saved: unknown[] = [];
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      async (route) => {
        await ready;
        await route.fulfill({
          json: {
            ...allowance,
            rating_stats: [
              { ...allowance.rating_stats[0], rater_contribution: rating },
            ],
          },
        });
      }
    );
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/rating`,
      async (route) => {
        const body = route.request().postDataJSON();
        saved.push(body);
        rating = body.amount;
        await route.fulfill({ json: {} });
      }
    );
    await openProfile(page);
    const repSummary = page
      .getByRole("region", { name: "REP", exact: true })
      .filter({ visible: true });
    const assigned = repSummary.getByText(/^You assigned:/);
    await expect(assigned).toHaveText("You assigned: 20");
    if (isMobile) {
      await expect(assigned).toHaveCSS("white-space", "nowrap");
      const assignedBox = await assigned.boundingBox();
      const grantBox = await repSummary
        .getByRole("button", { name: "Grant Rep", exact: true })
        .boundingBox();
      expect(assignedBox).not.toBeNull();
      expect(grantBox).not.toBeNull();
      if (assignedBox && grantBox) {
        expect(assignedBox.y + assignedBox.height / 2).toBeCloseTo(
          grantBox.y + grantBox.height / 2,
          0
        );
      }
    }
    await expect(
      page.getByRole("button", { name: /^Edit REP category/ })
    ).toHaveCount(0);
    const categoryToggle = page.getByRole("button", {
      name: `Open REP category ${CATEGORY}`,
      exact: true,
    });
    await categoryToggle.click();
    const panel = categoryPanel(page);
    await expect(panel.getByText(/^\d+ raters?$/, { exact: true })).toHaveCount(
      0
    );
    if (isMobile) {
      const closeButton = panel.getByRole("button", {
        name: "Close",
        exact: true,
      });
      await expect(closeButton).toHaveCSS("border-radius", "8px");
      await expect(
        panel
          .getByRole("button", { name: "Close", exact: true })
          .locator("span")
      ).toHaveCSS("border-radius", "8px");
      const overlay = page
        .getByRole("dialog", { name: CATEGORY, exact: true })
        .locator(":scope > .tw-fixed.tw-inset-0.tw-transform-gpu");
      await expect(overlay).toBeVisible();
      await expect(overlay).toHaveClass(/tw-bg-gray-700\/60/);
      await expect(overlay).toHaveCSS(
        "background-color",
        "rgba(55, 65, 81, 0.6)"
      );
      await expect(overlay).toHaveCSS("opacity", "1");
    }
    const input = panel.getByRole("textbox", {
      name: "You",
      exact: true,
    });
    await expect(input).toHaveAttribute("readonly");
    await expect(
      panel.getByRole("button", { name: "Save", exact: true })
    ).toHaveCount(0);
    const loadingHeight = (await input.boundingBox())?.height;
    release();
    await expect(input).toHaveValue("20");
    if (!isMobile) {
      await expect
        .poll(() =>
          input.evaluate((field) => {
            const amount = field as HTMLInputElement;
            return { start: amount.selectionStart, end: amount.selectionEnd };
          })
        )
        .toEqual({ start: 0, end: 2 });
      await expect(input).toBeFocused();
      await input.press("3");
      await expect(input).toHaveValue("3");
      await input.press("Escape");
      await expect(input).toHaveValue("20");
    }
    expect((await input.boundingBox())?.height).toBeCloseTo(
      loadingHeight ?? 0,
      2
    );
    const inputSpacing = await input.evaluate((field) => {
      const bounds = field.getBoundingClientRect();
      const row = field.parentElement?.getBoundingClientRect();
      if (!row) throw new Error("Missing contribution row");
      return {
        top: bounds.top - row.top,
        bottom: row.bottom - bounds.bottom,
        rowHeight: row.height,
      };
    });
    expect(inputSpacing.top).toBeGreaterThanOrEqual(12);
    expect(inputSpacing.bottom).toBeGreaterThanOrEqual(12);
    const otherAmount = panel.getByText("10", { exact: true });
    const inputBox = await input.boundingBox();
    const otherAmountBox = await otherAmount.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(otherAmountBox).not.toBeNull();
    if (inputBox && otherAmountBox) {
      expect(otherAmountBox.x).toBeCloseTo(inputBox.x, 2);
      expect(otherAmountBox.width).toBeCloseTo(inputBox.width, 2);
      expect(otherAmountBox.height).toBeLessThan(inputBox.height);
    }
    await expect(otherAmount).toHaveCSS("border-top-width", "0px");
    await expect(otherAmount).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    const otherRowHeight = await otherAmount.evaluate(
      (amount) => amount.parentElement?.getBoundingClientRect().height
    );
    expect(otherRowHeight).toBeCloseTo(inputSpacing.rowHeight, 2);
    await expect(panel.getByRole("textbox")).toHaveCount(1);
    await input.click();
    await expect(input).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await input.press("Escape");
    await expect(panel).toBeHidden();
    await expect(categoryToggle).toBeFocused();
    await categoryToggle.click();
    await expect(input).toHaveValue("20");
    await input.fill("30");
    await expect(panel.getByRole("status")).toHaveText("Your REP 20 → 30");
    const originalViewport = page.viewportSize();
    if (originalViewport) {
      await page.setViewportSize({
        width: isMobile ? 1280 : 900,
        height: originalViewport.height,
      });
      await expect(panel).toBeHidden();
      await page.setViewportSize(originalViewport);
      await expect(input).toHaveValue("30");
    }
    if (isMobile) {
      const viewportBottom = await page.evaluate(
        () =>
          (globalThis.visualViewport?.offsetTop ?? 0) +
          (globalThis.visualViewport?.height ?? innerHeight)
      );
      // The sheet enters from below the viewport; measure its settled position.
      await expect
        .poll(async () => {
          const box = await panel
            .getByRole("button", { name: "Save", exact: true })
            .boundingBox();
          return box ? box.y + box.height : Number.POSITIVE_INFINITY;
        })
        .toBeLessThanOrEqual(viewportBottom);
    }
    await page.screenshot({
      path: testInfo.outputPath("rep-category-draft.png"),
      fullPage: true,
    });
    await input.press("Escape");
    await expect(input).toHaveValue("20");
    await expect(panel).toBeVisible();
    await input.fill("30");
    await input.press("Enter");
    await expect(page.getByText("Rep updated.", { exact: true })).toBeVisible();
    await expect(input).toHaveValue("30");
    expect(saved).toEqual([{ amount: 30, category: CATEGORY }]);
    await expect(panel).toBeVisible();
  });

  test("groups idle REP amounts without changing drafts or fetching while typing", async ({
    page,
    baseURL,
    browserName,
    isMobile,
  }) => {
    const api = getSandboxApiOrigin(baseURL);
    let reads = 0;
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) => {
        reads += 1;
        return route.fulfill({
          json: {
            ...allowance,
            rating_stats: [
              { ...allowance.rating_stats[0], rater_contribution: 12345 },
            ],
          },
        });
      }
    );
    await openProfile(page);
    await page
      .getByRole("button", {
        name: `Open REP category ${CATEGORY}`,
        exact: true,
      })
      .click();
    const panel = categoryPanel(page);
    const input = panel.getByRole("textbox", { name: "You", exact: true });
    const blurKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
    await expect(input).toHaveValue(isMobile ? "12,345" : "12345");
    await input.press(blurKey);
    await expect(input).toHaveValue("12,345");
    const readsBeforeTyping = reads;
    await input.click();
    await expect(input).toHaveValue("12345");
    await input.press("End");
    await input.press("ArrowLeft");
    await input.press("ArrowLeft");
    await input.press("9");
    await expect(input).toHaveValue("123945");
    expect(
      await input.evaluate(
        (field) => (field as HTMLInputElement).selectionStart
      )
    ).toBe(4);
    await input.press(blurKey);
    await expect(input).toHaveValue("123,945");
    await input.fill("-12345");
    await input.press(blurKey);
    await expect(input).toHaveValue("-12,345");
    expect(reads).toBe(readsBeforeTyping);
    await panel.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(input).toHaveValue("12,345");
  });

  test("keeps a category read-only when the viewer has no existing contribution", async ({
    page,
    baseURL,
  }) => {
    const api = getSandboxApiOrigin(baseURL);
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) =>
        route.fulfill({
          json: {
            ...allowance,
            rating_stats: [
              { ...allowance.rating_stats[0], rater_contribution: 0 },
            ],
          },
        })
    );
    await openProfile(page);
    await page
      .getByRole("button", {
        name: `Open REP category ${CATEGORY}`,
        exact: true,
      })
      .click();
    const panel = categoryPanel(page);
    await expect(
      panel.getByRole("link", { name: "other-rater", exact: true })
    ).toBeVisible();
    // The authoritative rating state also overrides stale contributor summaries.
    await expect(panel.getByRole("textbox")).toHaveCount(0);
    await expect(
      panel.getByRole("link", { name: "You", exact: true })
    ).toHaveCount(0);
    await expect(
      panel.getByRole("button", { name: "Save", exact: true })
    ).toHaveCount(0);
  });

  test("keeps the amount unavailable on allowance failure and recovers on retry", async ({
    page,
    baseURL,
  }) => {
    const api = getSandboxApiOrigin(baseURL);
    let fail = true;
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) =>
        route.fulfill(
          fail
            ? { status: 503, json: { error: "Unavailable" } }
            : { json: allowance }
        )
    );
    await openProfile(page);
    await page
      .getByRole("button", {
        name: `Open REP category ${CATEGORY}`,
        exact: true,
      })
      .click();
    const panel = categoryPanel(page);
    const input = panel.getByRole("textbox");
    await expect(panel.getByRole("alert")).toContainText(
      "Couldn't load your Rep allowance.",
      { timeout: 15000 }
    );
    await expect(input).toHaveAttribute("readonly");
    fail = false;
    await panel.getByRole("button", { name: "Try again", exact: true }).click();
    await expect(input).toHaveValue("20");
    await expect(input).not.toHaveAttribute("readonly");
    await input.press("Escape");
    await expect(panel).toBeHidden();
  });

  test("keeps a Grant REP draft through delayed loading and reads its saved total after reload", async ({
    page,
    baseURL,
  }) => {
    const api = getSandboxApiOrigin(baseURL);
    let rating = 20;
    let releaseAllowance: () => void = () => undefined;
    const allowanceReady = new Promise<void>((resolve) => {
      releaseAllowance = resolve;
    });
    const saved: unknown[] = [];
    await page.route(
      (url) => /^\/api\/+rep\/categories$/.test(url.pathname),
      (route) => route.fulfill({ json: [CATEGORY] })
    );
    await page.route(
      (url) => /^\/api\/+rep\/categories\/availability$/.test(url.pathname),
      (route) => route.fulfill({ json: true })
    );
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/categories?*`,
      (route) =>
        route.fulfill({
          json: {
            data: [
              {
                category: CATEGORY,
                total_rep: rating,
                contributor_count: 1,
                authenticated_user_contribution: rating,
                top_contributors: [],
              },
            ],
            page: 1,
            next: false,
            count: 1,
          },
        })
    );
    await page.route(`${api}/api/profiles/${TARGET}/rep/overview*`, (route) =>
      route.fulfill({
        json: {
          total_rep: rating,
          authenticated_user_contribution: rating,
          contributor_count: 1,
          contributors: { data: [], page: 1, next: false, count: 0 },
        },
      })
    );
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      async (route) => {
        await allowanceReady;
        await route.fulfill({
          json: {
            ...allowance,
            rating_stats: [
              { ...allowance.rating_stats[0], rater_contribution: rating },
            ],
          },
        });
      }
    );
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/rating`,
      async (route) => {
        const body: unknown = route.request().postDataJSON();
        if (
          typeof body !== "object" ||
          body === null ||
          !("amount" in body) ||
          typeof body.amount !== "number" ||
          !("category" in body) ||
          body.category !== CATEGORY
        )
          throw new Error("Unexpected local Grant REP payload");
        saved.push(body);
        rating = body.amount;
        await route.fulfill({ json: {} });
      }
    );
    await openProfile(page);
    await page
      .getByRole("button", {
        name: "Grant Rep",
        exact: true,
      })
      .click();
    const grant = page.getByRole("dialog", { name: "Grant Rep", exact: true });
    await expectDesktopRatingPosition(page, "Grant Rep");
    await grant
      .getByRole("textbox", { name: "Category to grant REP for", exact: true })
      .fill(CATEGORY);
    await grant.getByRole("button", { name: CATEGORY, exact: true }).click();
    const amount = grant.getByRole("textbox", {
      name: "Your total REP for this category",
      exact: true,
    });
    try {
      await amount.fill("35");
      await amount.press("Tab");
      await expect(amount).toHaveValue("35");
      await expect(
        grant.getByRole("button", { name: "Grant Rep", exact: true })
      ).toBeDisabled();
    } finally {
      releaseAllowance();
    }
    await expect(
      grant.getByRole("button", { name: "Grant Rep", exact: true })
    ).toBeEnabled();
    await expect(amount).toHaveValue("35");
    await expectDesktopRatingPosition(page, "Grant Rep");
    await grant.getByRole("button", { name: "Grant Rep", exact: true }).click();
    await expect(grant).toBeHidden();
    expect(saved).toEqual([{ amount: 35, category: CATEGORY }]);
    await expect(
      page.getByRole("button", {
        name: `Open REP category ${CATEGORY}`,
        exact: true,
      })
    ).toContainText("35");
    await page.reload({ waitUntil: "domcontentloaded" });
    const categoryToggle = page.getByRole("button", {
      name: `Open REP category ${CATEGORY}`,
      exact: true,
    });
    await expect(categoryToggle).toBeVisible({
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await categoryToggle.click();
    await expect(categoryPanel(page).getByRole("textbox")).toHaveValue("35");
    expect(saved).toHaveLength(1);
    await expectNoHorizontalOverflow(page);
  });

  test("reaches all sixty categories across server pages without wrapping tags", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    const pages: number[] = [];
    const longCategory =
      "A very long community category name that must truncate";
    const firstCategories = [longCategory, "Art", "UX"];
    await page.route(`${api}/api/profiles/*/rep/categories?*`, (route) => {
      const pageNumber = Number(
        new URL(route.request().url()).searchParams.get("page")
      );
      pages.push(pageNumber);
      const start = (pageNumber - 1) * 25;
      return route.fulfill({
        json: {
          data: Array.from(
            { length: Math.min(25, 60 - start) },
            (_, index) => ({
              category:
                firstCategories[start + index] ??
                `Category ${start + index + 1}`,
              total_rep: 1380,
              contributor_count: 60,
              top_contributors: Array.from({ length: 4 }, (_, contributor) => ({
                profile: {
                  id: `rater-${contributor}`,
                  handle: `rater-${contributor}`,
                  pfp: "/icon-512.png",
                },
                contribution: 10,
              })),
              authenticated_user_contribution: null,
            })
          ),
          page: pageNumber,
          next: pageNumber < 3,
        },
      });
    });
    if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
    await seedSession(page, null);
    await page.goto(`/${TARGET}`, { waitUntil: "domcontentloaded" });
    const rep = page
      .getByRole("region", { name: "REP", exact: true })
      .filter({ visible: true });
    await expect(
      rep.getByRole("button", {
        name: `Open REP category ${longCategory}`,
        exact: true,
      })
    ).toBeVisible({ timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS });
    for (let step = 0; step < 6; step += 1) {
      await rep
        .getByRole("button", { name: /^\+\d+ more$|^Load more$/ })
        .click();
    }
    await expect(
      rep.getByRole("button", {
        name: "Open REP category Category 60",
        exact: true,
      })
    ).toBeVisible();
    expect(new Set(pages)).toEqual(new Set([1, 2, 3]));
    const heights = await rep
      .getByRole("button", { name: /^Open REP category / })
      .evaluateAll((tags) =>
        tags.map((tag) => tag.getBoundingClientRect().height)
      );
    expect(heights.every((height) => height === (isMobile ? 44 : 40))).toBe(
      true
    );
    if (isMobile) {
      const targetHeights = await rep
        .getByRole("button", {
          name: /^Open REP category /,
        })
        .evaluateAll((buttons) =>
          buttons.map((button) => button.getBoundingClientRect().height)
        );
      expect(targetHeights.every((height) => height >= 44)).toBe(true);
    }
    const tagFits = await rep
      .getByRole("button", {
        name: `Open REP category ${longCategory}`,
        exact: true,
      })
      .evaluate((tag) => tag.scrollWidth <= tag.clientWidth + 1);
    expect(tagFits).toBe(true);
    await expectNoHorizontalOverflow(page);
    const longTag = rep.getByRole("button", {
      name: `Open REP category ${longCategory}`,
      exact: true,
    });
    const categoryLabel = longTag.getByText(longCategory, { exact: true });
    const totalLabel = longTag.getByText("1,380", { exact: true });
    for (const label of [categoryLabel, totalLabel]) {
      await expect(label).toHaveCSS("font-size", "14px");
      await expect(label).toHaveCSS("font-weight", "500");
    }
    await expect(categoryLabel).toHaveCSS("color", "rgb(255, 255, 255)");
    await expect(totalLabel).toHaveCSS("color", "rgb(147, 147, 159)");
    await expect(longTag).toHaveCSS(
      "background-color",
      "rgba(255, 255, 255, 0.05)"
    );
    if (isMobile) {
      const tagBox = await longTag.boundingBox();
      const labelBox = await categoryLabel.boundingBox();
      const chevronBox = await rep
        .getByRole("button", {
          name: `Open REP category ${longCategory}`,
          exact: true,
        })
        .locator("svg")
        .boundingBox();
      expect(tagBox).not.toBeNull();
      expect(labelBox).not.toBeNull();
      expect(chevronBox).not.toBeNull();
      if (tagBox && labelBox && chevronBox) {
        expect(labelBox.x - tagBox.x).toBeGreaterThanOrEqual(12);
        expect(
          tagBox.x + tagBox.width - chevronBox.x - chevronBox.width
        ).toBeGreaterThanOrEqual(12);
      }
    }
    const avatar = longTag.getByRole("img", {
      name: "rater-0",
      exact: true,
    });
    await expect(longTag.getByRole("img")).toHaveCount(3);
    await expect(longTag.getByRole("link")).toHaveCount(0);
    await expect(longTag.getByRole("button")).toHaveCount(0);
    await expect(longTag.getByText("60 raters", { exact: true })).toBeVisible();
    const avatarBox = await avatar.boundingBox();
    expect(avatarBox?.width).toBe(24);
    expect(avatarBox?.height).toBe(24);
    const tagDividerBox = await rep
      .getByRole("button", {
        name: `Open REP category ${longCategory}`,
        exact: true,
      })
      .locator('span[aria-hidden="true"]')
      .boundingBox();
    const totalBox = await longTag
      .getByText("1,380", { exact: true })
      .boundingBox();
    expect(tagDividerBox).not.toBeNull();
    expect(totalBox).not.toBeNull();
    if (tagDividerBox && avatarBox && totalBox) {
      expect(
        avatarBox.x - tagDividerBox.x - tagDividerBox.width
      ).toBeGreaterThanOrEqual(12);
      expect(
        tagDividerBox.x - totalBox.x - totalBox.width
      ).toBeGreaterThanOrEqual(12);
    }
    if (!isMobile) {
      await avatar.hover();
      await expect(totalLabel).toHaveCSS("color", "rgb(206, 207, 212)");
      const tooltip = page.getByRole("tooltip").filter({
        hasText: "rater-0 · 10",
      });
      await expect(tooltip).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath("rep-category-hover-avatar.png"),
      });
      await rep.getByRole("button", { name: "Received", exact: true }).hover();
      await expect(tooltip).toBeHidden();
    }
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) =>
        route.fulfill({
          json: {
            ...allowance,
            rating_stats: [
              { ...allowance.rating_stats[0], category: longCategory },
            ],
          },
        })
    );
    if (!isMobile) {
      const viewport = page.viewportSize();
      if (viewport) {
        await page.setViewportSize({ width: 1024, height: viewport.height });
        const art = rep.getByRole("button", {
          name: "Open REP category Art",
          exact: true,
        });
        await art.click();
        const artPanel = page.getByRole("region", {
          name: "Art REP details",
          exact: true,
        });
        await expect(artPanel).toBeVisible();
        await page.setViewportSize({ width: 1440, height: viewport.height });
        await expectDesktopTagJoin(page, "Art");
        await expect
          .poll(async () => {
            const artBox = await art.boundingBox();
            const uxBox = await rep
              .getByRole("button", {
                name: "Open REP category UX",
                exact: true,
              })
              .boundingBox();
            return artBox && uxBox ? Math.abs(artBox.y - uxBox.y) : Infinity;
          })
          .toBeLessThanOrEqual(1);
        await art.click();
        await page.setViewportSize(viewport);
      }
    }
    const categoryToggle = rep.getByRole("button", {
      name: `Open REP category ${longCategory}`,
      exact: true,
    });
    const closedTagBox = await categoryToggle.evaluate((tag) => ({
      x: (tag as HTMLElement).offsetLeft,
      y: (tag as HTMLElement).offsetTop,
      width: tag.getBoundingClientRect().width,
      height: tag.getBoundingClientRect().height,
    }));
    await categoryToggle.click();
    const openGlobal = page.getByRole("button", {
      name: `Open category ${longCategory}`,
      exact: true,
    });
    await expect(openGlobal).toBeVisible();
    await expect(openGlobal).toHaveText("Open category");
    const details = isMobile
      ? page
          .getByRole("dialog", { name: longCategory, exact: true })
          .locator(".mobile-wrapper-dialog")
      : page.getByRole("region", {
          name: `${longCategory} REP details`,
          exact: true,
        });
    await expect(
      details.getByRole("button", {
        name: `Open category ${longCategory}`,
        exact: true,
      })
    ).toBeVisible();
    await expect(details.getByText("60 raters", { exact: true })).toHaveCount(
      0
    );
    const firstContributor = details.getByRole("link").first();
    await expect(firstContributor).toBeVisible();
    // Wait for the sheet's entrance motion before comparing header positions.
    await openGlobal.click({ trial: true });
    const contributorBox = await firstContributor.boundingBox();
    const actionBox = await openGlobal.boundingBox();
    const detailsBox = await details.boundingBox();
    expect(contributorBox).not.toBeNull();
    expect(actionBox).not.toBeNull();
    expect(detailsBox).not.toBeNull();
    if (actionBox && detailsBox) {
      if (isMobile) {
        expect(actionBox.x - detailsBox.x).toBeLessThanOrEqual(24);
        const titleBox = await details
          .getByRole("heading", { name: longCategory, exact: true })
          .boundingBox();
        expect(titleBox).not.toBeNull();
        if (titleBox) {
          const paddingLeft = await openGlobal.evaluate((button) =>
            Number.parseFloat(getComputedStyle(button).paddingLeft)
          );
          expect(actionBox.x + paddingLeft).toBeCloseTo(titleBox.x, 0);
          expect(actionBox.y).toBeGreaterThanOrEqual(
            titleBox.y + titleBox.height
          );
        }
      } else {
        expect(
          detailsBox.x + detailsBox.width - actionBox.x - actionBox.width
        ).toBeLessThanOrEqual(24);
      }
      expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(
        detailsBox.x + detailsBox.width
      );
    }
    if (contributorBox && actionBox) {
      expect(actionBox.y + actionBox.height).toBeLessThanOrEqual(
        contributorBox.y
      );
    }
    const divider = details.getByRole("separator");
    await expect(divider).toBeVisible();
    await expect(divider).toHaveCSS("border-top-width", "1px");
    const dividerBox = await divider.boundingBox();
    expect(dividerBox).not.toBeNull();
    if (dividerBox && actionBox && contributorBox) {
      expect(dividerBox.y).toBeGreaterThanOrEqual(
        actionBox.y + actionBox.height
      );
      expect(dividerBox.y + dividerBox.height).toBeLessThan(contributorBox.y);
    }
    if (!isMobile) {
      await expectDesktopTagJoin(page, longCategory);
      const openTagBox = await categoryToggle.evaluate((tag) => ({
        x: (tag as HTMLElement).offsetLeft,
        y: (tag as HTMLElement).offsetTop,
        width: tag.getBoundingClientRect().width,
        height: tag.getBoundingClientRect().height,
      }));
      expect(openTagBox.x).toBeCloseTo(closedTagBox.x, 0);
      expect(openTagBox.y).toBeCloseTo(closedTagBox.y, 0);
      expect(openTagBox.width).toBeCloseTo(closedTagBox.width, 0);
      expect(openTagBox.height).toBe(closedTagBox.height);
    }
    await expectNoHorizontalOverflow(page);
    await details.screenshot({
      path: testInfo.outputPath("rep-open-category-top.png"),
    });
    const globalOverview = {
      category: longCategory,
      total_rep: 0,
      pair_count: 0,
      giver_count: 0,
      recipient_count: 0,
      top_recipients: [],
      top_givers: [],
      recently_updated: [],
    } satisfies ApiGlobalRepCategoryOverview;
    await page.route(`${api}/api/rep/categories/*/overview`, (route) =>
      route.fulfill({ json: globalOverview })
    );
    await openGlobal.press("Enter");
    const globalCategory = page.getByRole("dialog", {
      name: `${longCategory} REP`,
      exact: true,
    });
    await expect(
      globalCategory.getByRole("heading", { name: longCategory, exact: true })
    ).toBeVisible();
    if (isMobile) {
      await expect(
        page
          .getByRole("dialog", { name: longCategory, exact: true })
          .locator(".mobile-wrapper-dialog")
      ).toBeHidden();
    }
  });

  test("owner retries failed receiver edits without repeating successful writes and keeps the receiver list available", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    let alice = 30;
    let bob = 20;
    let failAlice = true;
    const attempts: { handle: string; amount: number }[] = [];
    await page.route(
      `${api}/api/profiles/*/rep/categories/*/contributors?*`,
      (route) =>
        route.fulfill({
          json: {
            data: [
              {
                profile: {
                  id: "alice",
                  handle: TARGET,
                  primary_address: "0x1",
                  pfp: "/icon-512.png",
                },
                contribution: alice,
              },
              {
                profile: {
                  id: "bob",
                  handle: "following-artist-1",
                  primary_address: "0x2",
                  pfp: "/icon-512.png",
                },
                contribution: bob,
              },
            ],
            page: 1,
            next: false,
          },
        })
    );
    await page.route(`${api}/api/profiles/*/rep/ratings/received?*`, (route) =>
      route.fulfill({
        json: {
          ...allowance,
          rep_rates_left_for_rater: 120 - Math.abs(alice) - Math.abs(bob),
        },
      })
    );
    await page.route(`${api}/api/profiles/*/rep/rating`, (route) => {
      const handle = new URL(route.request().url()).pathname.split("/")[3];
      if (!handle) throw new Error("Missing profile identity in rating route");
      const { amount } = route.request().postDataJSON();
      attempts.push({ handle, amount });
      if (handle === TARGET && failAlice) {
        failAlice = false;
        return route.fulfill({
          status: 503,
          json: { error: "Rating unavailable" },
        });
      }
      if (handle === TARGET) alice = amount;
      else bob = amount;
      return route.fulfill({ json: {} });
    });
    await seedSession(page, null);
    await openOwnerProfile(page);
    const rep = page
      .getByRole("region", { name: "REP", exact: true })
      .filter({ visible: true });
    await rep.getByRole("button", { name: "Given", exact: true }).click();
    await rep
      .getByRole("button", {
        name: `Open REP category ${CATEGORY}`,
        exact: true,
      })
      .click();
    const panel = categoryPanel(page);
    await expect(
      panel.getByText(/^\d+ receivers?$/, { exact: true })
    ).toHaveCount(0);
    if (!isMobile) {
      await expectDesktopTagJoin(page, CATEGORY);
    }
    const first = panel.getByRole("textbox", {
      name: TARGET,
      exact: true,
    });
    const second = panel.getByRole("textbox", {
      name: "following-artist-1",
      exact: true,
    });
    await expect(first).toHaveValue("30");
    await first.fill("110");
    await second.fill("0");
    await expect(panel.getByRole("status")).toHaveText("Total 20 → 80");
    if (isMobile) {
      // Model the software keyboard shrinking the visible viewport while the
      // layout viewport stays full height. Native and browser sheets keep
      // their existing inset handling; the focused amount must stay visible.
      await page.evaluate(() => {
        const viewport = globalThis.visualViewport;
        if (!viewport) throw new Error("Expected a visual viewport");
        Object.defineProperty(viewport, "height", {
          configurable: true,
          value: globalThis.innerHeight - 320,
        });
        viewport.dispatchEvent(new Event("resize"));
      });
      await expect(second).toBeFocused();
      await expect
        .poll(() =>
          second.evaluate((field) => {
            const bounds = field.getBoundingClientRect();
            const viewport = globalThis.visualViewport;
            const top = viewport?.offsetTop ?? 0;
            const bottom = top + (viewport?.height ?? innerHeight);
            let ancestor = field.parentElement;
            while (ancestor) {
              if (/auto|scroll/.test(getComputedStyle(ancestor).overflowY)) {
                const visible = ancestor.getBoundingClientRect();
                if (bounds.top < visible.top || bounds.bottom > visible.bottom)
                  return false;
              }
              ancestor = ancestor.parentElement;
            }
            return bounds.top >= top && bounds.bottom <= bottom;
          })
        )
        .toBe(true);
      await expect(second).toHaveValue("0");
      await panel.getByRole("button", { name: "Save", exact: true }).click({
        trial: true,
      });
      await expectNoHorizontalOverflow(page);
      await page.screenshot({
        path: testInfo.outputPath("rep-keyboard-viewport.png"),
      });
      await page.evaluate(() => {
        const viewport = globalThis.visualViewport;
        if (!viewport) throw new Error("Expected a visual viewport");
        Reflect.deleteProperty(viewport, "height");
        viewport.dispatchEvent(new Event("resize"));
      });
    }
    await panel.getByRole("button", { name: "Save", exact: true }).click();
    await expect(panel.getByRole("alert")).toContainText(
      "Couldn't update this Rep rating."
    );
    await expect(
      panel.getByRole("button", { name: "Save", exact: true })
    ).toBeEnabled();
    await expect(first).toHaveValue("110");
    expect(attempts).toEqual([
      { handle: "following-artist-1", amount: 0 },
      { handle: TARGET, amount: 110 },
    ]);
    await panel.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Rep updated.", { exact: true })).toBeVisible();
    expect(attempts).toEqual([
      { handle: "following-artist-1", amount: 0 },
      { handle: TARGET, amount: 110 },
      { handle: TARGET, amount: 110 },
    ]);
    await expect(first).toHaveValue("110");
    await first.press("Escape");
    await expect(
      rep.getByRole("button", { name: /^All REP receivers:/ })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("keeps another profile's Given and the owner's Received categories read-only", async ({
    page,
  }, testInfo) => {
    await openProfile(page);
    await page
      .getByRole("region", { name: "REP", exact: true })
      .filter({ visible: true })
      .getByRole("button", { name: "Given", exact: true })
      .or(
        page
          .getByRole("region", { name: "REP", exact: true })
          .filter({ visible: true })
          .getByRole("tab", { name: "Given", exact: true })
      )
      .click();
    await expect(
      page.getByRole("button", { name: /Edit REP category/ })
    ).toHaveCount(0);
    const category = page.getByRole("button", {
      name: `Open REP category ${CATEGORY}`,
      exact: true,
    });
    await category.click();
    const panel = categoryPanel(page);
    const amount = panel.getByText("10", { exact: true });
    await expect(amount).toBeVisible();
    await expect(panel.getByRole("textbox")).toHaveCount(0);
    await expect(amount).toHaveCSS("border-top-width", "0px");
    await expect(amount).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await panel.screenshot({
      path: testInfo.outputPath("rep-given-read-only.png"),
      animations: "disabled",
    });
    await panel
      .getByRole("button", { name: `Open category ${CATEGORY}`, exact: true })
      .press("Escape");
    await expect(panel).toBeHidden();
    // Navigate through the shell so pending wallet initialization survives
    // the profile change, as it does during normal in-app navigation.
    if ((page.viewportSize()?.width ?? 0) < 1024) {
      await page
        .getByRole("button", { name: "Open menu", exact: true })
        .click();
    }
    const nativeProfileLink = page.getByRole("link", {
      name: "Open playwright profile",
      exact: true,
    });
    const accountMenu = page.getByRole("button", {
      name: "Open account and profiles menu",
      exact: true,
    });
    await expect(nativeProfileLink.or(accountMenu)).toBeVisible();
    if (await nativeProfileLink.isVisible()) {
      await nativeProfileLink.click();
    } else {
      await accountMenu.press("Enter");
      await page.getByRole("link", { name: "Profile", exact: true }).click();
    }
    await page.waitForURL(/\/playwright$/, {
      timeout: LOCAL_SANDBOX_NAVIGATION_TIMEOUT_MS,
    });
    await expect(
      page.getByRole("navigation", { name: "Profile sections" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: /Edit REP category/ })
    ).toHaveCount(0);
    await page
      .getByRole("button", {
        name: `Open REP category ${CATEGORY}`,
        exact: true,
      })
      .click();
    await expect(categoryPanel(page).getByRole("textbox")).toHaveCount(0);
  });

  test("loads and saves the grantor contribution in proxy mode", async ({
    page,
    baseURL,
  }) => {
    const api = getSandboxApiOrigin(baseURL);
    const grantorId = "00000000-0000-4000-8000-000000000539";
    await page.route(`${api}/api/profiles/*/proxies/**`, (route) =>
      route.fulfill({
        json: [
          {
            id: "00000000-0000-4000-8000-000000000540",
            created_by: { id: grantorId, handle: "grantor", pfp: null },
            granted_to: {
              id: "00000000-0000-4000-8000-000000000531",
              handle: "playwright",
              pfp: null,
            },
            actions: [
              {
                action_type: "ALLOCATE_REP",
                credit_amount: 50,
                credit_spent: 10,
                is_active: true,
                accepted_at: 1,
              },
            ],
          },
        ],
      })
    );
    const raters: (string | null)[] = [];
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) => {
        const rater = new URL(route.request().url()).searchParams.get("rater");
        raters.push(rater);
        return route.fulfill({
          json:
            rater === "grantor"
              ? allowance
              : { ...allowance, rating_stats: [] },
        });
      }
    );
    const saved: unknown[] = [];
    await page.route(`${api}/api/profiles/${TARGET}/rep/rating`, (route) => {
      saved.push(route.request().postDataJSON());
      return route.fulfill({ json: {} });
    });
    await openProfile(page, grantorId);
    await page
      .getByRole("button", {
        name: `Open REP category ${CATEGORY}`,
        exact: true,
      })
      .click();
    const dialog = categoryPanel(page);
    await expect(
      dialog.getByText("You are acting as proxy for: grantor", { exact: true })
    ).toBeVisible();
    await expect(
      dialog.getByRole("link", { name: "grantor", exact: true })
    ).toHaveAttribute("href", "/grantor");
    const input = dialog.getByRole("textbox");
    await expect(input).toHaveValue("20");
    expect(raters).toContain("grantor");
    await input.fill("30");
    await dialog.getByRole("button", { name: "Save", exact: true }).click();
    await expect(page.getByText("Rep updated.", { exact: true })).toBeVisible();
    await expect(dialog).toBeVisible();
    expect(saved).toEqual([{ amount: 30, category: CATEGORY }]);
  });
});

test.describe("Profile Given rating management @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Given edits require the isolated local API."
  );

  for (const matter of ["REP", "NIC"] as const) {
    test(`${matter}: owner adjusts and removes from Given, then returns to the refreshed list`, async ({
      page,
      baseURL,
      isMobile,
      browserName,
    }, testInfo) => {
      const api = getSandboxApiOrigin(baseURL);
      const recipientHandle = matter === "NIC" ? "cold-nic-recipient" : TARGET;
      const path = matter === "REP" ? "rep" : "cic";
      const managementDialogs = page.getByRole("dialog", {
        name: /^(?:(?:REP|NIC) Given|REP given to |Add Rep to |Adjust NIC for )/,
        includeHidden: true,
      });
      if (isMobile && matter === "NIC")
        await page.setViewportSize({ width: 320, height: 844 });
      let rating = 20;
      let failSave = true;
      const saved: unknown[] = [];
      const requestedPages: number[] = [];
      let recipientRepReads = 0;
      let recipientNicReads = 0;
      let identityReads = 0;
      let releaseIdentity: () => void = () => undefined;
      const identityGate = new Promise<void>((resolve) => {
        releaseIdentity = resolve;
      });
      let checkParallelRead = matter === "NIC";
      if (matter === "NIC") {
        await page.route(
          `${api}/api/identities/${recipientHandle}`,
          async (route) => {
            identityReads += 1;
            const response = await route.fetch({
              url: `${api}/api/identities/${TARGET}`,
            });
            const data: Record<string, unknown> = await response.json();
            await identityGate;
            await route.fulfill({
              json: {
                ...data,
                handle: recipientHandle,
                display: recipientHandle,
                query: recipientHandle,
              },
            });
          }
        );
      }

      await installCategories(page, api);
      await page.route(`${api}/api/profiles/*/${path}/overview*`, (route) => {
        const given =
          new URL(route.request().url()).searchParams.get("direction") ===
          "outgoing";
        const people = given
          ? [
              { handle: "older-recipient", contribution: 900 },
              ...(rating === 0
                ? []
                : [{ handle: recipientHandle, contribution: rating }]),
            ]
          : [
              { handle: recipientHandle, contribution: 20 },
              { handle: "older-recipient", contribution: 19 },
            ];
        return route.fulfill({
          json: {
            [matter === "REP" ? "total_rep" : "total_cic"]: people.reduce(
              (sum, person) => sum + person.contribution,
              0
            ),
            authenticated_user_contribution: null,
            contributor_count: people.length,
            contributors: {
              data: people.map(({ handle, contribution }, index) => ({
                contribution,
                profile: {
                  id: `summary-${index}`,
                  handle,
                  primary_address: `0x${String(index + 1).padStart(40, "0")}`,
                  pfp: "/icon-512.png",
                },
              })),
              page: 1,
              next: false,
            },
          },
        });
      });
      await page.route(
        `${api}/api/profiles/*/${path}/ratings/by-rater?*`,
        (route) => {
          const params = new URL(route.request().url()).searchParams;
          expect(params.get("given")).toBe("true");
          expect(params.get("order_by")).toBe("rating");
          expect(params.get("order")).toBe("DESC");
          const requestedPage = Number(params.get("page"));
          requestedPages.push(requestedPage);
          if (requestedPage === 2)
            return route.fulfill({
              json: {
                data: [
                  {
                    profile_id: "page-two",
                    handle: "page-two-recipient",
                    wallets: [],
                    rating: 10,
                    last_modified: 1,
                  },
                ],
                page: 2,
                next: false,
              },
            });
          const data =
            rating === 0
              ? []
              : [
                  {
                    profile_id: "following-0",
                    handle: recipientHandle,
                    wallets: [],
                    rating,
                    last_modified: 20,
                  },
                ];
          data.push({
            profile_id: "older",
            handle: "older-recipient",
            wallets: [],
            rating: 900,
            last_modified: 10,
          });
          data.sort((a, b) => b.rating - a.rating);
          return route.fulfill({ json: { data, page: 1, next: true } });
        }
      );
      await page.route(
        `${api}/api/profiles/${recipientHandle}/rep/ratings/received?*`,
        (route) => {
          recipientRepReads += 1;
          return route.fulfill({
            json: {
              ...allowance,
              rating_stats: [
                { ...allowance.rating_stats[0], rater_contribution: rating },
              ],
            },
          });
        }
      );
      await page.route(
        `${api}/api/profiles/${recipientHandle}/cic/rating/*`,
        (route) => {
          recipientNicReads += 1;
          return route.fulfill({
            json: {
              cic_rating_by_rater: rating,
              cic_ratings_left_to_give_by_rater: 80,
            },
          });
        }
      );
      await page.route(
        `${api}/api/profiles/${recipientHandle}/${path}/rating`,
        (route) => {
          saved.push(route.request().postDataJSON());
          if (failSave) {
            failSave = false;
            return route.fulfill({
              status: 503,
              json: { message: "Try again" },
            });
          }
          rating = route.request().postDataJSON().amount;
          return route.fulfill({ json: {} });
        }
      );
      await seedSession(page, null);
      await openOwnerProfile(page);
      if (matter === "NIC" && isMobile)
        await page
          .getByRole("group", { name: "Identity sections", exact: true })
          .getByRole("button", { name: "NIC", exact: true })
          .click();
      await expect(
        page.getByRole("region", { name: matter, exact: true })
      ).toHaveCount(1);
      const section =
        matter === "NIC"
          ? page
              .getByRole("region", { name: "NIC", exact: true })
              .filter({ visible: true })
          : page
              .getByRole("region", { name: "REP", exact: true })
              .filter({ visible: true });
      await section
        .getByRole("button", { name: "Given", exact: true })
        .or(section.getByRole("tab", { name: "Given", exact: true }))
        .filter({ visible: true })
        .first()
        .click();
      await expectNoHorizontalOverflow(page);
      const summaryScreenshot = testInfo.outputPath(`${matter}-summary.png`);
      await page.screenshot({ path: summaryScreenshot });
      await testInfo.attach(`${matter}-summary`, {
        path: summaryScreenshot,
        contentType: "image/png",
      });
      const manageGiven = section
        .getByRole("button", {
          name: new RegExp(`^All ${matter} receivers: [0-9,]+$`),
          exact: true,
        })
        .filter({ visible: true });
      await expect(manageGiven).toContainText("2 receivers");
      await expect(manageGiven).not.toContainText("All receivers");
      await expect(manageGiven).toHaveAttribute("aria-haspopup", "dialog");
      const receiverAvatar = section.getByRole("link", {
        name: recipientHandle,
        exact: true,
      });
      await expect(receiverAvatar).toHaveAttribute(
        "href",
        `/${recipientHandle}`
      );
      expect(
        await receiverAvatar.evaluate((link) => link.closest("button"))
      ).toBeNull();
      await receiverAvatar.focus();
      await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
      await expect(manageGiven).toBeFocused();
      await manageGiven.getByText("2 receivers", { exact: true }).click();
      const list = page.getByRole("dialog", {
        name: `${matter} Given`,
        exact: true,
      });
      await expect(list.getByRole("link").first()).toHaveText(
        "older-recipient"
      );
      await expect(list.getByRole("link").nth(1)).toHaveText(recipientHandle);
      if (isMobile) {
        await expect(
          list
            .getByRole("listitem")
            .filter({ hasText: recipientHandle })
            .getByText(`20 ${matter}`, { exact: true })
        ).toBeVisible();
      }
      await list
        .getByRole("button", { name: "Load more", exact: true })
        .click();
      await expect(
        list.getByRole("link", { name: "page-two-recipient", exact: true })
      ).toBeVisible();
      expect(requestedPages).toEqual([1, 2]);
      await expect(
        page
          .getByRole("dialog", { name: `${matter} Given`, exact: true })
          .locator(".mobile-wrapper-dialog")
          .locator("..")
      ).not.toHaveAttribute("data-enter");
      const givenScreenshot = testInfo.outputPath(`${matter}-given.png`);
      await page.screenshot({ path: givenScreenshot });
      await testInfo.attach(`${matter}-given`, {
        path: givenScreenshot,
        contentType: "image/png",
      });

      const openEditor = async () => {
        let readsBeforeCategoryEditor = recipientRepReads;
        const nicReadsBeforeOpen = recipientNicReads;
        await list
          .getByRole("button", {
            name: `Adjust ${matter} for ${recipientHandle}`,
            exact: true,
          })
          .click();
        if (checkParallelRead) {
          try {
            await expect.poll(() => identityReads).toBe(1);
            // The allowance must arrive while the recipient identity is still held.
            await expect
              .poll(() => recipientNicReads)
              .toBe(nicReadsBeforeOpen + 1);
          } finally {
            releaseIdentity();
          }
          checkParallelRead = false;
        }
        if (matter === "REP") {
          const categoryButton = page
            .getByRole("dialog", {
              name: `REP given to ${recipientHandle}`,
              exact: true,
            })
            .getByRole("button", {
              name: `Adjust REP (${CATEGORY}) for ${recipientHandle}`,
              exact: true,
            });
          await expect(categoryButton).toBeVisible();
          await expect(managementDialogs).toHaveCount(1);
          readsBeforeCategoryEditor = recipientRepReads;
          await categoryButton.click();
        }
        const editor = page.getByRole("dialog", {
          name:
            matter === "REP"
              ? `Add Rep to ${recipientHandle}`
              : `Adjust NIC for ${recipientHandle}`,
          exact: true,
        });
        await expect(editor.getByRole("textbox")).toHaveValue(String(rating));
        const cancelBox = await editor
          .getByRole("button", { name: "Cancel", exact: true })
          .boundingBox();
        const saveBox = await editor
          .getByRole("button", { name: "Save", exact: true })
          .boundingBox();
        expect(cancelBox).not.toBeNull();
        expect(saveBox).not.toBeNull();
        expect(cancelBox!.height).toBe(44);
        expect(saveBox!.height).toBe(44);
        expect(Math.abs(cancelBox!.y - saveBox!.y)).toBeLessThanOrEqual(1);
        expect(cancelBox!.x + cancelBox!.width).toBeLessThanOrEqual(saveBox!.x);
        const inputBox = await editor.getByRole("textbox").boundingBox();
        expect(inputBox).not.toBeNull();
        expect(
          Math.abs(saveBox!.x + saveBox!.width - inputBox!.x - inputBox!.width)
        ).toBeLessThanOrEqual(1);
        expect(saveBox!.width).toBeLessThan(inputBox!.width / 2);
        expect(cancelBox!.width).toBeLessThan(inputBox!.width / 2);
        const bottomGap = await editor
          .getByRole("button", { name: "Save", exact: true })
          .evaluate((button) => {
            const panel = button.closest(".mobile-wrapper-dialog");
            if (!panel) throw new Error("Missing rating dialog panel");
            return (
              panel.getBoundingClientRect().bottom -
              button.getBoundingClientRect().bottom
            );
          });
        expect(bottomGap).toBeGreaterThanOrEqual(23);
        if (matter === "NIC")
          expect(recipientNicReads).toBe(nicReadsBeforeOpen + 1);

        await expect(managementDialogs).toHaveCount(1);
        if (matter === "REP")
          expect(recipientRepReads).toBe(readsBeforeCategoryEditor);
        return editor;
      };
      let editor = await openEditor();
      await expectAxeClean(page, { include: ['[role="dialog"]'] });
      await editor.getByRole("textbox").fill("25");
      await editor.getByRole("button", { name: "Back", exact: true }).click();
      if (matter === "REP") {
        const categories = page.getByRole("dialog", {
          name: `REP given to ${recipientHandle}`,
          exact: true,
        });
        await expect(
          categories.getByRole("button", {
            name: `Adjust REP (${CATEGORY}) for ${recipientHandle}`,
            exact: true,
          })
        ).toBeVisible();
        await categories
          .getByRole("button", { name: "Back", exact: true })
          .click();
      }
      await expect(
        list.getByRole("heading", { name: `${matter} Given`, exact: true })
      ).toBeVisible();
      await expect(managementDialogs).toHaveCount(1);
      await expect(
        list.getByRole("button", {
          name: `Adjust ${matter} for ${recipientHandle}`,
          exact: true,
        })
      ).toBeFocused();
      await expect(
        list.getByRole("link", { name: "page-two-recipient", exact: true })
      ).toBeVisible();
      expect(requestedPages).toEqual([1, 2]);
      expect(saved).toHaveLength(0);

      editor = await openEditor();
      await editor.getByRole("textbox").fill("26");
      await editor.getByRole("button", { name: "Cancel", exact: true }).click();
      await expect(managementDialogs).toHaveCount(0);
      await expect(manageGiven).toBeFocused();
      expect(saved).toHaveLength(0);
      await manageGiven.click();
      editor = await openEditor();
      await editor.getByRole("textbox").fill("30");
      await editor.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        page.getByText("Please try again.", { exact: true }).first()
      ).toBeVisible();
      await expect(editor.getByRole("textbox")).toHaveValue("30");
      const pagesBeforeSave = requestedPages.length;
      await editor.getByRole("button", { name: "Save", exact: true }).click();
      await expect(editor).toBeHidden();
      await expect(
        list.getByRole("link", { name: recipientHandle }).locator("..")
      ).toContainText("30");
      await expect(
        page
          .getByRole("region", {
            name: matter,
            exact: true,
            includeHidden: true,
          })
          .filter({ visible: true })
          .getByText("930", { exact: true })
      ).toBeAttached();
      expect(requestedPages.slice(pagesBeforeSave)).toEqual([1]);
      await expect(
        list.getByRole("link", { name: "page-two-recipient", exact: true })
      ).toHaveCount(0);
      await list
        .getByRole("button", { name: "Load more", exact: true })
        .click();
      await expect(
        list.getByRole("link", { name: "page-two-recipient", exact: true })
      ).toBeVisible();
      expect(requestedPages.slice(pagesBeforeSave)).toEqual([1, 2]);
      editor = await openEditor();
      await editor.getByRole("button", { name: "Close", exact: true }).click();
      await expect(managementDialogs).toHaveCount(0);
      const manageTrigger = section
        .getByRole("button", {
          name: new RegExp(`^All ${matter} receivers:`),
        })
        .filter({ visible: true });
      await expect(manageTrigger).toBeFocused();
      await openOwnerProfile(page);
      if (matter === "NIC" && isMobile)
        await page
          .getByRole("group", { name: "Identity sections", exact: true })
          .getByRole("button", { name: "NIC", exact: true })
          .click();
      await section.getByRole("button", { name: "Given", exact: true }).click();
      await manageTrigger.click();
      editor = await openEditor();
      await editor.getByRole("textbox").fill("-15");
      await editor.getByRole("button", { name: "Save", exact: true }).click();
      await expect(editor).toBeHidden();
      await expect(
        list.getByRole("link", { name: recipientHandle }).locator("..")
      ).toContainText("-15");
      await expect(
        page
          .getByRole("region", {
            name: matter,
            exact: true,
            includeHidden: true,
          })
          .filter({ visible: true })
          .getByText("885", { exact: true })
      ).toBeAttached();
      editor = await openEditor();
      await expect(
        editor.getByRole("button", { name: "Remove rating", exact: true })
      ).toHaveCount(0);
      await editor.getByRole("textbox").fill("0");
      await expect(editor.getByRole("textbox")).toHaveValue("0");
      expect(saved).toHaveLength(3);
      const removeScreenshot = testInfo.outputPath(`${matter}-remove.png`);
      await page.screenshot({ path: removeScreenshot });
      await testInfo.attach(`${matter}-remove`, {
        path: removeScreenshot,
        contentType: "image/png",
      });
      const pagesBeforeRemoval = requestedPages.length;
      await editor.getByRole("button", { name: "Save", exact: true }).click();
      await expect(editor).toBeHidden();
      await expect(
        list.getByRole("link", { name: recipientHandle })
      ).toHaveCount(0);
      expect(requestedPages.slice(pagesBeforeRemoval)).toEqual([1]);
      await expect(
        list.getByRole("link", { name: "older-recipient" })
      ).toBeVisible();
      await expect(
        page
          .getByRole("region", {
            name: matter,
            exact: true,
            includeHidden: true,
          })
          .filter({ visible: true })
          .getByText("900", { exact: true })
      ).toBeAttached();
      expect(saved).toEqual(
        matter === "REP"
          ? [
              { amount: 30, category: CATEGORY },
              { amount: 30, category: CATEGORY },
              { amount: -15, category: CATEGORY },
              { amount: 0, category: CATEGORY },
            ]
          : [{ amount: 30 }, { amount: 30 }, { amount: -15 }, { amount: 0 }]
      );
      await list.getByRole("button", { name: "Close", exact: true }).click();
      await openOwnerProfile(page);
      if (matter === "NIC" && isMobile)
        await page
          .getByRole("group", { name: "Identity sections", exact: true })
          .getByRole("button", { name: "NIC", exact: true })
          .click();
      await section.getByRole("button", { name: "Given", exact: true }).click();
      await manageTrigger.click();
      await expect(
        list.getByRole("link", { name: recipientHandle, exact: true })
      ).toHaveCount(0);
      await expect(
        list.getByRole("link", { name: "older-recipient", exact: true })
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });

    test(`${matter}: sorts Given across pages without mixing cached orders`, async ({
      page,
      baseURL,
      isMobile,
      browserName,
    }, testInfo) => {
      const api = getSandboxApiOrigin(baseURL);
      const path = matter === "REP" ? "rep" : "cic";
      if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
      await installCategories(page, api);
      await page.route(`${api}/api/profiles/*/${path}/overview*`, (route) =>
        route.fulfill({
          json: {
            [matter === "REP" ? "total_rep" : "total_cic"]: 970,
            authenticated_user_contribution: null,
            contributor_count: 3,
            contributors: { data: [], page: 1, next: false },
          },
        })
      );
      const requests: { orderBy: string; page: number }[] = [];
      const people = [
        { handle: "older-high", rating: 900, last_modified: 1 },
        { handle: "middle", rating: 50, last_modified: 2 },
        { handle: "recent-low", rating: 20, last_modified: 3 },
      ];
      await page.route(
        `${api}/api/profiles/*/${path}/ratings/by-rater?*`,
        (route) => {
          const params = new URL(route.request().url()).searchParams;
          expect(params.get("given")).toBe("true");
          expect(params.get("order")).toBe("DESC");
          const orderBy = params.get("order_by") ?? "";
          expect(["rating", "last_modified"]).toContain(orderBy);
          const requestedPage = Number(params.get("page"));
          requests.push({ orderBy, page: requestedPage });
          const sorted = [...people].sort((a, b) =>
            orderBy === "rating"
              ? b.rating - a.rating
              : b.last_modified - a.last_modified
          );
          const start = (requestedPage - 1) * 2;
          return route.fulfill({
            json: {
              data: sorted.slice(start, start + 2).map((person) => ({
                ...person,
                profile_id: person.handle,
                wallets: [],
              })),
              page: requestedPage,
              next: requestedPage === 1,
            },
          });
        }
      );
      await seedSession(page, null);
      await openOwnerProfile(page);
      if (matter === "NIC" && isMobile)
        await page
          .getByRole("group", { name: "Identity sections", exact: true })
          .getByRole("button", { name: "NIC", exact: true })
          .click();
      const section = page
        .getByRole("region", { name: matter, exact: true })
        .filter({ visible: true });
      await section.getByRole("button", { name: "Given", exact: true }).click();
      const manage = section.getByRole("button", {
        name: `All ${matter} receivers: 3`,
        exact: true,
      });
      await manage.press("Enter");
      const list = page.getByRole("dialog", {
        name: `${matter} Given`,
        exact: true,
      });
      const sort = list.getByRole("button", {
        name: new RegExp(`^Sort given ${matter}: `),
      });
      const sortMenu = page.getByRole("menu");
      const chooseSort = async (label: string) => {
        await sort.click();
        await sortMenu
          .getByRole("menuitem", { name: label, exact: true })
          .click();
        await expect(sort).toHaveAccessibleName(
          `Sort given ${matter}: ${label}`
        );
        await expect(sortMenu).toBeHidden();
      };
      const loadMore = list.getByRole("button", {
        name: "Load more",
        exact: true,
      });
      await expect(sort).toHaveAccessibleName(
        `Sort given ${matter}: Highest total first`
      );
      await expect(list.getByRole("link")).toHaveText(["older-high", "middle"]);
      // Read both rectangles together so dialog entrance motion cannot skew them.
      const arrowGeometry = await sort.evaluate((trigger) => {
        const arrow = trigger.querySelector("svg");
        if (!arrow) throw new Error("Missing sort chevron");
        const field = trigger.getBoundingClientRect();
        const icon = arrow.getBoundingClientRect();
        return {
          inset: field.right - icon.right,
          centerOffset: Math.abs(
            field.y + field.height / 2 - icon.y - icon.height / 2
          ),
        };
      });
      expect(arrowGeometry.inset).toBeGreaterThanOrEqual(13);
      expect(arrowGeometry.inset).toBeLessThanOrEqual(15);
      expect(arrowGeometry.centerOffset).toBeLessThanOrEqual(1);
      await expectAxeClean(page, { include: ['[role="dialog"]'] });
      // Opening management fetches only the default order's first page.
      expect(requests).toEqual([{ orderBy: "rating", page: 1 }]);
      await loadMore.click();
      await expect(list.getByRole("link")).toHaveText([
        "older-high",
        "middle",
        "recent-low",
      ]);
      if (!isMobile) {
        // Safari uses Option+Tab to include buttons in native keyboard navigation.
        await sort.press(
          browserName === "webkit" ? "Alt+Shift+Tab" : "Shift+Tab"
        );
        await expect(
          list.getByRole("button", { name: "Close", exact: true })
        ).toBeFocused();
        await list
          .getByRole("button", { name: "Close", exact: true })
          .press(browserName === "webkit" ? "Alt+Tab" : "Tab");
        await expect(sort).toBeFocused();
        expect(
          await sort.evaluate((element) => {
            const content = element.firstElementChild;
            if (!content) throw new Error("Missing sort button content");
            return getComputedStyle(content).outlineStyle;
          })
        ).toBe("solid");
      }
      await sort.press("Enter");
      await expect(sortMenu).toBeVisible();
      await sortMenu.press("Escape");
      await expect(sortMenu).toBeHidden();
      await expect(sort).toBeFocused();
      await sort.press("Enter");
      await expectAxeClean(page, { include: ['[role="menu"]'] });
      await sortMenu.press("End");
      await sortMenu.press("Enter");
      await expect(sort).toHaveAccessibleName(
        `Sort given ${matter}: Most recently adjusted`
      );
      await expect(sortMenu).toBeHidden();
      await expect(sort).toBeFocused();
      await expect(list.getByRole("link")).toHaveText(["recent-low", "middle"]);
      expect(
        requests.filter((request) => request.orderBy === "last_modified")
      ).toEqual([{ orderBy: "last_modified", page: 1 }]);
      await loadMore.click();
      await expect(list.getByRole("link")).toHaveText([
        "recent-low",
        "middle",
        "older-high",
      ]);
      // Returning to a cached order starts at page one; Load more still works.
      await chooseSort("Highest total first");
      await expect(list.getByRole("link")).toHaveText(["older-high", "middle"]);
      await loadMore.click();
      await expect(list.getByRole("link")).toHaveText([
        "older-high",
        "middle",
        "recent-low",
      ]);
      expect(
        requests.filter(
          (request) => request.orderBy === "rating" && request.page === 2
        )
      ).toHaveLength(2);
      await chooseSort("Most recently adjusted");
      await expect(list.getByRole("link")).toHaveText(["recent-low", "middle"]);
      expect(
        requests.filter(
          (request) => request.orderBy === "last_modified" && request.page === 2
        )
      ).toHaveLength(1);
      await expectNoHorizontalOverflow(page);
      const screenshot = testInfo.outputPath(`${matter}-sort.png`);
      await page.screenshot({ path: screenshot });
      await testInfo.attach(`${matter}-sort`, {
        path: screenshot,
        contentType: "image/png",
      });
      await list.getByRole("button", { name: "Close", exact: true }).click();
      await manage.click();
      await expect(sort).toHaveAccessibleName(
        `Sort given ${matter}: Highest total first`
      );
      await expect(list.getByRole("link").first()).toHaveText("older-high");
    });
  }

  for (const count of [2, 25]) {
    test(`REP lists share content-sized height behavior (${count} rows)`, async ({
      page,
      baseURL,
      isMobile,
    }) => {
      const api = getSandboxApiOrigin(baseURL);
      if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
      await installCategories(page, api);
      await page.route(`${api}/api/profiles/*/rep/overview*`, (route) =>
        route.fulfill({
          json: {
            total_rep: 100,
            authenticated_user_contribution: null,
            contributor_count: count,
            contributors: { data: [], page: 1, next: false },
          },
        })
      );
      await page.route(
        `${api}/api/profiles/*/rep/ratings/by-rater?*`,
        (route) =>
          route.fulfill({
            json: {
              data: Array.from({ length: count }, (_, index) => ({
                profile_id: `person-${index}`,
                handle: `rating-person-${index}`,
                wallets: [],
                rating: count - index,
              })),
              page: 1,
              next: false,
            },
          })
      );
      await openProfile(page);
      const section = page
        .getByRole("region", { name: "REP", exact: true })
        .filter({ visible: true });
      const heights: number[] = [];
      for (const direction of ["Received", "Given"]) {
        await section
          .getByRole("button", { name: direction, exact: true })
          .click();
        await section
          .getByRole("button", {
            name: `View ${count} ${direction === "Received" ? "raters" : "receivers"}`,
            exact: true,
          })
          .click();
        const name = direction === "Received" ? "All raters" : "REP Given";
        const list = page.getByRole("dialog", { name, exact: true });
        await expectDesktopRatingPosition(page, name);
        await expect(
          list.getByText(
            `${count} ${direction === "Received" ? "raters" : "receivers"}`,
            { exact: true }
          )
        ).toHaveCount(0);
        await expect(list.getByRole("link")).toHaveCount(count);
        const panel = await page
          .getByRole("dialog", { name, exact: true })
          .locator(".mobile-wrapper-dialog")
          .boundingBox();
        expect(panel).not.toBeNull();
        heights.push(panel!.height);
        const viewportHeight = page.viewportSize()!.height;
        if (count === 2) {
          expect(panel!.height).toBeLessThan(viewportHeight * 0.6);
        } else {
          expect(panel!.height).toBeLessThan(viewportHeight);
          await list.getByRole("link").last().scrollIntoViewIfNeeded();
          const scroll = await list
            .getByRole("link")
            .last()
            .evaluate((link) => {
              let parent = link.parentElement;
              while (parent && getComputedStyle(parent).overflowY !== "auto")
                parent = parent.parentElement;
              if (!parent) throw new Error("Missing dialog scroller");
              return {
                top: parent.scrollTop,
                scrollHeight: parent.scrollHeight,
                clientHeight: parent.clientHeight,
              };
            });
          expect(scroll.scrollHeight).toBeGreaterThan(scroll.clientHeight);
          expect(scroll.top).toBeGreaterThan(0);
        }
        await expectNoHorizontalOverflow(page);
        await list.getByRole("button", { name: "Close", exact: true }).click();
        await expect(list).toBeHidden();
      }
      if (count === 25) expect(heights[0]).toBeCloseTo(heights[1]!, 0);
    });
  }

  test("visitor can inspect NIC Received and Given without management controls", async ({
    page,
    baseURL,
    isMobile,
    browserName,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    await installCategories(page, api);
    const directions: string[] = [];
    const overviewDirections: string[] = [];
    if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
    await page.route(`${api}/api/profiles/*/cic/overview*`, (route) => {
      const direction =
        new URL(route.request().url()).searchParams.get("direction") ??
        "incoming";
      overviewDirections.push(direction);
      return route.fulfill({
        json: {
          total_cic: direction === "outgoing" ? 1250 : 4100,
          authenticated_user_contribution: null,
          contributor_count: 1,
          contributors: {
            data: [
              {
                profile: {
                  id: "00000000-0000-4000-8000-000000000531",
                  handle: "playwright",
                  primary_address: "0x0000000000000000000000000000000000000529",
                  pfp: "/icon-512.png",
                },
                contribution: direction === "outgoing" ? 1250 : 4100,
              },
            ],
            page: 1,
            next: false,
          },
        },
      });
    });
    await page.route(
      `${api}/api/profiles/*/cic/ratings/by-rater?*`,
      (route) => {
        directions.push(
          new URL(route.request().url()).searchParams.get("given") ?? ""
        );
        return route.fulfill({
          json: {
            data: [
              {
                profile_id: "one",
                handle: "another-profile",
                wallets: [],
                rating: -20,
              },
            ],
            page: 1,
            next: false,
          },
        });
      }
    );
    await openProfile(page);
    if (isMobile)
      await page
        .getByRole("group", { name: "Identity sections", exact: true })
        .getByRole("button", { name: "NIC", exact: true })
        .click();
    const section = page
      .getByRole("region", { name: "NIC", exact: true })
      .filter({ visible: true });
    for (const direction of ["Received", "Given"]) {
      await section
        .getByRole("button", { name: direction, exact: true })
        .click();
      await expect(section.getByText("NIC", { exact: true })).toBeVisible();
      await expect(
        section.getByRole("button", { name: direction, exact: true })
      ).toHaveAttribute("aria-pressed", "true");
      const expectedTotal = direction === "Given" ? "1,250" : "4,100";
      await expect(
        section.getByText(expectedTotal, { exact: true })
      ).toBeVisible();
      if (isMobile) {
        await expect(
          page
            .getByRole("group", { name: "Identity sections", exact: true })
            .getByRole("button", {
              name: "NIC",
              exact: true,
            })
        ).toBeVisible();
      }
      const contributorsButton = section.getByRole("button", {
        name: new RegExp(
          `^View NIC ${direction}: [0-9,]+ (raters?|receivers?)$`
        ),
        exact: true,
      });
      const avatar = section.getByRole("link", {
        name: "playwright",
        exact: true,
      });
      if (direction === "Received") {
        await section
          .getByRole("button", { name: "Rate NIC", exact: true })
          .click();
        const rate = page.getByRole("dialog", {
          name: "Rate NIC",
          exact: true,
        });
        await expectDesktopRatingPosition(page, "Rate NIC");
        await rate.getByRole("button", { name: "Cancel", exact: true }).click();
        await expect(rate).toBeHidden();
      }
      await expect(avatar).toHaveAttribute("href", "/playwright");
      expect(
        await avatar.evaluate((link) => link.closest("button"))
      ).toBeNull();
      if (!isMobile) {
        const scoreBox = await section
          .getByText(expectedTotal, { exact: true })
          .boundingBox();
        const contributorsBox = await contributorsButton.boundingBox();
        const avatarBox = await avatar.boundingBox();
        expect(scoreBox).not.toBeNull();
        expect(contributorsBox).not.toBeNull();
        expect(avatarBox).not.toBeNull();
        expect(contributorsBox!.y).toBeGreaterThanOrEqual(
          scoreBox!.y + scoreBox!.height
        );
        expect(avatarBox!.x).toBeCloseTo(scoreBox!.x, 0);
        expect(contributorsBox!.x).toBeGreaterThan(
          avatarBox!.x + avatarBox!.width
        );
      }
      const summaryScreenshot = testInfo.outputPath(
        `NIC-${direction}-summary.png`
      );
      await page.screenshot({ path: summaryScreenshot, fullPage: true });
      await testInfo.attach(`NIC-${direction}-summary`, {
        path: summaryScreenshot,
        contentType: "image/png",
      });
      await avatar.focus();
      await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
      await expect(contributorsButton).toBeFocused();
      await contributorsButton.press("Enter");
      const list = page.getByRole("dialog", {
        name: `NIC ${direction}`,
        exact: true,
      });
      await expectDesktopRatingPosition(page, `NIC ${direction}`);
      await expect(
        list.getByText(`1 ${direction === "Received" ? "rater" : "receiver"}`, {
          exact: true,
        })
      ).toHaveCount(0);
      await expect(
        list.getByRole("link", { name: "another-profile" })
      ).toBeVisible();
      await expect(list.getByRole("button", { name: /Adjust/ })).toHaveCount(0);
      await expect(
        list.getByRole("button", { name: /^Sort given / })
      ).toHaveCount(0);
      const panel = await page
        .getByRole("dialog", { name: `NIC ${direction}`, exact: true })
        .locator(".mobile-wrapper-dialog")
        .boundingBox();
      expect(panel?.height).toBeLessThan(
        (page.viewportSize()?.height ?? 720) * 0.6
      );
      await list.getByRole("button", { name: "Close", exact: true }).click();
      await expect(list).toBeHidden();
    }
    expect(directions).toEqual(["false", "true"]);
    if (isMobile) {
      const sections = page.getByRole("group", {
        name: "Identity sections",
        exact: true,
      });
      await expect(sections.getByRole("button")).toHaveText([
        "REP",
        "NIC",
        "ID Statements",
      ]);
      await sections.getByRole("button", { name: "REP", exact: true }).click();
      await expect(
        page
          .getByRole("region", { name: "REP", exact: true })
          .filter({ visible: true })
          .getByRole("heading", { name: "Total REP", exact: true })
          .locator("..")
          .locator("..")
          .getByText("20", { exact: true })
      ).toBeVisible();
      await sections.getByRole("button", { name: "NIC", exact: true }).click();
      await expect(section.getByText("1,250", { exact: true })).toBeVisible();
      await expect(
        section.getByRole("button", { name: "Given", exact: true })
      ).toHaveAttribute("aria-pressed", "true");
    }
    await section
      .getByRole("button", { name: "Received", exact: true })
      .click();
    await expect(section.getByText("4,100", { exact: true })).toBeVisible();
    if (isMobile) {
      const sections = page.getByRole("group", {
        name: "Identity sections",
        exact: true,
      });
      await expect(
        sections.getByRole("button", { name: "NIC", exact: true })
      ).toHaveAttribute("aria-pressed", "true");
      await sections
        .getByRole("button", { name: "ID Statements", exact: true })
        .click();
      const statements = page.getByRole("region", { name: /ID Statements$/ });
      await expect(statements.getByText(/^[0-9,]+ statements?$/)).toBeVisible();
      await sections.getByRole("button", { name: "NIC", exact: true }).click();
      await expect(section.getByText("4,100", { exact: true })).toBeVisible();
    }
    expect(
      overviewDirections.filter((direction) => direction === "outgoing")
    ).toHaveLength(1);
    await expectNoHorizontalOverflow(page);
    await section
      .getByRole("link", { name: "playwright", exact: true })
      .press("Enter");
    await expect(page).toHaveURL(/\/playwright$/);
    await expect(
      page.getByRole("heading", { name: "playwright", exact: true })
    ).toBeVisible();
  });
});
