import type { Locator, Page } from "@playwright/test";
import type { ApiGlobalRepCategoryOverview } from "@/generated/models/ApiGlobalRepCategoryOverview";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
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

async function expectFocusedAmountWithoutSelection(amount: Locator) {
  await expect(amount).toBeFocused();
  await expect
    .poll(() =>
      amount.evaluate(
        (input: HTMLInputElement) =>
          input.selectionStart !== null &&
          input.selectionStart === input.selectionEnd
      )
    )
    .toBe(true);
}

async function expectGrantTransitionFinished(grant: Locator) {
  await expect
    .poll(async () => {
      const [content, footer, height] = await Promise.all([
        grant.getByTestId("grant-rep-content").boundingBox(),
        grant.getByTestId("grant-rep-footer").boundingBox(),
        grant
          .getByTestId("grant-rep-layout")
          .evaluate((element) => Number.parseFloat(element.style.height)),
      ]);
      // Use the animated height; the rendered height can be viewport-clamped.
      return content && footer
        ? Math.abs(content.height + footer.height - height)
        : Infinity;
    })
    .toBeLessThan(0.1);
  await expect
    .poll(() =>
      grant.getByTestId("grant-rep-layout").evaluate((layout) => {
        const panel = layout.closest(".mobile-wrapper-dialog")!;
        let element: Element | null = panel;
        while (element) {
          if (
            element
              .getAnimations({ subtree: element === panel })
              .some((animation) => animation.playState === "running")
          )
            return true;
          element = element.parentElement;
        }
        return false;
      })
    )
    .toBe(false);
}

async function expectCompactGrantLayout(grant: Locator) {
  // Actions follow visible content by 16px, including when the body scrolls.
  await expect
    .poll(async () => {
      const [content, body, action] = await Promise.all([
        grant.getByTestId("grant-rep-content").boundingBox(),
        grant.getByTestId("grant-rep-body").boundingBox(),
        grant
          .getByTestId("grant-rep-footer")
          .getByRole("button")
          .first()
          .boundingBox(),
      ]);
      if (!content || !body || !action) return Infinity;
      return Math.round(
        action.y - Math.min(content.y + content.height, body.y + body.height)
      );
    })
    .toBe(16);
}

function getGrantRepSurface(grant: Locator) {
  return grant
    .getByRole("heading", { name: "Grant Rep", exact: true })
    .locator(
      'xpath=ancestor::*[contains(concat(" ", normalize-space(@class), " "), " mobile-wrapper-dialog ")][1]'
    );
}

async function expectCategorySearchLayout(grant: Locator, isMobile: boolean) {
  await expectGrantTransitionFinished(grant);
  await expectCompactGrantLayout(grant);
  if (!isMobile) return;

  // Focusing search keeps the phone sheet fitted to its content, below the top reserve.
  await expect
    .poll(() =>
      getGrantRepSurface(grant).evaluate((panel) => {
        const bounds = panel.getBoundingClientRect();
        const viewport = window.visualViewport;
        const container = panel.parentElement!.parentElement!;
        const topReserve = Number.parseFloat(
          getComputedStyle(container).paddingTop
        );
        return Math.round(bounds.top - (viewport?.offsetTop ?? 0) - topReserve);
      })
    )
    .toBeGreaterThan(0);
  expect(
    await getGrantRepSurface(grant).evaluate((panel) =>
      [...panel.querySelectorAll("*")]
        .filter((element) =>
          ["auto", "scroll"].includes(getComputedStyle(element).overflowY)
        )
        .map((element) => element.getAttribute("data-testid"))
    )
  ).toEqual(["grant-rep-body"]);
  for (const action of await grant
    .getByTestId("grant-rep-footer")
    .getByRole("button")
    .all()) {
    await expect(action).toBeInViewport();
  }
}

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

async function installCategories(
  page: Page,
  api: string,
  getRating = () => 20
) {
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
            total_rep: getRating(),
            contributor_count: 1,
            authenticated_user_contribution: getRating(),
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
        total_rep: getRating(),
        authenticated_user_contribution: getRating(),
        contributor_count: 1,
        contributors: { data: [], page: 1, next: false, count: 0 },
      },
    })
  );
}

async function setSandboxProfileRep(api: string, rating: number) {
  const url = new URL("/__composer-sandbox/profile-rep", api);
  url.searchParams.set("rating", rating.toString());
  const response = await fetch(url, { method: "POST" });
  expect(response.ok).toBe(true);
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

async function getContributorRowPresentation(list: Locator) {
  // The header stays clear of development-only badges over the bottom row.
  // Wait for its entrance without scrolling a contributor just to measure it.
  await list
    .getByRole("button", { name: "Close", exact: true })
    .click({ trial: true });
  return list
    .getByRole("link")
    .first()
    .evaluate((link) => {
      const row =
        link.parentElement?.tagName === "LI" ? link.parentElement : link;
      const label = link.querySelector(".tw-truncate");
      const avatar = link.querySelector('[aria-hidden="true"] > div');
      if (!label) throw new Error("Missing contributor identity");
      const style = getComputedStyle(row);
      const labelStyle = getComputedStyle(label);
      return {
        height: row.getBoundingClientRect().height,
        background: style.backgroundColor,
        border: style.borderTopWidth,
        radius: style.borderRadius,
        padding: style.padding,
        fontSize: labelStyle.fontSize,
        fontWeight: labelStyle.fontWeight,
        avatarSize: avatar?.getBoundingClientRect().width ?? null,
        avatarRadius: avatar ? getComputedStyle(avatar).borderRadius : null,
      };
    });
}

async function expectContributorHandleHover(list: Locator) {
  const handle = list.getByRole("link").first().locator(".tw-truncate");
  await handle.hover();
  await expect(handle).toHaveCSS("color", "rgb(147, 147, 159)");
  await expect(handle).toHaveCSS("text-decoration-line", "none");
}

async function expectStableRatingSave(
  dialog: Locator,
  sheet: Locator,
  releaseSave: () => void
) {
  const save = dialog.getByRole("button", { name: "Save", exact: true });
  // Compare resting positions, after the sheet's entrance has completed.
  await save.click({ trial: true });
  const controls = dialog.getByRole("button", { name: /^(Back|Close)$/ });
  const controlCount = await controls.count();
  const idleBounds = await sheet.boundingBox();
  try {
    await save.click();
    await expect(save).toHaveAttribute("aria-busy", "true");
    await sheet.evaluate(
      () =>
        new Promise<void>((resolve) =>
          requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
        )
    );
    const busyBounds = await sheet.boundingBox();
    expect(idleBounds).not.toBeNull();
    expect(busyBounds).not.toBeNull();
    expect(busyBounds!.height).toBeCloseTo(idleBounds!.height, 0);
    expect(busyBounds!.y).toBeCloseTo(idleBounds!.y, 0);
    expect(controlCount).toBeGreaterThan(0);
    await expect(controls).toHaveCount(controlCount);
    for (const control of await controls.all())
      await expect(control).toBeDisabled();
  } finally {
    releaseSave();
  }
}

async function expectPersonalTagSpacing(
  tag: Locator,
  isMobile: boolean,
  sameLine = false
) {
  const spacing = await tag.evaluate((element) => {
    const id = element.getAttribute("aria-describedby");
    const amount = id ? document.getElementById(id) : null;
    const identity = element.nextElementSibling;
    const title = identity?.firstElementChild;
    if (!amount || !title) throw new Error("Missing personal REP amount");
    const box = element.getBoundingClientRect();
    const amountBox = amount.getBoundingClientRect();
    const titleBox = title.getBoundingClientRect();
    const contributorBox = identity.nextElementSibling?.getBoundingClientRect();
    const contentTop = Math.min(
      titleBox.top,
      amountBox.top,
      contributorBox?.top ?? Infinity
    );
    const contentBottom = Math.max(
      titleBox.bottom,
      amountBox.bottom,
      contributorBox?.bottom ?? 0
    );
    return {
      height: box.height,
      contentHeight: contentBottom - contentTop,
      titleClipped: title.scrollWidth > title.clientWidth + 1,
      gap: amountBox.top - titleBox.bottom,
      bottom: box.bottom - amountBox.bottom,
      horizontalGap: amountBox.left - titleBox.right,
      centerOffset:
        amountBox.top +
        amountBox.height / 2 -
        titleBox.top -
        titleBox.height / 2,
    };
  });
  if (isMobile && sameLine) {
    expect(spacing.height).toBe(46);
    expect(spacing.centerOffset).toBeCloseTo(0, 0);
    expect(spacing.horizontalGap).toBeGreaterThanOrEqual(6);
  } else if (isMobile) {
    expect(spacing.height).toBeGreaterThanOrEqual(46);
    // Natural wrapping can use one or several rows; constrain the surrounding padding.
    expect(spacing.height).toBeLessThanOrEqual(
      Math.max(46, spacing.contentHeight + 22)
    );
    expect(spacing.titleClipped).toBe(false);
    if (Math.abs(spacing.centerOffset) < 1) {
      expect(spacing.horizontalGap).toBeGreaterThanOrEqual(6);
      expect(spacing.horizontalGap).toBeLessThanOrEqual(14);
    } else expect(spacing.gap).toBeGreaterThanOrEqual(4);
    expect(spacing.bottom).toBeGreaterThanOrEqual(8);
  } else expect(spacing.height).toBe(38);
}

async function expectDesktopRatingPosition(page: Page, name: string) {
  const viewport = page.viewportSize();
  if (!viewport || viewport.width < 768) return;
  const panel = page
    .getByRole("dialog", { name, exact: true })
    .locator(".mobile-wrapper-dialog");
  const isList = /^NIC (Given|Received)$/.test(name);
  const top = isList ? 0.1 : 0.14;
  await expect
    .poll(async () => {
      const box = await panel.boundingBox();
      return box ? Math.abs(box.y - viewport.height * top) : Infinity;
    })
    .toBeLessThanOrEqual(1);
  const box = await panel.boundingBox();
  expect(box).not.toBeNull();
  if (box) {
    expect(box.height).toBeLessThanOrEqual(
      isList ? viewport.height * 0.8 + 1 : viewport.height * 0.86 - 24 + 1
    );
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
  const surface = page
    .getByRole("button", {
      name: `Open REP category ${category}`,
      exact: true,
    })
    .filter({ visible: true })
    .locator("..");
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
  await expect(surface).toHaveCSS("border-top-width", "1px");
  await expect(surface).toHaveCSS("border-bottom-color", "rgba(0, 0, 0, 0)");
  await expect(panel).toHaveCSS("border-top-width", "0px");
  for (const item of [surface, panel]) {
    await expect(item).toHaveCSS("--tw-ring-shadow", "0 0 #0000");
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

  test("keeps Grant Rep compact while selecting assigned chips and searching without saving", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    const chooseCategory = (button: Locator) =>
      isMobile ? button.tap() : button.click();
    let allocationReads = 0;
    let writes = 0;
    let searches = 0;
    const checkedCategories: string[] = [];
    const stats = [
      {
        category: CATEGORY,
        rating: 2000,
        contributor_count: 3,
        rater_contribution: 1000,
      },
      {
        category: "Research",
        rating: 500,
        contributor_count: 2,
        rater_contribution: -25,
      },
      ...[
        "Music",
        "Community",
        "Art",
        "Curation",
        "Memes",
        "AI",
        "Photography",
      ].map((category, index) => ({
        category,
        rating: 900 - index,
        contributor_count: 1,
        rater_contribution: 0,
      })),
    ];
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) => {
        allocationReads++;
        return route.fulfill({
          json: {
            ...allowance,
            rep_rates_left_for_rater: 5000,
            rating_stats: stats,
          },
        });
      }
    );
    await page.route(
      (url) =>
        /^\/api\/+rep\/categories(?:\/availability)?$/.test(url.pathname),
      (route) => {
        const url = new URL(route.request().url());
        if (url.pathname.endsWith("/availability")) {
          checkedCategories.push(url.searchParams.get("param") ?? "");
          return route.fulfill({ json: true });
        }
        searches++;
        return route.fulfill({ json: ["Music"] });
      }
    );
    await page.route(`${api}/api/profiles/${TARGET}/rep/rating`, (route) => {
      writes++;
      return route.fulfill({
        status: 500,
        json: { message: "Unexpected save while choosing categories" },
      });
    });
    await page.route(`${api}/api/profiles/${TARGET}/rep/overview*`, (route) =>
      route.fulfill({
        json: {
          total_rep: stats.reduce((sum, item) => sum + item.rating, 0),
          authenticated_user_contribution: 975,
          contributor_count: 3,
          contributors: { data: [], page: 1, next: false, count: 0 },
        },
      })
    );
    await openProfile(page);
    await page.getByRole("button", { name: "Grant Rep", exact: true }).click();
    const grant = page.getByRole("dialog", { name: "Grant Rep", exact: true });
    const search = grant.getByRole("combobox", {
      name: "Category to grant REP for",
      exact: true,
    });
    await expect(search).toHaveValue("");
    const amount = grant.getByRole("textbox", {
      name: "Your total REP for this category",
      exact: true,
    });
    await expect(amount).toBeEnabled();
    await amount.fill("35");
    await amount.press("Enter");
    expect(writes).toBe(0);
    await expect(
      grant.getByRole("button", { name: "Grant Rep", exact: true })
    ).toBeDisabled();
    await expect(
      grant.getByRole("button", { name: "Cancel", exact: true })
    ).toBeVisible();
    const own = grant.getByRole("group", { name: "You assigned", exact: true });
    await expect(grant.getByText("Current Rep:", { exact: true })).toBeHidden();
    await expect(grant.getByText("Adjustment:", { exact: true })).toBeHidden();
    const profile = grant.getByRole("group", {
      name: "On this profile",
      exact: true,
    });
    await expect(own.getByRole("button")).toHaveCount(2);
    await expect(profile).toHaveCount(0);
    await expect(
      grant
        .getByText(`Your REP assigned to ${TARGET}:`, { exact: true })
        .locator("..")
        .getByText("975", { exact: true })
    ).toBeVisible();
    const surface = page
      .getByRole("dialog", { name: "Grant Rep", exact: true })
      .locator(".mobile-wrapper-dialog");
    // Focus the category field after the sheet is actionable, before measuring.
    await search.click();
    await expect(
      grant.getByText("Type at least 3 characters.", { exact: true })
    ).toBeVisible();
    await expectGrantTransitionFinished(grant);
    await expectCategorySearchLayout(grant, isMobile);
    await expect(amount).toBeVisible();
    await expect(amount).toHaveValue("35");
    expect(searches).toBe(0);
    await surface.screenshot({
      path: testInfo.outputPath("grant-rep-category-step.png"),
    });
    await search.fill("mus");
    await expect(own.getByRole("button")).toHaveCount(0);
    await expect(
      grant.getByRole("option", { name: "Music", exact: true })
    ).toBeVisible();
    await expectCategorySearchLayout(grant, isMobile);
    await expect(amount).toBeVisible();
    await expect(amount).toHaveValue("35");
    await expect(
      grant.getByRole("button", { name: "Grant Rep", exact: true })
    ).toBeEnabled();
    await expect(search).toBeFocused();
    await surface.screenshot({
      path: testInfo.outputPath("grant-rep-search-with-amount.png"),
    });
    await expect(
      grant.getByRole("option", { name: "mus", exact: true })
    ).toHaveCount(0);
    const musicSuggestion = grant.getByRole("option", {
      name: "Music",
      exact: true,
    });
    if (isMobile) {
      await musicSuggestion.tap();
    } else {
      await musicSuggestion.hover();
      await page.mouse.down();
      await expect(search).toBeFocused();
      await page.mouse.up();
    }
    await expect(search).toBeEditable();
    await expect(amount).toHaveValue("35");
    await expectFocusedAmountWithoutSelection(amount);
    await expect(
      grant.getByText("Current Rep:", { exact: true }).locator("..")
    ).toHaveText("Current Rep:0");
    await expect(
      grant.getByText("Adjustment:", { exact: true }).locator("..")
    ).toHaveText("Adjustment:+35");
    await expect(
      grant.getByRole("button", { name: "Grant Rep", exact: true })
    ).toBeEnabled();
    await amount.fill("5001");
    await expect(
      grant.getByRole("button", { name: "Grant Rep", exact: true })
    ).toBeDisabled();
    await expect(
      grant.getByText("Your available REP:", { exact: true }).locator("..")
    ).toHaveCSS("color", "rgb(251, 113, 133)");
    await amount.blur();
    await expect(amount).toHaveValue("5,001");
    await expect(
      grant.getByRole("button", { name: "Grant Rep", exact: true })
    ).toBeDisabled();
    await amount.click();
    await amount.fill("35");
    await expect(amount).toHaveValue("35");
    await expect(
      grant.getByRole("button", { name: "Grant Rep", exact: true })
    ).toBeEnabled();
    await grant
      .getByRole("button", { name: "Change category", exact: true })
      .click();
    await expect(
      grant.getByText("Type at least 3 characters.", { exact: true })
    ).toBeVisible();
    await expectCategorySearchLayout(grant, isMobile);
    await chooseCategory(
      own.getByRole("button", { name: "Research -25", exact: true })
    );
    await expect(search).toHaveValue("Research");
    await expect(search).toBeEditable();
    await expect(amount).toHaveValue("-25");
    await expectFocusedAmountWithoutSelection(amount);
    await expect(
      grant.getByText("Current Rep:", { exact: true }).locator("..")
    ).toHaveText("Current Rep:-25");
    await expect(
      grant.getByText("Adjustment:", { exact: true }).locator("..")
    ).toHaveText("Adjustment:0");
    await expect(
      grant.getByText(
        "Enter the total you want to give, including any existing rating.",
        { exact: true }
      )
    ).toBeVisible();
    await expect(
      grant.getByRole("button", { name: "Save", exact: true })
    ).toBeDisabled();
    const selectedPill = own.getByRole("button", {
      name: "Research -25",
      exact: true,
    });
    await expect(selectedPill).toHaveAttribute("aria-pressed", "true");
    await expect(selectedPill).toHaveCSS("height", "38px");
    await expect(selectedPill).toHaveCSS("border-radius", "8px");
    await expect(selectedPill).toHaveCSS(
      "border-top-color",
      "rgba(255, 255, 255, 0.3)"
    );
    await expect(selectedPill).toHaveCSS(
      "background-color",
      "rgba(255, 255, 255, 0.1)"
    );
    await amount.click();
    await amount.fill("-15");
    await expect(
      grant.getByRole("status").getByText("+10", { exact: true })
    ).toHaveCSS("color", "rgb(52, 211, 153)");
    await amount.fill("-35");
    await expect(
      grant.getByText("Current Rep:", { exact: true }).locator("..")
    ).toHaveText("Current Rep:-25");
    await expect(
      grant.getByText("Adjustment:", { exact: true }).locator("..")
    ).toHaveText("Adjustment:-10");
    await expect(
      grant.getByRole("status").getByText("-10", { exact: true })
    ).toHaveCSS("color", "rgb(251, 113, 133)");
    await expect(
      grant.getByRole("button", { name: "Save", exact: true })
    ).toBeEnabled();
    await expectCompactGrantLayout(grant);
    await grant
      .getByRole("button", { name: "Change category", exact: true })
      .click();
    await expect(amount).toBeVisible();
    await amount.fill("45");
    await chooseCategory(
      own.getByRole("button", { name: "Artist 1,000", exact: true })
    );
    await expect(amount).toHaveValue("45");
    await expectFocusedAmountWithoutSelection(amount);
    await expect(
      grant.getByText("Current Rep:", { exact: true }).locator("..")
    ).toHaveText("Current Rep:+1,000");
    expect(allocationReads).toBe(1);
    expect(searches).toBe(1);
    expect(checkedCategories).toEqual(["mus", "Music"]);
    expect(writes).toBe(0);
    await expectNoHorizontalOverflow(page);
    await expectAxeClean(page);
    await surface.screenshot({
      path: testInfo.outputPath("grant-rep-two-step.png"),
    });
  });

  test("keeps every category suggestion available with clear guidance and one content scroller", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    const categories = [
      "Memes nominee",
      "Memes Nominee",
      "MEMES NOMINEE",
      "Memes nomineer",
      "Memes Nominees",
      "TheMemesNomination",
      "Photography",
      ...Array.from(
        { length: 24 },
        (_, index) => `Community category ${index}`
      ),
      "MemesNominee",
    ];
    let writes = 0;
    if (isMobile) await page.setViewportSize({ width: 320, height: 727 });
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) => route.fulfill({ json: allowance })
    );
    await page.route(
      (url) =>
        /^\/api\/+rep\/categories(?:\/availability)?$/.test(url.pathname),
      (route) =>
        route.fulfill({
          json: new URL(route.request().url()).pathname.endsWith(
            "/availability"
          )
            ? true
            : categories,
        })
    );
    await page.route(`${api}/api/profiles/${TARGET}/rep/rating`, (route) => {
      writes++;
      return route.fulfill({
        status: 500,
        json: { message: "Unexpected REP write" },
      });
    });
    await openProfile(page);
    await page.getByRole("button", { name: "Grant Rep", exact: true }).click();
    const grant = page.getByRole("dialog", { name: "Grant Rep", exact: true });
    const search = grant.getByRole("combobox", {
      name: "Category to grant REP for",
      exact: true,
    });
    const amount = grant.getByRole("textbox", {
      name: "Your total REP for this category",
      exact: true,
    });
    await amount.fill("35");

    for (const query of ["memes nominee", "memes no"]) {
      await search.fill(query);
      const list = grant.getByRole("listbox");
      const options = list.getByRole("option");
      await expect(options).toHaveCount(categories.length);
      if (isMobile) await expectCategorySearchLayout(grant, true);
      for (const category of categories) {
        const name =
          category === "MemesNominee"
            ? "MemesNominee Counts for submissions"
            : category;
        await expect(
          list.getByRole("option", { name, exact: true })
        ).toBeVisible();
      }
      const listId = await list.getAttribute("id");
      expect(listId).toBeTruthy();
      await expect(search).toHaveAttribute("aria-controls", listId ?? "");
      await expect(search).toHaveAttribute("aria-expanded", "true");
      const first = options.first();
      await expect(first).toHaveAccessibleName(
        "MemesNominee Counts for submissions"
      );
      await expect(first).toHaveAttribute("aria-selected", "true");
      await expect(first).toHaveCSS("color", "rgb(236, 236, 238)");
      await expect(first).toHaveCSS(
        "background-color",
        "rgba(38, 39, 43, 0.6)"
      );
      await expect(first).toHaveCSS("box-shadow", "none");
      await expect(first).not.toHaveCSS("outline-style", "solid");
      await expect(first.getByText("Counts for submissions")).toHaveCSS(
        "color",
        "rgb(110, 231, 183)"
      );
      const firstId = await first.getAttribute("id");
      expect(firstId).toBeTruthy();
      await expect(search).toHaveAttribute(
        "aria-activedescendant",
        firstId ?? ""
      );
      if (!isMobile) {
        const last = options.last();
        await search.press("ArrowUp");
        await expect(last).toHaveAttribute("aria-selected", "true");
        await expect(last).toBeInViewport();
        expect(
          await grant
            .getByTestId("grant-rep-body")
            .evaluate((body) => body.scrollTop)
        ).toBeGreaterThan(0);
        await search.press("ArrowDown");
        await expect(first).toHaveAttribute("aria-selected", "true");
        await expect(first).toBeInViewport();
      }
      await expect(
        grant.getByRole("button", { name: /show (?:all|more)/i })
      ).toHaveCount(0);
      const warning = grant.getByText(
        `"${query}" is a separate category. Only MemesNominee counts for submissions.`,
        { exact: true }
      );
      await expect(warning).toHaveCount(1);
      await expect(warning).toBeVisible();
      const [inputBox, warningBox, firstBox] = await Promise.all([
        search.boundingBox(),
        warning.boundingBox(),
        first.boundingBox(),
      ]);
      expect(warningBox!.y).toBeGreaterThanOrEqual(
        inputBox!.y + inputBox!.height
      );
      expect(firstBox!.y).toBeGreaterThanOrEqual(
        warningBox!.y + warningBox!.height
      );
      expect(
        await list.evaluate((element) => {
          const body = element.closest('[data-testid="grant-rep-body"]');
          const owners: string[] = [];
          for (
            let current: Element | null = element;
            current && current !== body;
            current = current.parentElement
          ) {
            if (
              ["auto", "scroll"].includes(getComputedStyle(current).overflowY)
            )
              owners.push(current.className);
          }
          return { hasBody: body !== null, owners };
        })
      ).toEqual({ hasBody: true, owners: [] });

      const boxes = await options.evaluateAll((elements) =>
        elements.map((element) => {
          const box = element.getBoundingClientRect();
          return { x: box.x, y: box.y, width: box.width, height: box.height };
        })
      );
      expect(new Set(boxes.map((box) => Math.round(box.y))).size).toBeLessThan(
        categories.length
      );
      for (const box of boxes) {
        expect(box.height).toBeGreaterThanOrEqual(32);
      }
      await expect(amount).toBeVisible();
      await expect(amount).toHaveValue("35");
      expect((await amount.boundingBox())!.y).toBeGreaterThanOrEqual(
        Math.max(...boxes.map((box) => box.y + box.height))
      );
    }

    await page.emulateMedia({ forcedColors: "active" });
    try {
      const active = grant.getByRole("option", { selected: true });
      const inactive = grant.getByRole("option", { selected: false }).first();
      await expect(active).not.toHaveCSS("outline-style", "solid");
      expect(
        await active.evaluate(
          (option) => getComputedStyle(option).backgroundColor
        )
      ).not.toBe(
        await inactive.evaluate(
          (option) => getComputedStyle(option).backgroundColor
        )
      );
    } finally {
      await page.emulateMedia({ forcedColors: "none" });
    }

    if (!isMobile) {
      const active = grant.getByRole("option", { selected: true });
      await active.focus();
      await expect(active).toHaveCSS("outline-style", "solid");
      await expect(active).toHaveCSS("outline-color", "rgb(82, 139, 255)");
      await search.focus();
      await expect(active).not.toHaveCSS("outline-style", "solid");
    }

    await search.scrollIntoViewIfNeeded();
    await expectGrantTransitionFinished(grant);
    await getGrantRepSurface(grant).screenshot({
      path: testInfo.outputPath("grant-rep-all-category-results.png"),
    });
    const list = grant.getByRole("listbox");
    const lookalike = list.getByRole("option", {
      name: "Memes nominee",
      exact: true,
    });
    if (isMobile) {
      await lookalike.tap();
    } else {
      await search.press("ArrowDown");
      await expect(lookalike).toHaveAttribute("aria-selected", "true");
      await expect(search).toHaveValue("memes no");
      await search.press("Enter");
    }
    await expect(search).toHaveValue("Memes nominee");
    await expect(amount).toBeVisible();
    await expect(amount).toHaveValue("35");
    await expect(
      grant.getByText(
        '"Memes nominee" is a separate category. Only MemesNominee counts for submissions.',
        { exact: true }
      )
    ).toHaveCount(1);
    await grant
      .getByRole("button", { name: "Change category", exact: true })
      .click();
    await search.fill("memes no");
    const canonical = grant.getByRole("option", {
      name: "MemesNominee Counts for submissions",
      exact: true,
    });
    await expect(canonical).toBeVisible();
    if (isMobile) await canonical.tap();
    else await search.press("Enter");
    await expect(search).toHaveValue("MemesNominee");
    await expect(amount).toBeVisible();
    await expect(grant.getByText(/Memes submissions require/)).toHaveCount(1);
    await expect(
      grant.getByText(/is a separate category\. Only MemesNominee/)
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
    await expectAxeClean(page);
    expect(writes).toBe(0);
    await getGrantRepSurface(grant).screenshot({
      path: testInfo.outputPath("grant-rep-category-suggestions.png"),
    });
  });

  test("opens Grant Rep without chip groups when no REP is assigned", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) =>
        route.fulfill({
          json: {
            ...allowance,
            rating_stats: [
              {
                category: CATEGORY,
                rating: 20,
                contributor_count: 1,
                rater_contribution: 0,
              },
            ],
          },
        })
    );
    await page.route(`${api}/api/profiles/${TARGET}/rep/overview*`, (route) =>
      route.fulfill({
        json: {
          total_rep: 20,
          authenticated_user_contribution: 0,
          contributor_count: 1,
          contributors: { data: [], page: 1, next: false, count: 0 },
        },
      })
    );
    await openProfile(page);
    await page.getByRole("button", { name: "Grant Rep", exact: true }).click();
    const grant = page.getByRole("dialog", { name: "Grant Rep", exact: true });
    await expect(
      grant.getByRole("combobox", {
        name: "Category to grant REP for",
        exact: true,
      })
    ).toHaveValue("");
    await expect(
      grant.getByText("Your available REP:", { exact: true })
    ).toBeVisible();
    await expect(
      grant.getByText(`Your REP assigned to ${TARGET}:`, { exact: true })
    ).toBeVisible();
    await expect(
      grant
        .getByText("Your available REP:", { exact: true })
        .locator("..")
        .getByText("80", { exact: true })
    ).toBeVisible();
    await expect(
      grant
        .getByText(`Your REP assigned to ${TARGET}:`, { exact: true })
        .locator("..")
        .getByText("0", { exact: true })
    ).toBeVisible();
    await expect(grant.getByRole("group")).toHaveCount(0);
    await expect(
      grant.getByText("No REP assigned yet.", { exact: true })
    ).toHaveCount(0);
    await expect(grant.getByRole("textbox")).toHaveCount(1);
    await expect(grant.getByRole("combobox")).toHaveCount(1);
    await expect(
      grant.getByRole("textbox", {
        name: "Your total REP for this category",
        exact: true,
      })
    ).toBeEnabled();
    await expect(
      grant.getByRole("button", { name: "Grant Rep", exact: true })
    ).toBeDisabled();
    await expect(
      grant.getByRole("button", { name: "Cancel", exact: true })
    ).toBeVisible();
    await expectCompactGrantLayout(grant);
    const amount = grant.getByRole("textbox", {
      name: "Your total REP for this category",
      exact: true,
    });
    const search = grant.getByRole("combobox", {
      name: "Category to grant REP for",
      exact: true,
    });
    const action = grant.getByRole("button", { name: "Cancel", exact: true });
    await expectGrantTransitionFinished(grant);
    await search.click();
    await expect(
      grant.getByText("Type at least 3 characters.", { exact: true })
    ).toBeVisible();
    await expectCategorySearchLayout(grant, isMobile);
    await expect(amount).toBeVisible();
    const prompt = grant.getByText("Type at least 3 characters.", {
      exact: true,
    });
    const promptBox = await prompt.boundingBox();
    const amountBox = await amount.boundingBox();
    expect(amountBox!.y).toBeGreaterThanOrEqual(
      promptBox!.y + promptBox!.height
    );
    await expect(action).toBeInViewport();
    await amount.click();
    await expect(
      grant.getByText("Type at least 3 characters.", { exact: true })
    ).toBeHidden();
    await expect(amount).toBeFocused();
    await expectNoHorizontalOverflow(page);
    await page
      .getByRole("dialog", { name: "Grant Rep", exact: true })
      .locator(".mobile-wrapper-dialog")
      .screenshot({
        path: testInfo.outputPath("grant-rep-no-assigned-chips.png"),
      });
    await grant.getByRole("button", { name: "Cancel", exact: true }).click();
    await expect(grant).toBeHidden();
  });

  test("keeps Grant Rep actions reachable with long assigned lists and feedback in a short viewport", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    const ratings = Array.from({ length: 12 }, (_, index) => ({
      category: `Assigned category ${index}`,
      rating: 100,
      contributor_count: 1,
      rater_contribution: index + 1,
    }));
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) =>
        route.fulfill({ json: { ...allowance, rating_stats: ratings } })
    );
    await page.route(
      (url) =>
        /^\/api\/+rep\/categories(?:\/availability)?$/.test(url.pathname),
      (route) => {
        const url = new URL(route.request().url());
        return route.fulfill({
          json: url.pathname.endsWith("/availability")
            ? url.searchParams.get("param") !== "Unavailable category"
            : [],
        });
      }
    );
    await page.route(`${api}/api/profiles/${TARGET}/rep/rating`, (route) =>
      route.fulfill({
        status: 400,
        json: { message: "Layout test save error" },
      })
    );
    await openProfile(page);
    await page.getByRole("button", { name: "Grant Rep", exact: true }).click();
    const grant = page.getByRole("dialog", { name: "Grant Rep", exact: true });
    const search = grant.getByRole("combobox", {
      name: "Category to grant REP for",
      exact: true,
    });
    const amount = grant.getByRole("textbox", {
      name: "Your total REP for this category",
      exact: true,
    });
    const assigned = grant.getByRole("group", {
      name: "You assigned",
      exact: true,
    });
    await expect(assigned.getByRole("button")).toHaveCount(12);
    expect(
      await assigned.evaluate((group) => {
        const list = group.lastElementChild!;
        return list.scrollHeight > list.clientHeight;
      })
    ).toBe(false);
    await assigned
      .getByRole("button", { name: "Assigned category 11 12", exact: true })
      .click();
    await expect(amount).toHaveValue("12");
    await expectCompactGrantLayout(grant);
    await amount.fill("13");
    await grant.getByRole("button", { name: "Save", exact: true }).click();
    await expect(
      grant.getByText("Layout test save error", { exact: true })
    ).toBeVisible();
    await expectCompactGrantLayout(grant);
    await grant
      .getByRole("button", { name: "Dismiss error", exact: true })
      .click();
    await search.fill("Unavailable category");
    await expect(search).toHaveAttribute("aria-invalid", "true");
    await expectCategorySearchLayout(grant, isMobile);
    await search.fill("MemesNominee");
    await expect(search).toHaveAttribute("aria-invalid", "false");
    await expect(grant.getByText(/50,000/)).toBeVisible();
    await expect(amount).toBeVisible();
    await amount.click();
    await page.setViewportSize({ width: isMobile ? 320 : 1280, height: 520 });
    const cancel = grant.getByRole("button", { name: "Cancel", exact: true });
    await expect(cancel).toBeInViewport();
    await expect(
      grant.getByRole("button", { name: "Grant Rep", exact: true })
    ).toBeInViewport();
    expect(
      await grant
        .getByTestId("grant-rep-body")
        .evaluate((body) => body.scrollHeight > body.clientHeight)
    ).toBe(true);
    await amount.scrollIntoViewIfNeeded();
    await expect(amount).toBeInViewport();
    await expect(cancel).toBeInViewport();
    await expectGrantTransitionFinished(grant);
    const scrolledAmount = await amount.boundingBox();
    await amount.fill("50");
    await expect(amount).toBeFocused();
    await expectGrantTransitionFinished(grant);
    expect(
      Math.abs((await amount.boundingBox())!.y - scrolledAmount!.y)
    ).toBeLessThanOrEqual(1);
    await expect(cancel).toBeInViewport();
    await expectNoHorizontalOverflow(page);
    await page
      .getByRole("dialog", { name: "Grant Rep", exact: true })
      .locator(".mobile-wrapper-dialog")
      .screenshot({
        path: testInfo.outputPath("grant-rep-short-viewport.png"),
      });
  });

  test("grants first REP from the pinned You row and refreshes the tag and header totals", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    let rating = 0;
    const saved: unknown[] = [];
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) =>
        route.fulfill({
          json: {
            ...allowance,
            rep_rates_left_for_rater: 80 - rating,
            rating_stats: [
              {
                category: CATEGORY,
                rating: 20 + rating,
                contributor_count: rating === 0 ? 20 : 21,
                rater_contribution: rating,
              },
            ],
          },
        })
    );
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/categories?*`,
      (route) =>
        route.fulfill({
          json: {
            data: [
              {
                category: CATEGORY,
                total_rep: 20 + rating,
                contributor_count: rating === 0 ? 20 : 21,
                authenticated_user_contribution: rating,
                top_contributors: [],
              },
            ],
            count: 1,
            page: 1,
            next: false,
          },
        })
    );
    await page.route(`${api}/api/profiles/${TARGET}/rep/overview*`, (route) =>
      route.fulfill({
        json: {
          total_rep: 20 + rating,
          authenticated_user_contribution: rating,
          contributor_count: rating === 0 ? 20 : 21,
          contributors: { data: [], page: 1, next: false, count: 0 },
        },
      })
    );
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/categories/*/contributors?*`,
      (route) =>
        route.fulfill({
          json: {
            data: Array.from({ length: 20 }, (_, index) => ({
              profile: {
                id: `other-${index}`,
                handle: `other-rater-${index}`,
                primary_address: `0x${(index + 1).toString(16).padStart(40, "0")}`,
                pfp: "/icon-512.png",
              },
              contribution: 1,
            })),
            page: 1,
            next: false,
          },
        })
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
          throw new Error("Unexpected first-grant payload");
        saved.push(body);
        rating = body.amount;
        await route.fulfill({ json: {} });
      }
    );
    if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
    await openProfile(page);
    const tag = page.getByRole("button", {
      name: `Open REP category ${CATEGORY}`,
      exact: true,
    });
    await tag.click();
    const panel = categoryPanel(page);
    const amount = panel.getByRole("textbox", {
      name: `Your REP in ${CATEGORY}`,
      exact: true,
    });
    await expect(amount).toHaveValue("");
    await expect(amount).toHaveAttribute("placeholder", "0");
    await expect(amount).toHaveAttribute("aria-invalid", "false");
    if (isMobile) await expect(amount).not.toBeFocused();
    else await expect(amount).toBeFocused();
    await expect(panel.getByRole("link").first()).toHaveAccessibleName("You");
    await amount.scrollIntoViewIfNeeded();
    const inputOffset = await amount.evaluate((field) => {
      const form = field.closest("form");
      if (!form) throw new Error("Missing category form");
      return (
        field.getBoundingClientRect().top - form.getBoundingClientRect().top
      );
    });
    const raters = panel
      .getByRole("link", { name: "other-rater-0", exact: true })
      .locator("..")
      .locator("..");
    // Mobile WebKit does not support mouse.wheel; scroll the same container.
    await raters.evaluate((list) => list.scrollTo(0, list.scrollHeight));
    await expect
      .poll(() => raters.evaluate((list) => list.scrollTop))
      .toBeGreaterThan(0);
    await expect(amount).toBeInViewport();
    expect(
      await amount.evaluate((field) => {
        const form = field.closest("form");
        if (!form) throw new Error("Missing category form");
        return (
          field.getBoundingClientRect().top - form.getBoundingClientRect().top
        );
      })
    ).toBeCloseTo(inputOffset, 0);
    await amount.fill("81");
    await expect(
      panel.getByText("Available REP 80", { exact: true })
    ).toHaveCSS("color", "rgb(251, 113, 133)");
    await expect(
      panel.getByRole("button", { name: "Grant Rep", exact: true })
    ).toBeDisabled();
    await amount.press("Escape");
    await amount.fill("15");
    const grant = panel.getByRole("button", { name: "Grant Rep", exact: true });
    await expect(grant).toBeEnabled();
    await expect(grant).toHaveCSS("height", "30px");
    await expect(grant).toHaveCSS("font-size", "12px");
    await expect(grant).toHaveCSS("border-radius", "8px");
    const grantBox = await grant.boundingBox();
    const amountBox = await panel
      .getByRole("textbox", { name: `Your REP in ${CATEGORY}`, exact: true })
      .locator("..")
      .boundingBox();
    expect(grantBox).not.toBeNull();
    expect(amountBox).not.toBeNull();
    if (grantBox && amountBox) {
      expect(grantBox.x + grantBox.width).toBeCloseTo(
        amountBox.x + amountBox.width,
        1
      );
    }
    await expect(
      panel.getByRole("button", {
        name: `Open category ${CATEGORY}`,
        exact: true,
      })
    ).toBeVisible();
    await panel.screenshot({
      path: testInfo.outputPath("rep-pinned-grant.png"),
    });
    expect(saved).toHaveLength(0);
    await amount.press("Escape");
    await expect(amount).toHaveValue("");
    await amount.fill("15");
    if (isMobile) await grant.click();
    else await amount.press("Enter");
    await expect(panel.getByText("Saved", { exact: true })).toBeVisible();
    await expect(
      panel.getByText("Available REP 65", { exact: true })
    ).toBeVisible();
    if (isMobile) await expect(panel).toBeHidden();
    await expect(tag).toHaveAccessibleDescription("You assigned: 15");
    expect(saved).toEqual([{ amount: 15, category: CATEGORY }]);
    const rep = page
      .getByRole("region", { name: "REP", exact: true })
      .filter({ visible: true });
    await expect(
      rep.getByText("You assigned: 15", { exact: true }).first()
    ).toBeVisible();
    await expect(rep.getByText("35", { exact: true }).first()).toBeVisible();
    if (!isMobile) {
      await expect(panel).toBeVisible();
    }
    await expectNoHorizontalOverflow(page);
    await page.screenshot({
      path: testInfo.outputPath("rep-first-contribution.png"),
      fullPage: true,
    });
  });

  for (const largeTotals of [false, true]) {
    test(`keeps NIC contributors aligned with ${largeTotals ? "large" : "standard"} totals`, async ({
      page,
      baseURL,
      isMobile,
    }, testInfo) => {
      const api = getSandboxApiOrigin(baseURL);
      const summary = largeTotals
        ? { received: 2834567, given: 6789123, raters: 146, receivers: 397 }
        : { received: 4689, given: 4689, raters: 3, receivers: 3 };
      if (isMobile && largeTotals)
        await page.setViewportSize({ width: 320, height: 844 });
      await page.route(`${api}/api/profiles/*/cic/overview*`, (route) => {
        const given =
          new URL(route.request().url()).searchParams.get("direction") ===
          "outgoing";
        const total = given ? summary.given : summary.received;
        const count = given ? summary.receivers : summary.raters;
        return route.fulfill({
          json: {
            total_cic: total,
            authenticated_user_contribution: 100,
            contributor_count: count,
            contributors: {
              data: Array.from({ length: largeTotals ? 6 : 3 }, (_, index) => ({
                profile: {
                  handle: `nic-rater-${index}`,
                  primary_address: `0x${(index + 1).toString(16).padStart(40, "0")}`,
                  pfp: "/icon-512.png",
                },
                contribution: 100,
              })),
              page: 1,
              next: false,
              count,
            },
          },
        });
      });
      await openProfile(page);
      if (isMobile)
        await page.getByRole("button", { name: "NIC", exact: true }).click();
      const nic = page.getByRole("region", { name: "NIC", exact: true });
      for (const direction of ["Received", "Given"] as const) {
        if (direction === "Given")
          await nic.getByRole("button", { name: "Given", exact: true }).click();
        const given = direction === "Given";
        const total = given ? summary.given : summary.received;
        const count = given ? summary.receivers : summary.raters;
        const contributors = nic.getByRole("button", {
          name: `View NIC ${direction}: ${count} ${given ? "receivers" : "raters"}`,
          exact: true,
        });
        await expect(contributors).toBeVisible();
        const avatarCount = largeTotals ? 5 : 3;
        await expect(nic.getByRole("link")).toHaveCount(
          isMobile ? 0 : avatarCount
        );
        const score = nic.getByText(total.toLocaleString("en-US"), {
          exact: true,
        });
        await expect(score).toBeVisible();
        const scoreBox = await score.boundingBox();
        const contributorsBox = await contributors.boundingBox();
        const nicBox = await nic.boundingBox();
        expect(scoreBox).not.toBeNull();
        expect(contributorsBox).not.toBeNull();
        expect(nicBox).not.toBeNull();
        const sameLine =
          Math.abs(
            contributorsBox!.y +
              contributorsBox!.height / 2 -
              scoreBox!.y -
              scoreBox!.height / 2
          ) <= 3;
        if (largeTotals && isMobile) expect(sameLine).toBe(false);
        if (!largeTotals) expect(sameLine).toBe(true);
        if (sameLine) {
          expect(contributorsBox!.x).toBeGreaterThan(
            scoreBox!.x + scoreBox!.width
          );
          expect(contributorsBox!.x + contributorsBox!.width).toBeCloseTo(
            nicBox!.x + nicBox!.width,
            0
          );
        } else {
          const groupBox = await nic
            .getByRole("button", {
              name: `View NIC ${direction}: ${count} ${given ? "receivers" : "raters"}`,
              exact: true,
            })
            .locator("..")
            .boundingBox();
          expect(groupBox).not.toBeNull();
          expect(groupBox!.x).toBeCloseTo(nicBox!.x, 0);
          expect(groupBox!.y).toBeGreaterThanOrEqual(
            scoreBox!.y + scoreBox!.height
          );
          expect(groupBox!.x + groupBox!.width).toBeLessThanOrEqual(
            nicBox!.x + nicBox!.width + 1
          );
        }
        await expectNoHorizontalOverflow(page);
        await nic.screenshot({
          path: testInfo.outputPath(`nic-${direction.toLowerCase()}-total.png`),
        });
      }
    });
  }

  test("signed-out viewers do not see personal amounts from stale REP responses", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    // Give both the server and browser reads a stale personal contribution.
    await setSandboxProfileRep(getSandboxApiOrigin(baseURL), 20);
    if (isMobile) await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`/${TARGET}`, { waitUntil: "domcontentloaded" });
    if (isMobile)
      await page
        .getByRole("button", { name: "Open menu", exact: true })
        .click();
    await expect(
      page.getByRole("button", {
        name: testInfo.project.name.startsWith("capacitor-")
          ? "Connect"
          : "Connect Wallet",
        exact: true,
      })
    ).toBeVisible();
    if (isMobile) await page.keyboard.press("Escape");
    const rep = page
      .getByRole("region", { name: "REP", exact: true })
      .filter({ visible: true });
    for (const direction of ["Received", "Given"]) {
      await rep.getByRole("button", { name: direction, exact: true }).click();
      await expect(
        rep.getByRole("button", {
          name: `Open REP category ${CATEGORY}`,
          exact: true,
        })
      ).toBeVisible();
      await expect(
        page.getByText(/You assigned:|Assigned to you:/)
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Grant Rep", exact: true })
      ).toHaveCount(0);
      await expect(
        page.getByRole("button", { name: "Rate NIC", exact: true })
      ).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("keeps REP header actions within phone width with enlarged text", async ({
    page,
    baseURL,
  }, testInfo) => {
    await page.route(
      `${getSandboxApiOrigin(baseURL)}/api/profiles/${TARGET}/rep/overview*`,
      (route) =>
        route.fulfill({
          json: {
            total_rep: 9_000_000,
            authenticated_user_contribution: 9_000_000,
            contributor_count: 1,
            contributors: { data: [], page: 1, next: false },
          },
        })
    );
    await page.setViewportSize({ width: 320, height: 844 });
    await openProfile(page);
    await page.evaluate(() => {
      document.documentElement.style.fontSize = "32px";
    });
    const rep = page
      .getByRole("region", { name: "REP", exact: true })
      .filter({ visible: true });
    const summary = rep
      .getByText("You assigned: 9,000,000", { exact: true })
      .first();
    const grant = rep.getByRole("button", { name: "Grant Rep", exact: true });
    await expect(summary).toBeVisible();
    await expect(grant).toBeVisible();
    const summaryBox = await summary.boundingBox();
    const grantBox = await grant.boundingBox();
    expect(summaryBox).not.toBeNull();
    expect(grantBox).not.toBeNull();
    for (const box of [summaryBox!, grantBox!]) {
      expect(box.x).toBeGreaterThanOrEqual(0);
      expect(box.x + box.width).toBeLessThanOrEqual(320);
    }
    expect(grantBox!.y).toBeGreaterThanOrEqual(
      summaryBox!.y + summaryBox!.height + 8
    );
    await rep.screenshot({
      path: testInfo.outputPath("rep-header-large-text.png"),
    });
  });

  test("wraps REP contributors only when their content needs more room", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    const longCategory =
      "A very long community category name that stays readable";
    await page.route(`${api}/api/profiles/*/rep/categories?*`, (route) =>
      route.fulfill({
        json: {
          data: ["Art", longCategory].map((category, index) => ({
            category,
            total_rep: 1380,
            contributor_count: index === 0 ? 1 : 60,
            authenticated_user_contribution: index === 0 ? 20 : null,
            top_contributors: Array.from(
              { length: index === 0 ? 1 : 3 },
              (_, i) => ({
                profile: {
                  id: `rater-${i}`,
                  handle: `rater-${i}`,
                  pfp: "/icon-512.png",
                },
                contribution: 10,
              })
            ),
          })),
          count: 2,
          page: 1,
          next: false,
        },
      })
    );
    await openProfile(page);
    for (const width of isMobile ? [320, 390, 430, 540, 768] : [1280]) {
      await page.setViewportSize({ width, height: 844 });
      const rep = page
        .getByRole("region", { name: "REP", exact: true })
        .filter({ visible: true });
      for (const direction of ["Received", "Given"] as const) {
        await rep
          .getByRole("button", { name: direction, exact: true })
          .or(rep.getByRole("tab", { name: direction, exact: true }))
          .filter({ visible: true })
          .first()
          .click();
        const tag = rep
          .getByRole("button", { name: "Open REP category Art", exact: true })
          .locator("..");
        const count = tag.getByText(
          direction === "Received" ? "1 rater" : "1 receiver",
          { exact: true }
        );
        await expect(count).toBeVisible();
        const assigned = tag.getByText(
          direction === "Received" ? "You assigned: 20" : "Assigned to you: 20",
          { exact: true }
        );
        const assignedBox = await assigned.boundingBox();
        const peopleBox = await count.boundingBox();
        const firstAvatarBox = await tag
          .getByRole("img", { name: "rater-0", exact: true })
          .boundingBox();
        expect(assignedBox).not.toBeNull();
        expect(peopleBox).not.toBeNull();
        expect(firstAvatarBox).not.toBeNull();
        const onSameLine =
          Math.abs(
            assignedBox!.y +
              assignedBox!.height / 2 -
              peopleBox!.y -
              peopleBox!.height / 2
          ) < 1;
        if (onSameLine) {
          expect(firstAvatarBox!.x).toBeGreaterThanOrEqual(
            assignedBox!.x + assignedBox!.width + 6
          );
        } else {
          expect(peopleBox!.y).toBeGreaterThanOrEqual(
            assignedBox!.y + assignedBox!.height + 4
          );
          const nameBox = await tag
            .getByText("Art", { exact: true })
            .boundingBox();
          expect(firstAvatarBox!.x).toBeCloseTo(nameBox!.x, 0);
        }
        // A full-row compact tag has room for all of this short category at these widths.
        if (width >= 390) expect(onSameLine).toBe(true);
        await expectPersonalTagSpacing(tag.getByRole("button"), isMobile);
        const longTag = rep
          .getByRole("button", {
            name: `Open REP category ${longCategory}`,
            exact: true,
          })
          .locator("..");
        const label = longTag.getByText(longCategory, { exact: true });
        const contributors = longTag.getByText(
          direction === "Received" ? "60 raters" : "60 receivers",
          { exact: true }
        );
        await expect(contributors).toBeVisible();
        if (width <= 430) {
          const labelBox = await label.boundingBox();
          const countBox = await contributors.boundingBox();
          expect(labelBox).not.toBeNull();
          expect(countBox).not.toBeNull();
          expect(countBox!.y).toBeGreaterThanOrEqual(
            labelBox!.y + labelBox!.height + 4
          );
          const avatarBox = await longTag
            .getByRole("img", { name: "rater-0", exact: true })
            .boundingBox();
          expect(avatarBox).not.toBeNull();
          expect(avatarBox!.x).toBeCloseTo(labelBox!.x, 0);
          expect(
            await label.evaluate(
              (element) => element.scrollWidth <= element.clientWidth + 1
            )
          ).toBe(true);
        }
        await expectNoHorizontalOverflow(page);
        await longTag.scrollIntoViewIfNeeded();
        await page.screenshot({
          path: testInfo.outputPath(
            `rep-tags-${direction.toLowerCase()}-${width}.png`
          ),
        });
      }
    }
  });

  test("links category avatars on desktop and expands the tag on touch", async ({
    page,
    baseURL,
    isMobile,
    browserName,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    await installCategories(page, api);
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) => route.fulfill({ json: allowance })
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
              top_contributors: [
                {
                  profile: {
                    id: "00000000-0000-4000-8000-000000000531",
                    handle: "playwright",
                    primary_address:
                      "0x0000000000000000000000000000000000000529",
                    pfp: "/icon-512.png",
                  },
                  contribution: 20,
                },
              ],
            },
          ],
          page: 1,
          next: false,
          count: 1,
        },
      })
    );
    if (isMobile) await page.setViewportSize({ width: 390, height: 844 });
    await openProfile(page);
    const toggle = page
      .getByRole("button", {
        name: `Open REP category ${CATEGORY}`,
        exact: true,
        includeHidden: true,
      })
      .filter({ visible: true });
    const tag = page
      .getByRole("button", {
        name: `Open REP category ${CATEGORY}`,
        exact: true,
        includeHidden: true,
      })
      .filter({ visible: true })
      .locator("..");
    const avatar = tag.getByRole("img", { name: "playwright", exact: true });
    const box = await avatar.boundingBox();
    expect(box?.width).toBe(24);
    expect(box?.height).toBe(24);
    await expect(toggle.getByRole("link")).toHaveCount(0);
    await toggle.click({ position: { x: 6, y: 6 } });
    await expect(categoryPanel(page)).toBeVisible();
    await expect(
      categoryPanel(page).getByRole("link", { name: "You", exact: true })
    ).toHaveAttribute("href", "/playwright");
    await expectAxeClean(page, {
      include: [isMobile ? '[role="dialog"]' : "[data-rep-tag]"],
    });
    await page.keyboard.press("Escape");
    await expect(toggle).toBeFocused();
    await expect(toggle).toHaveAttribute("aria-expanded", "false");
    if (isMobile) {
      await expect(tag.getByRole("link")).toHaveCount(0);
      for (const width of [390, 1280]) {
        await page.setViewportSize({ width, height: 844 });
        const touchAvatar = await avatar.boundingBox();
        expect(touchAvatar).not.toBeNull();
        await page.touchscreen.tap(touchAvatar!.x + 12, touchAvatar!.y + 12);
        await expect(categoryPanel(page)).toBeVisible();
        await expect(page).toHaveURL(new RegExp(`/${TARGET}$`));
        await expect(toggle).toHaveAttribute("aria-expanded", "true");
        await expect(
          categoryPanel(page).getByRole("link", { name: "You", exact: true })
        ).toHaveAttribute("href", "/playwright");
        await page.screenshot({
          path: testInfo.outputPath(`rep-avatar-touch-${width}.png`),
          animations: "disabled",
        });
        await page.keyboard.press("Escape");
        await expect(toggle).toHaveAttribute("aria-expanded", "false");
      }
    } else {
      const profile = tag.getByRole("link", {
        name: "playwright",
        exact: true,
      });
      await expect(profile).toHaveAttribute("href", "/playwright");
      await expect(profile).not.toHaveAttribute("tabindex", "-1");
      await toggle.focus();
      await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
      await expect(profile).toBeFocused();
      await avatar.hover();
      await expect(
        page.getByRole("tooltip").filter({ hasText: "playwright · 20" })
      ).toBeVisible();
      await page.screenshot({
        path: testInfo.outputPath("rep-avatar-desktop-link.png"),
      });
      await profile.click();
      await expect(page).toHaveURL(/\/playwright$/);
    }
    await expectNoHorizontalOverflow(page);
  });

  test("loads an inline contribution, restores category focus, and saves the desired total", async ({
    page,
    baseURL,
    isMobile,
    browserName,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    let release: () => void = () => undefined;
    const ready = new Promise<void>((resolve) => {
      release = resolve;
    });
    let rating = 20;
    const saved: unknown[] = [];
    await installCategories(page, api, () => rating);
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
    if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
    await openProfile(page);
    const repSummary = page
      .getByRole("region", { name: "REP", exact: true })
      .filter({ visible: true });
    if (!isMobile) {
      const categorySection = repSummary
        .getByText(/^REP Categories$/i)
        .locator("..")
        .locator("..")
        .locator("..");
      await expect(categorySection).toHaveCSS("border-top-width", "1px");
      await expect(categorySection).toHaveCSS(
        "border-top-color",
        "rgba(255, 255, 255, 0.1)"
      );
    }
    // The profile summary precedes the per-category contribution indicators.
    const assigned = repSummary
      .getByText("You assigned: 20", { exact: true })
      .first()
      .locator("..");
    await expect(assigned).toHaveText("You assigned: 20");
    await expect(
      repSummary.getByRole("button", { name: /^You assigned:/ })
    ).toHaveCount(0);
    await expect(
      repSummary
        .getByText("You assigned: 20", { exact: true })
        .first()
        .locator("..")
        .locator("svg")
    ).toHaveCount(0);
    if (!isMobile) {
      await assigned.hover();
      await expect(assigned).toHaveCSS("color", "rgb(147, 147, 159)");
    }
    if (isMobile) {
      await repSummary
        .getByRole("button", { name: "Grant Rep", exact: true })
        .focus();
      await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
      await expect(
        repSummary.getByRole("button", {
          name: `Open REP category ${CATEGORY}`,
          exact: true,
        })
      ).toBeFocused();
    }
    await expect(assigned.getByText("20", { exact: true })).toHaveCSS(
      "white-space",
      "nowrap"
    );
    for (const width of isMobile ? [320, 390, 540, 768] : [1280]) {
      await page.setViewportSize({ width, height: 844 });
      const assignedBox = await assigned.boundingBox();
      const grantBox = await repSummary
        .getByRole("button", { name: "Grant Rep", exact: true })
        .boundingBox();
      const headingBox = await repSummary
        .getByText(/^REP Categories$/i)
        .boundingBox();
      expect(assignedBox).not.toBeNull();
      expect(grantBox).not.toBeNull();
      expect(headingBox).not.toBeNull();
      if (assignedBox && grantBox && headingBox) {
        expect(grantBox.x - assignedBox.x - assignedBox.width).toBeCloseTo(
          isMobile ? 8 : 12,
          0
        );
        expect(assignedBox.y + assignedBox.height / 2).toBeCloseTo(
          grantBox.y + grantBox.height / 2,
          0
        );
        if (grantBox.y >= headingBox.y + headingBox.height) {
          expect(
            grantBox.y - headingBox.y - headingBox.height
          ).toBeGreaterThanOrEqual(8);
        } else {
          expect(headingBox.x + headingBox.width).toBeLessThan(assignedBox.x);
          expect(headingBox.y + headingBox.height / 2).toBeCloseTo(
            grantBox.y + grantBox.height / 2,
            0
          );
        }
      }
      await expectNoHorizontalOverflow(page);
    }
    if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
    await expect(
      page.getByRole("button", { name: /^Edit REP category/ })
    ).toHaveCount(0);
    const categoryToggle = page.getByRole("button", {
      name: `Open REP category ${CATEGORY}`,
      exact: true,
    });
    await expect(categoryToggle).toHaveAccessibleDescription(
      "You assigned: 20"
    );
    await expectPersonalTagSpacing(categoryToggle, isMobile);
    if (isMobile) {
      await page.setViewportSize({ width: 768, height: 844 });
      await expectPersonalTagSpacing(categoryToggle, true, true);
      await expectNoHorizontalOverflow(page);
      await page.setViewportSize({ width: 320, height: 844 });
    }
    expect(
      await categoryToggle.evaluate(
        (tag) => tag.scrollWidth <= tag.clientWidth + 1
      )
    ).toBe(true);
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
      name: `Your REP in ${CATEGORY}`,
      exact: true,
    });
    await expect(input).toHaveAttribute("readonly");
    await expect(
      panel.getByRole("button", { name: "Save", exact: true })
    ).toHaveCount(0);
    await expect(input).toHaveAttribute("inputmode", "text");
    const loadingHeight = (await input.boundingBox())?.height;
    release();
    await expect(input).toHaveValue("20");
    if (!isMobile) {
      const handle = panel
        .getByRole("link", { name: "You", exact: true })
        .getByText("You", { exact: true });
      await handle.hover();
      await expect(handle).toHaveCSS("text-decoration-line", "none");
      await expect(handle).toHaveCSS("color", "rgb(147, 147, 159)");

      await expect
        .poll(() =>
          input.evaluate((field) => {
            const amount = field as HTMLInputElement;
            return { start: amount.selectionStart, end: amount.selectionEnd };
          })
        )
        .toEqual({ start: 2, end: 2 });
      await expect(input).toBeFocused();
      await input.press("3");
      await expect(input).toHaveValue("203");
      await input.press("Escape");
      await expect(input).toHaveValue("20");
    }
    expect((await input.boundingBox())?.height).toBeCloseTo(
      loadingHeight ?? 0,
      2
    );
    const signOffset = await input.evaluate((field) => {
      const bounds = field.getBoundingClientRect();
      const paths = Array.from(
        field.parentElement?.querySelectorAll<SVGPathElement>("svg path") ?? []
      );
      if (paths.length !== 2) throw new Error("Missing rating input signs");
      // Measure the visible paths; their SVG boxes contain uneven empty space.
      const edges = paths.flatMap((path) => {
        const box = path.getBBox();
        const matrix = path.getScreenCTM();
        if (!matrix) throw new Error("Rating signs are not rendered");
        return [
          new DOMPoint(box.x, box.y).matrixTransform(matrix).y,
          new DOMPoint(box.x + box.width, box.y + box.height).matrixTransform(
            matrix
          ).y,
        ];
      });
      const center = (Math.min(...edges) + Math.max(...edges)) / 2;
      return Math.abs(center - bounds.top - bounds.height / 2);
    });
    expect(signOffset).toBeLessThan(0.5);
    const inputSpacing = await input.evaluate((field) => {
      const bounds = field.getBoundingClientRect();
      const row = field.closest("[data-rating-row]")?.getBoundingClientRect();
      if (!row) throw new Error("Missing contribution row");
      return {
        top: bounds.top - row.top,
        bottom: row.bottom - bounds.bottom,
        rowHeight: row.height,
      };
    });
    expect(inputSpacing.top).toBeGreaterThanOrEqual(5);
    expect(inputSpacing.bottom).toBeGreaterThanOrEqual(5);
    const otherAmount = panel.getByText("10", { exact: true });
    const inputBox = await panel
      .getByRole("textbox", { name: `Your REP in ${CATEGORY}`, exact: true })
      .locator("..")
      .boundingBox();
    const otherAmountBox = await otherAmount.boundingBox();
    expect(inputBox).not.toBeNull();
    expect(otherAmountBox).not.toBeNull();
    if (inputBox && otherAmountBox) {
      expect(otherAmountBox.x + otherAmountBox.width).toBeCloseTo(
        inputBox.x + inputBox.width,
        2
      );
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
    await expect(panel.getByRole("status")).toHaveText("20 → 30");
    await expect(input).toHaveCSS("color", "rgb(239, 239, 241)");
    await expect(
      panel.getByRole("status").getByText("30", { exact: true })
    ).toHaveCSS("color", "rgb(52, 211, 153)");
    await input.fill("10");
    await expect(panel.getByRole("status")).toHaveText("20 → 10");
    await expect(input).toHaveCSS("color", "rgb(239, 239, 241)");
    await expect(
      panel.getByRole("status").getByText("10", { exact: true })
    ).toHaveCSS("color", "rgb(52, 211, 153)");
    await panel.screenshot({
      path: testInfo.outputPath("rep-positive-reduction.png"),
    });
    await input.fill("-10");
    await expect(
      panel.getByRole("status").getByText("-10", { exact: true })
    ).toHaveCSS("color", "rgb(251, 113, 133)");
    await input.fill("0");
    await expect(
      panel.getByRole("status").getByText("0", { exact: true })
    ).toHaveCSS("color", "rgb(239, 239, 241)");
    await input.fill("30");
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
    expect(saved).toEqual([{ amount: 30, category: CATEGORY }]);
    if (isMobile) {
      await expect(panel).toBeHidden();
      await expect(categoryToggle).toBeFocused();
      await expect(categoryToggle).toHaveAccessibleDescription(
        "You assigned: 30"
      );
    } else {
      await expect(input).toHaveValue("30");
      await expect(panel).toBeVisible();
    }
    await page.screenshot({
      path: testInfo.outputPath("rep-category-after-save.png"),
    });
  });

  test("saving preserves desktop context and closes the mobile sheet when totals change the tag order", async ({
    page,
    baseURL,
    isMobile,
  }) => {
    const api = getSandboxApiOrigin(baseURL);
    let rating = 20;
    const otherCategory = "Community Builder";
    await page.route(`${api}/api/profiles/*/rep/categories?*`, (route) =>
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
            {
              category: otherCategory,
              total_rep: 40,
              contributor_count: 1,
              authenticated_user_contribution: null,
              top_contributors: [],
            },
          ].toSorted((a, b) => b.total_rep - a.total_rep),
          page: 1,
          next: false,
          count: 2,
        },
      })
    );
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) =>
        route.fulfill({
          json: {
            ...allowance,
            rating_stats: [
              { ...allowance.rating_stats[0], rater_contribution: rating },
            ],
          },
        })
    );
    await page.route(`${api}/api/profiles/${TARGET}/rep/rating`, (route) => {
      const body = route.request().postDataJSON();
      expect(body.category).toBe(CATEGORY);
      rating = body.amount;
      return route.fulfill({ json: {} });
    });
    await openProfile(page);
    const rep = page
      .getByRole("region", { name: "REP", exact: true, includeHidden: true })
      .filter({ visible: true });
    const editedTag = rep.getByRole("button", {
      name: `Open REP category ${CATEGORY}`,
      exact: true,
      includeHidden: true,
    });
    const otherTag = rep.getByRole("button", {
      name: `Open REP category ${otherCategory}`,
      exact: true,
      includeHidden: true,
    });
    await editedTag.click();
    const panel = categoryPanel(page);
    const input = panel.getByRole("textbox", {
      name: `Your REP in ${CATEGORY}`,
      exact: true,
    });
    const categoryTags = rep.getByRole("button", {
      name: /^Open REP category /,
      includeHidden: true,
    });
    const getTagOrder = () =>
      categoryTags.evaluateAll((tags) =>
        tags.map((tag) => tag.getAttribute("aria-label"))
      );
    for (const amount of [50, 10]) {
      const orderBeforeSave = await getTagOrder();
      await input.fill(String(amount));
      await panel.getByRole("button", { name: "Save", exact: true }).click();
      await expect(
        rep
          .getByRole("button", {
            name: `Open REP category ${CATEGORY}`,
            exact: true,
            includeHidden: true,
          })
          .locator("..")
          .getByText(String(amount), { exact: true })
      ).toHaveCount(2);
      await expect(otherTag).toHaveAttribute("aria-expanded", "false");
      if (isMobile) {
        await expect(editedTag).toHaveAttribute("aria-expanded", "false");
        await expect(editedTag).toBeFocused();
      } else {
        await expect(editedTag).toHaveAttribute("aria-expanded", "true");
        await expect(panel).toBeVisible();
        await expect(input).toHaveValue(String(amount));
        await expect(
          panel.getByRole("button", { name: "Save", exact: true })
        ).toHaveCount(0);
        expect(await getTagOrder()).toEqual(orderBeforeSave);
        await editedTag.click();
      }
      await expect(panel).toBeHidden();
      await expect
        .poll(getTagOrder)
        .toEqual(
          (amount === 50
            ? [CATEGORY, otherCategory]
            : [otherCategory, CATEGORY]
          ).map((name) => `Open REP category ${name}`)
        );
      if (amount === 50) await editedTag.click();
    }
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
    const input = panel.getByRole("textbox", {
      name: `Your REP in ${CATEGORY}`,
      exact: true,
    });
    const blurKey = browserName === "webkit" ? "Alt+Tab" : "Tab";
    await expect(input).toHaveValue(isMobile ? "12,345" : "12345");
    await input.press(blurKey);
    await expect(input).toHaveValue("12,345");
    const readsBeforeTyping = reads;
    await input.click();
    await expect(input).toHaveValue("12345");
    const selection = await input.evaluate((field) => ({
      start: (field as HTMLInputElement).selectionStart,
      end: (field as HTMLInputElement).selectionEnd,
    }));
    expect(selection.start).toBe(selection.end);
    await input.press("ControlOrMeta+ArrowRight");
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
    // Focus restores raw digits without selecting the amount.
    await input.click();
    await expect(input).toHaveValue("123945");
    await input.fill("-12345");
    await input.press(blurKey);
    await expect(input).toHaveValue("-12,345");
    expect(reads).toBe(readsBeforeTyping);
    await input.press("Escape");
    await expect(input).toHaveValue("12345");
    await input.press(blurKey);
    await expect(input).toHaveValue("12,345");
  });

  test("keeps large signed REP comparisons and Save visible", async ({
    page,
    baseURL,
    isMobile,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    const current = 1234567890;
    if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
    await installCategories(page, api, () => current);
    await page.route(
      `${api}/api/profiles/${TARGET}/rep/ratings/received?*`,
      (route) =>
        route.fulfill({
          json: {
            ...allowance,
            rating_stats: [
              { ...allowance.rating_stats[0], rater_contribution: current },
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
    const input = panel.getByRole("textbox", {
      name: `Your REP in ${CATEGORY}`,
      exact: true,
    });
    await expect(input).toHaveValue(isMobile ? "1,234,567,890" : "1234567890");
    await input.click();
    await expect(input).toHaveValue("1234567890");
    await input.fill("-1234567890");
    await expect(input).toHaveValue("-1234567890");
    const save = panel.getByRole("button", { name: "Save", exact: true });
    await expect(save).toBeEnabled();
    if (!isMobile) await save.scrollIntoViewIfNeeded();
    await expect(save).toBeInViewport();
    await expect(panel.getByRole("status")).toContainText("1,234,567,890");
    await expect(panel.getByRole("status")).toContainText("-1,234,567,890");
    await expect(
      panel.getByText("Available REP 80", { exact: true })
    ).toBeInViewport();
    await expectNoHorizontalOverflow(page);
    await panel.screenshot({
      path: testInfo.outputPath("large-rep-comparison.png"),
    });
  });

  test("offers an empty You input when the viewer has no existing contribution", async ({
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
    await expect(
      panel.getByRole("textbox", {
        name: `Your REP in ${CATEGORY}`,
        exact: true,
      })
    ).toHaveValue("");
    await expect(
      panel.getByRole("textbox", {
        name: `Your REP in ${CATEGORY}`,
        exact: true,
      })
    ).toHaveAttribute("placeholder", "0");
    await expect(
      panel.getByRole("link", { name: "You", exact: true })
    ).toHaveCount(1);
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
    browserName,
  }) => {
    const api = getSandboxApiOrigin(baseURL);
    let rating = 20;
    await setSandboxProfileRep(api, rating);
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
        await setSandboxProfileRep(api, rating);
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
    const loading = grant.getByText("Loading ratings…", { exact: true });
    await expect(loading).toBeVisible();
    expect((await loading.boundingBox())!.height).toBeLessThanOrEqual(24);
    await expectCompactGrantLayout(grant);
    await expectDesktopRatingPosition(page, "Grant Rep");
    await grant
      .getByRole("combobox", { name: "Category to grant REP for", exact: true })
      .fill(CATEGORY);
    const amount = grant.getByRole("textbox", {
      name: "Your total REP for this category",
      exact: true,
    });
    let pendingFocusRing = "";
    const cancel = grant.getByRole("button", { name: "Cancel", exact: true });
    try {
      await amount.fill("35");
      await expect(amount).toHaveAttribute("aria-invalid", "false");
      await expect(
        grant.getByText("Current Rep:", { exact: true })
      ).toBeHidden();
      pendingFocusRing = await amount.evaluate(
        (input) => getComputedStyle(input).boxShadow
      );
      await amount.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
      await expect(cancel).toBeFocused();
      await expect(amount).toHaveValue("35");
      await expect(
        grant.getByRole("button", { name: "Grant Rep", exact: true })
      ).toBeDisabled();
    } finally {
      releaseAllowance();
    }
    await expect(
      grant.getByRole("button", { name: "Save", exact: true })
    ).toBeEnabled();
    await expect(amount).toHaveValue("35");
    await expect(cancel).toBeFocused();
    await expect(
      grant.getByText("Current Rep:", { exact: true })
    ).toBeVisible();
    await amount.focus();
    await expect(amount).toHaveCSS("box-shadow", pendingFocusRing);
    await expectDesktopRatingPosition(page, "Grant Rep");
    await grant.getByRole("button", { name: "Save", exact: true }).click();
    await expect(grant).toBeHidden();
    expect(saved).toEqual([{ amount: 35, category: CATEGORY }]);
    await expect(
      page
        .getByRole("button", {
          name: `Open REP category ${CATEGORY}`,
          exact: true,
        })
        .locator("..")
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

  test("reaches all sixty categories across server pages with readable tags", async ({
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
              authenticated_user_contribution:
                start + index === 1 ? -12345 : null,
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
    const personalTag = rep.getByRole("button", {
      name: "Open REP category Art",
      exact: true,
    });
    await expect(personalTag).toHaveAccessibleDescription(
      "You assigned: -12,345"
    );
    await expectPersonalTagSpacing(personalTag, isMobile);
    expect(
      await personalTag.evaluate(
        (tag) => tag.scrollWidth <= tag.clientWidth + 1
      )
    ).toBe(true);
    await personalTag.scrollIntoViewIfNeeded();
    await page.screenshot({
      path: testInfo.outputPath("rep-personal-amount-tags.png"),
    });
    const more = rep.getByRole("button", { name: /^\+\d+ more$|^Load more$/ });
    await expect(more).toHaveText("+20 more");
    await expect(more).toHaveCSS("height", isMobile ? "44px" : "38px");
    await expect(more).toHaveCSS("border-radius", "8px");
    await expect(more).toHaveCSS("border-top-width", "1px");
    await expect(more).toHaveCSS("background-color", "rgba(0, 0, 0, 0)");
    await expect(more).toHaveCSS("font-weight", "500");
    await expect(more).toHaveCSS("color", "rgb(206, 207, 212)");
    if (!isMobile) {
      await more.hover();
      await expect(more).toHaveCSS("color", "rgb(245, 245, 245)");
      await expect(more).toHaveCSS(
        "border-top-color",
        "rgba(255, 255, 255, 0.25)"
      );
      await expect(more).toHaveCSS(
        "background-color",
        "rgba(255, 255, 255, 0.03)"
      );
    }
    await expect(
      rep.getByRole("button", { name: /^Open REP category / })
    ).toHaveCount(5);
    await more.click();
    await expect(
      rep.getByRole("button", { name: /^Open REP category / })
    ).toHaveCount(15);
    await expect(more).toHaveText("+10 more");
    await page.screenshot({
      path: testInfo.outputPath("rep-more-control.png"),
    });
    for (let step = 0; step < 5; step += 1) {
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
    const tagSizes = await rep
      .getByRole("button", { name: /^Open REP category / })
      .evaluateAll((tags) =>
        tags.map((tag) => ({
          height: tag.getBoundingClientRect().height,
          nameClipped: (() => {
            const name = tag.nextElementSibling?.firstElementChild;
            return (
              !name ||
              name.scrollWidth > name.clientWidth + 1 ||
              getComputedStyle(name).textOverflow === "ellipsis"
            );
          })(),
        }))
      );
    for (const { height, nameClipped } of tagSizes) {
      if (isMobile) {
        expect(height).toBeGreaterThanOrEqual(46);
        expect(nameClipped).toBe(false);
      } else expect(height).toBe(38);
    }
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
    const longTag = rep
      .getByRole("button", {
        name: `Open REP category ${longCategory}`,
        exact: true,
      })
      .locator("..");
    const categoryLabel = longTag.getByText(longCategory, { exact: true });
    const totalLabel = longTag.getByText("1,380", { exact: true });
    for (const label of [categoryLabel, totalLabel]) {
      await expect(label).toHaveCSS("font-size", "14px");
      await expect(label).toHaveCSS("font-weight", "500");
    }
    await expect(categoryLabel).toHaveCSS("color", "rgb(239, 239, 241)");
    await expect(totalLabel).toHaveCSS("color", "rgb(147, 147, 159)");
    await expect(longTag).toHaveCSS(
      "background-color",
      isMobile ? "rgb(19, 19, 22)" : "rgba(255, 255, 255, 0.05)"
    );
    await expect(longTag).toHaveCSS("border-top-width", "1px");
    await expect(longTag).toHaveCSS(
      "border-top-color",
      "rgba(255, 255, 255, 0.06)"
    );
    if (isMobile) {
      const tagBox = await longTag.boundingBox();
      const labelBox = await categoryLabel.boundingBox();
      const chevronBox = await rep
        .getByRole("button", {
          name: `Open REP category ${longCategory}`,
          exact: true,
        })
        .locator("..")
        .locator("svg")
        .boundingBox();
      expect(tagBox).not.toBeNull();
      expect(labelBox).not.toBeNull();
      expect(chevronBox).not.toBeNull();
      if (tagBox && labelBox && chevronBox) {
        expect(labelBox.x - tagBox.x).toBeGreaterThanOrEqual(12);
        expect(
          tagBox.x + tagBox.width - chevronBox.x - chevronBox.width
        ).toBeGreaterThanOrEqual(10);
      }
    }
    const avatar = longTag.getByRole("img", {
      name: "rater-0",
      exact: true,
    });
    await expect(longTag.getByRole("img")).toHaveCount(3);
    await expect(longTag.getByRole("link")).toHaveCount(isMobile ? 0 : 3);
    await expect(longTag.getByRole("button")).toHaveCount(1);
    await expect(longTag.getByText("60 raters", { exact: true })).toBeVisible();
    const avatarBox = await avatar.boundingBox();
    expect(avatarBox?.width).toBe(24);
    expect(avatarBox?.height).toBe(24);
    await expect(
      rep
        .getByRole("button", {
          name: `Open REP category ${longCategory}`,
          exact: true,
        })
        .locator('span[aria-hidden="true"]')
    ).toHaveCount(0);
    const totalBox = await totalLabel.boundingBox();
    expect(totalBox).not.toBeNull();
    if (avatarBox && totalBox) {
      if (isMobile) {
        expect(avatarBox.y).toBeGreaterThanOrEqual(
          totalBox.y + totalBox.height + 4
        );
      } else
        expect(
          avatarBox.x - totalBox.x - totalBox.width
        ).toBeGreaterThanOrEqual(14);
    }
    if (!isMobile) {
      const restingTagBox = await longTag.boundingBox();
      await avatar.hover();
      await expect(totalLabel).toHaveCSS("color", "rgb(206, 207, 212)");
      await expect(longTag).toHaveCSS(
        "border-top-color",
        "rgba(255, 255, 255, 0.1)"
      );
      await expect(longTag).toHaveCSS(
        "background-color",
        // Chromium can round the transitioned alpha to an 8-bit color value.
        /rgba\(255, 255, 255, 0\.08[56]\)/
      );
      const hoveredTagBox = await longTag.boundingBox();
      expect(hoveredTagBox?.width).toBe(restingTagBox?.width);
      expect(hoveredTagBox?.height).toBe(restingTagBox?.height);
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
        // Compact tags wrap differently from the previous dimensions. Compare
        // against their natural closed layout rather than assuming Art and UX
        // always share a row at this viewport width.
        await art.click();
        const ux = rep.getByRole("button", {
          name: "Open REP category UX",
          exact: true,
        });
        const naturalArt = await art.boundingBox();
        const naturalUx = await ux.boundingBox();
        expect(naturalArt).not.toBeNull();
        expect(naturalUx).not.toBeNull();
        await art.click();
        await expectDesktopTagJoin(page, "Art");
        await expect
          .poll(async () => {
            const artBox = await art.boundingBox();
            const uxBox = await ux.boundingBox();
            const panelBox = await artPanel.boundingBox();
            if (!artBox || !uxBox || !panelBox || !naturalArt || !naturalUx)
              return Infinity;
            const shift =
              naturalUx.y > naturalArt.y + 1 ? panelBox.height + 8 : 0;
            return Math.max(
              Math.abs(artBox.x - naturalArt.x),
              Math.abs(artBox.y - naturalArt.y),
              Math.abs(artBox.width - naturalArt.width),
              Math.abs(uxBox.y - naturalUx.y - shift)
            );
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
      x: tag.parentElement!.offsetLeft,
      y: tag.parentElement!.offsetTop,
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
      expect(actionBox.x - detailsBox.x).toBeLessThanOrEqual(24);
      expect(actionBox.x + actionBox.width).toBeLessThanOrEqual(
        detailsBox.x + detailsBox.width
      );
    }
    if (contributorBox && actionBox) {
      expect(actionBox.y).toBeGreaterThanOrEqual(
        contributorBox.y + contributorBox.height
      );
    }
    await expect(details.getByRole("separator")).toHaveCount(0);
    await expect(
      details
        .getByRole("button", {
          name: `Open category ${longCategory}`,
          exact: true,
        })
        .locator('xpath=ancestor::div[contains(@class,"tw-border-t")][1]')
    ).toHaveCSS("border-top-width", "1px");
    if (!isMobile) {
      await expectDesktopTagJoin(page, longCategory);
      const openTagBox = await categoryToggle.evaluate((tag) => ({
        x: tag.parentElement!.offsetLeft,
        y: tag.parentElement!.offsetTop,
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
    const profileResponse = await page.request.get(
      `${api}/api/identities/${TARGET}`
    );
    expect(profileResponse.ok()).toBe(true);
    const statsProfile: ApiProfileMin = await profileResponse.json();
    const globalOverview = {
      category: longCategory,
      total_rep: 1380,
      pair_count: 1,
      giver_count: 1,
      recipient_count: 1,
      top_recipients: [
        {
          profile: statsProfile,
          total_rep: 1380,
          rater_count: 1,
          last_modified: "2026-11-12T12:00:00Z",
        },
      ],
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
    const statsHandle = globalCategory.getByText(TARGET, { exact: true });
    await expect(statsHandle).toBeVisible();
    if (!isMobile) {
      await statsHandle.hover();
      await expect(statsHandle).toHaveCSS("color", "rgb(147, 147, 159)");
      await expect(statsHandle).toHaveCSS("text-decoration-line", "none");
    }
    await page.screenshot({
      path: testInfo.outputPath("rep-category-stats-handle.png"),
    });
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
    // Stale personal fields must not duplicate the owner's outgoing total.
    await expect(rep.getByText(/You assigned:|Assigned to you:/)).toHaveCount(
      0
    );
    const ownCategory = rep.getByRole("button", {
      name: `Open REP category ${CATEGORY}`,
      exact: true,
    });
    await expect(ownCategory).not.toHaveAttribute("aria-describedby");
    await expect(
      rep
        .getByRole("button", {
          name: `Open REP category ${CATEGORY}`,
          exact: true,
        })
        .locator("..")
        .getByText("20", { exact: true })
    ).toHaveCount(1);
    await rep.screenshot({
      path: testInfo.outputPath("own-given-category-summary.png"),
    });
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
    await first.fill("20");
    await expect(first).toHaveCSS("color", "rgb(52, 211, 153)");
    await expect(panel.getByTitle("−10", { exact: true })).toHaveCSS(
      "color",
      "rgb(251, 113, 133)"
    );
    await expect(
      panel.getByRole("status").getByText("10", { exact: true })
    ).toHaveCSS("color", "rgb(52, 211, 153)");
    await first.fill("30");
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
    await expect(panel).toBeVisible();
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
    if (isMobile) {
      await expect(panel).toBeHidden();
      await expect(ownCategory).toBeFocused();
    } else {
      await expect(first).toHaveValue("110");
      await first.press("Escape");
    }
    await expect(
      rep.getByRole("button", { name: /^All REP receivers:/ })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("keeps another profile's Given and the owner's Received categories read-only", async ({
    page,
    isMobile,
  }, testInfo) => {
    if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
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
    await expect(category).toHaveAccessibleDescription("Assigned to you: 20");
    await expect(
      page.getByRole("button", { name: /^You assigned:/ })
    ).toHaveCount(0);
    await expect(
      page.getByRole("button", { name: "Grant Rep", exact: true })
    ).toHaveCount(0);
    await expectPersonalTagSpacing(category, isMobile);
    if (isMobile) {
      await page.setViewportSize({ width: 768, height: 844 });
      await expectPersonalTagSpacing(category, true, true);
      await expectNoHorizontalOverflow(page);
      await page.setViewportSize({ width: 320, height: 844 });
    }
    expect(
      await category.evaluate((tag) => tag.scrollWidth <= tag.clientWidth + 1)
    ).toBe(true);
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
    await expect(page.getByText(/You assigned:|Assigned to you:/)).toHaveCount(
      0
    );
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
    isMobile,
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
    if (isMobile) await expect(dialog).toBeHidden();
    else await expect(dialog).toBeVisible();
    expect(saved).toEqual([{ amount: 30, category: CATEGORY }]);
  });
});

test.describe("Profile Given rating management @auth @medium @local-only", () => {
  useLocalSandboxMutationGuard(
    test,
    "PLAYWRIGHT_AUTH_SANDBOX",
    "Given edits require the isolated local API."
  );

  test.beforeEach(async ({ context }) => {
    await hideNextDevOverlay(context);
  });

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
      let releaseSave: () => void = () => undefined;
      const saveGate = new Promise<void>((resolve) => {
        releaseSave = resolve;
      });
      const saved: unknown[] = [];
      const requestedPages: number[] = [];
      let recipientRepReads = 0;
      let recipientNicReads = 0;
      let identityReads = 0;
      let releaseIdentity: () => void = () => undefined;
      const identityGate = new Promise<void>((resolve) => {
        releaseIdentity = resolve;
      });
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
        `${api}/api/profiles/*/rep/ratings/received?*`,
        (route) => {
          const receiver = decodeURIComponent(
            new URL(route.request().url()).pathname.split("/")[3]!
          );
          if (receiver === recipientHandle) recipientRepReads += 1;
          const contribution =
            receiver === "older-recipient"
              ? 900
              : receiver === "page-two-recipient"
                ? 10
                : rating;
          return route.fulfill({
            json: {
              ...allowance,
              rating_stats: [
                {
                  ...allowance.rating_stats[0],
                  rater_contribution: contribution,
                },
              ],
            },
          });
        }
      );
      await page.route(
        `${api}/api/profiles/playwright/cic/rating/*`,
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
        async (route) => {
          saved.push(route.request().postDataJSON());
          if (failSave) {
            await saveGate;
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
      const receiverLink = section.getByRole("link", {
        name: recipientHandle,
        exact: true,
      });
      if (isMobile) {
        await expect(receiverLink).toHaveCount(0);
        await expect(manageGiven.getByRole("link")).toHaveCount(0);
        await manageGiven
          .getByRole("img", { name: recipientHandle, exact: true })
          .tap();
        await expect(page).toHaveURL(/\/playwright$/);
      } else {
        await expect(receiverLink).toHaveAttribute(
          "href",
          `/${recipientHandle}`
        );
        expect(
          await receiverLink.evaluate((link) => link.closest("button"))
        ).toBeNull();
        await receiverLink.focus();
        await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
        await expect(manageGiven).toBeFocused();
        await manageGiven.getByText("2 receivers", { exact: true }).click();
      }
      const list = page.getByRole("dialog", {
        name: `${matter} Given`,
        exact: true,
      });
      if (matter === "NIC") {
        try {
          await expect.poll(() => identityReads).toBe(1);
          // The rater's allowance loads while the recipient identity is held.
          await expect.poll(() => recipientNicReads).toBe(1);
        } finally {
          releaseIdentity();
        }
      }
      const amount = () =>
        list.getByRole("textbox", {
          name: `${matter} amount for ${recipientHandle}${matter === "REP" ? ` (${CATEGORY})` : ""}`,
          exact: true,
        });
      if (matter === "NIC") {
        await expect(amount()).toHaveValue("20");
        await expect(
          list.getByRole("button", { name: /^Adjust / })
        ).toHaveCount(0);
      } else {
        await expect(list.getByRole("textbox")).toHaveCount(0);
      }
      await expectDesktopRatingPosition(page, `${matter} Given`);
      await expect(list.getByRole("link").first()).toHaveAccessibleName(
        "older-recipient"
      );
      await expect(list.getByRole("link").nth(1)).toHaveAccessibleName(
        recipientHandle
      );
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

      if (matter === "REP") {
        const reopenAfterSave = async () => {
          await expect(managementDialogs).toHaveCount(0);
          await expect(manageGiven).toBeFocused();
          await page.screenshot({
            path: testInfo.outputPath("REP-receivers-save-closed.png"),
          });
          await manageGiven.click();
          await expect(
            list.getByRole("heading", { name: "REP Given", exact: true })
          ).toBeVisible();
        };
        const openEditor = async () => {
          let readsBeforeCategoryEditor = recipientRepReads;
          await list
            .getByRole("button", {
              name: `Adjust ${matter} for ${recipientHandle}`,
              exact: true,
            })
            .click();
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
          const inputBox = await editor.getByRole("textbox").boundingBox();
          expect(inputBox).not.toBeNull();
          expect(
            Math.abs(
              saveBox!.x + saveBox!.width - inputBox!.x - inputBox!.width
            )
          ).toBeLessThanOrEqual(1);
          if (isMobile) {
            expect(cancelBox!.x).toBeCloseTo(inputBox!.x, 0);
            expect(saveBox!.x).toBeCloseTo(inputBox!.x, 0);
            expect(cancelBox!.width).toBeCloseTo(inputBox!.width, 0);
            expect(saveBox!.width).toBeCloseTo(inputBox!.width, 0);
            expect(saveBox!.y - cancelBox!.y - cancelBox!.height).toBe(8);
          } else {
            expect(Math.abs(cancelBox!.y - saveBox!.y)).toBeLessThanOrEqual(1);
            expect(cancelBox!.x + cancelBox!.width).toBeLessThanOrEqual(
              saveBox!.x
            );
            expect(saveBox!.width).toBeLessThan(inputBox!.width / 2);
            expect(cancelBox!.width).toBeLessThan(inputBox!.width / 2);
          }
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

          await expect(managementDialogs).toHaveCount(1);
          if (matter === "REP")
            expect(recipientRepReads).toBe(readsBeforeCategoryEditor);
          return editor;
        };
        let editor = await openEditor();
        await expectAxeClean(page, { include: ['[role="dialog"]'] });
        await page
          .getByRole("dialog", {
            name:
              matter === "REP"
                ? `Add Rep to ${recipientHandle}`
                : `Adjust NIC for ${recipientHandle}`,
            exact: true,
          })
          .locator(".mobile-wrapper-dialog")
          .screenshot({
            path: testInfo.outputPath("REP-receiver-adjust.png"),
          });
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
        await editor
          .getByRole("button", { name: "Cancel", exact: true })
          .click();
        await expect(managementDialogs).toHaveCount(0);
        await expect(manageGiven).toBeFocused();
        expect(saved).toHaveLength(0);
        await manageGiven.click();
        editor = await openEditor();
        await editor.getByRole("textbox").fill("30");
        const sheet = page
          .getByRole("dialog", {
            name: `Add Rep to ${recipientHandle}`,
            exact: true,
          })
          .locator(".mobile-wrapper-dialog");
        await expectStableRatingSave(editor, sheet, releaseSave);
        await expect(
          page.getByText("Please try again.", { exact: true }).first()
        ).toBeVisible();
        await expect(editor.getByRole("textbox")).toHaveValue("30");
        await expect(managementDialogs).toHaveCount(1);
        const pagesBeforeSave = requestedPages.length;
        await editor.getByRole("button", { name: "Save", exact: true }).click();
        await expect(managementDialogs).toHaveCount(0);
        // Saving refreshes only page one, then dismisses the entire flow.
        expect(requestedPages.slice(pagesBeforeSave)).toEqual([1]);
        await reopenAfterSave();
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
        await expect(
          list.getByRole("link", { name: "page-two-recipient", exact: true })
        ).toHaveCount(0);
        const pagesBeforeLoadMore = requestedPages.length;
        await list
          .getByRole("button", { name: "Load more", exact: true })
          .click();
        await expect(
          list.getByRole("link", { name: "page-two-recipient", exact: true })
        ).toBeVisible();
        expect(requestedPages.slice(pagesBeforeLoadMore)).toEqual([2]);
        editor = await openEditor();
        await editor
          .getByRole("button", { name: "Close", exact: true })
          .click();
        await expect(managementDialogs).toHaveCount(0);
        const manageTrigger = section
          .getByRole("button", {
            name: new RegExp(`^All ${matter} receivers:`),
          })
          .filter({ visible: true });
        await expect(manageTrigger).toBeFocused();
        await openOwnerProfile(page);
        await section
          .getByRole("button", { name: "Given", exact: true })
          .click();
        await manageTrigger.click();
        editor = await openEditor();
        await editor.getByRole("textbox").fill("-15");
        await editor.getByRole("button", { name: "Save", exact: true }).click();
        await expect(managementDialogs).toHaveCount(0);
        await reopenAfterSave();
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
        await expect(managementDialogs).toHaveCount(0);
        expect(requestedPages.slice(pagesBeforeRemoval)).toEqual([1]);
        await reopenAfterSave();
        await expect(
          list.getByRole("link", { name: recipientHandle })
        ).toHaveCount(0);
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
        await section
          .getByRole("button", { name: "Given", exact: true })
          .click();
        await manageTrigger.click();
        await expect(
          list.getByRole("link", { name: recipientHandle, exact: true })
        ).toHaveCount(0);
        await expect(
          list.getByRole("link", { name: "older-recipient", exact: true })
        ).toBeVisible();
        await expectNoHorizontalOverflow(page);
        return;
      }
      const repReadsBeforeEdit = recipientRepReads;
      const nicReadsBeforeEdit = recipientNicReads;
      await expectAxeClean(page, { include: ['[role="dialog"]'] });
      await amount().fill("10");
      await expect(amount()).toHaveCSS("color", "rgb(52, 211, 153)");
      await expect(list.getByTitle("−10", { exact: true })).toHaveCSS(
        "color",
        "rgb(251, 113, 133)"
      );
      await expect(
        list.getByRole("status").getByText("910", { exact: true })
      ).toHaveCSS("color", "rgb(52, 211, 153)");
      await page
        .getByRole("dialog", { name: `${matter} Given`, exact: true })
        .locator(".mobile-wrapper-dialog")
        .screenshot({
          path: testInfo.outputPath("NIC-positive-reduction.png"),
        });
      await amount().fill("-10");
      await expect(amount()).toHaveCSS("color", "rgb(251, 113, 133)");
      await expect(
        list.getByRole("status").getByText("890", { exact: true })
      ).toHaveCSS("color", "rgb(52, 211, 153)");
      await amount().fill("0");
      await expect(amount()).toHaveCSS("color", "rgb(239, 239, 241)");
      await amount().fill("25");
      if (isMobile && testInfo.project.name === "web-mobile-chromium") {
        try {
          await page.evaluate(() => {
            Object.defineProperty(globalThis.visualViewport, "height", {
              configurable: true,
              value: globalThis.innerHeight - 300,
            });
            globalThis.visualViewport?.dispatchEvent(new Event("resize"));
          });
          await expect
            .poll(async () =>
              amount().evaluate(
                (field) =>
                  field.getBoundingClientRect().bottom <=
                  (globalThis.visualViewport?.height ?? 0)
              )
            )
            .toBe(true);
          await expect
            .poll(async () =>
              list
                .getByRole("button", { name: "Save", exact: true })
                .evaluate(
                  (button) =>
                    button.getBoundingClientRect().bottom <=
                    (globalThis.visualViewport?.height ?? 0)
                )
            )
            .toBe(true);
        } finally {
          await page.evaluate(() => {
            Reflect.deleteProperty(globalThis.visualViewport!, "height");
            globalThis.visualViewport?.dispatchEvent(new Event("resize"));
          });
        }
      }
      const cancel = list.getByRole("button", { name: "Cancel", exact: true });
      const save = list.getByRole("button", { name: "Save", exact: true });
      const inputBox = await amount().boundingBox();
      const cancelBox = await cancel.boundingBox();
      const saveBox = await save.boundingBox();
      expect(inputBox).not.toBeNull();
      expect(inputBox!.width).toBe(isMobile ? 140 : 136);
      expect(inputBox!.height).toBe(isMobile ? 44 : 36);
      expect(cancelBox!.height).toBe(isMobile ? 44 : 34);
      expect(saveBox!.height).toBe(isMobile ? 44 : 34);
      expect(Math.abs(cancelBox!.y - saveBox!.y)).toBeLessThanOrEqual(1);
      expect(cancelBox!.x + cancelBox!.width).toBeLessThanOrEqual(saveBox!.x);
      const scroll = list.getByRole("link").first();
      await scroll.scrollIntoViewIfNeeded();
      await expect(save).toBeInViewport();
      await cancel.click();
      await expect(amount()).toHaveValue("20");
      await expect(managementDialogs).toHaveCount(1);
      await expect(save).toHaveCount(0);
      await expect(
        list.getByRole("link", { name: "page-two-recipient", exact: true })
      ).toBeVisible();
      expect(requestedPages).toEqual([1, 2]);
      expect(saved).toHaveLength(0);
      expect(recipientRepReads).toBe(repReadsBeforeEdit);
      expect(recipientNicReads).toBe(nicReadsBeforeEdit);
      await amount().fill("26");
      await list.getByRole("button", { name: "Close", exact: true }).click();
      await expect(managementDialogs).toHaveCount(0);
      await expect(manageGiven).toBeFocused();
      expect(saved).toHaveLength(0);
      await manageGiven.click();
      await expect(amount()).toHaveValue("20");
      await amount().fill("30");
      await expectStableRatingSave(
        list,
        page
          .getByRole("dialog", { name: "NIC Given", exact: true })
          .locator(".mobile-wrapper-dialog"),
        releaseSave
      );
      await expect(
        page.getByText("Please try again.", { exact: true }).first()
      ).toBeVisible();
      await expect(amount()).toHaveValue("30");
      await expect(list.getByRole("alert")).toBeVisible();
      await amount().fill("31");
      await expect(list.getByRole("alert")).toHaveCount(0);
      await amount().fill("30");
      const pagesBeforeSave = requestedPages.length;
      await save.click();
      await expect(managementDialogs).toHaveCount(1);
      await expect(save).toHaveCount(0);
      await expect(amount()).toHaveValue("30");
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
      await list.getByRole("button", { name: "Close", exact: true }).click();
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
      await amount().fill("-15");
      await save.click();
      await expect(managementDialogs).toHaveCount(1);
      await expect(save).toHaveCount(0);
      await expect(amount()).toHaveValue("-15");
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
      await expect(
        list.getByRole("button", { name: "Remove rating", exact: true })
      ).toHaveCount(0);
      await amount().fill("0");
      await expect(amount()).toHaveValue("0");
      expect(saved).toHaveLength(3);
      const removeScreenshot = testInfo.outputPath(`${matter}-remove.png`);
      await page.screenshot({ path: removeScreenshot });
      await testInfo.attach(`${matter}-remove`, {
        path: removeScreenshot,
        contentType: "image/png",
      });
      const pagesBeforeRemoval = requestedPages.length;
      await save.click();
      await expect(managementDialogs).toHaveCount(1);
      await expect(save).toHaveCount(0);
      await expect(
        list.getByRole("link", { name: recipientHandle })
      ).toHaveCount(0);
      await expect(
        list.getByRole("link", { name: "older-recipient" })
      ).toBeVisible();
      expect(requestedPages.slice(pagesBeforeRemoval)).toEqual([1]);
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
      expect(saved).toEqual([
        { amount: 30 },
        { amount: 30 },
        { amount: -15 },
        { amount: 0 },
      ]);
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
      const personNames = list
        .getByRole("link")
        .locator(":scope > span:last-child");
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
      await expect(personNames).toHaveText(["older-high", "middle"]);
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
      await expect(personNames).toHaveText([
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
      await expect(personNames).toHaveText(["recent-low", "middle"]);
      expect(
        requests.filter((request) => request.orderBy === "last_modified")
      ).toEqual([{ orderBy: "last_modified", page: 1 }]);
      await loadMore.click();
      await expect(personNames).toHaveText([
        "recent-low",
        "middle",
        "older-high",
      ]);
      // Returning to a cached order starts at page one; Load more still works.
      await chooseSort("Highest total first");
      await expect(personNames).toHaveText(["older-high", "middle"]);
      await loadMore.click();
      await expect(personNames).toHaveText([
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
      await expect(personNames).toHaveText(["recent-low", "middle"]);
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
      await expect(list.getByRole("link").first()).toHaveAccessibleName(
        "older-high"
      );
    });
  }

  for (const matter of ["REP", "NIC"] as const) {
    test(`${matter}: visitors can sort Received without gaining editing controls`, async ({
      page,
      baseURL,
      isMobile,
    }) => {
      const api = getSandboxApiOrigin(baseURL);
      const path = matter === "REP" ? "rep" : "cic";
      const orders: string[] = [];
      const people = [
        {
          profile_id: "old",
          handle: "older-high",
          wallets: [],
          rating: 90,
          last_modified: 1,
        },
        {
          profile_id: "middle",
          handle: "middle",
          wallets: [],
          rating: 50,
          last_modified: 5,
        },
        {
          profile_id: "recent",
          handle: "recent-low",
          wallets: [],
          rating: 10,
          last_modified: 9,
        },
      ];
      await installCategories(page, api);
      await page.route(`${api}/api/profiles/*/${path}/overview*`, (route) =>
        route.fulfill({
          json: {
            [matter === "REP" ? "total_rep" : "total_cic"]: 150,
            authenticated_user_contribution: null,
            contributor_count: 3,
            contributors: {
              data: people.map((person, index) => ({
                profile: {
                  handle: person.handle,
                  primary_address: `0x${(index + 1).toString(16).padStart(40, "0")}`,
                  pfp: "/icon-512.png",
                },
                contribution: person.rating,
              })),
              page: 1,
              next: false,
            },
          },
        })
      );
      await page.route(
        `${api}/api/profiles/*/${path}/ratings/by-rater?*`,
        (route) => {
          const params = new URL(route.request().url()).searchParams;
          expect(params.get("given")).toBe("false");
          expect(params.get("order")).toBe("DESC");
          expect(params.get("page")).toBe("1");
          const order = params.get("order_by")!;
          orders.push(order);
          const data = people.toSorted((a, b) =>
            order === "last_modified"
              ? b.last_modified - a.last_modified
              : b.rating - a.rating
          );
          return route.fulfill({ json: { data, page: 1, next: false } });
        }
      );
      await openProfile(page);
      if (isMobile && matter === "NIC")
        await page
          .getByRole("group", { name: "Identity sections", exact: true })
          .getByRole("button", { name: "NIC", exact: true })
          .click();
      const section = page
        .getByRole("region", { name: matter, exact: true })
        .filter({ visible: true });
      const summaryControl = section.getByRole("button", {
        name:
          matter === "REP" ? "View 3 raters" : "View NIC Received: 3 raters",
        exact: true,
      });
      if (isMobile) {
        await expect(
          section.getByRole("link", { name: "older-high", exact: true })
        ).toHaveCount(0);
        await expect(summaryControl.getByRole("link")).toHaveCount(0);
        await summaryControl
          .getByRole("img", { name: "older-high", exact: true })
          .tap();
        await expect(page).toHaveURL(new RegExp(`/${TARGET}$`));
      } else {
        const raterLink = section.getByRole("link", {
          name: "older-high",
          exact: true,
        });
        await expect(raterLink).toHaveAttribute("href", "/older-high");
        expect(
          await raterLink.evaluate((link) => link.closest("button"))
        ).toBeNull();
        await summaryControl.click();
      }
      const list = page.getByRole("dialog", {
        name: matter === "REP" ? "All raters" : "NIC Received",
        exact: true,
      });
      const names = list.getByRole("link").locator(".tw-truncate");
      await expect(
        list.getByRole("link").filter({ hasText: "older-high" })
      ).toHaveAttribute("href", "/older-high");
      const sort = list.getByRole("button", {
        name: new RegExp(`^Sort received ${matter}:`),
      });
      await expect(names).toHaveText(["older-high", "middle", "recent-low"]);
      for (const [label, expected] of [
        ["Most recently adjusted", ["recent-low", "middle", "older-high"]],
        ["Highest total first", ["older-high", "middle", "recent-low"]],
      ] as const) {
        await sort.click();
        await page
          .getByRole("menu")
          .getByRole("menuitem", { name: label, exact: true })
          .click();
        await expect(sort).toHaveAccessibleName(
          `Sort received ${matter}: ${label}`
        );
        await expect(names).toHaveText([...expected]);
      }
      expect(orders).toContain("last_modified");
      await expect(list.getByRole("textbox")).toHaveCount(0);
      await expect(
        list.getByRole("button", { name: /^(Adjust|Save|Cancel)/ })
      ).toHaveCount(0);
      await expectNoHorizontalOverflow(page);
    });
  }

  for (const count of [2, 25]) {
    test(`REP lists share content-sized height behavior (${count} rows)`, async ({
      page,
      baseURL,
      isMobile,
    }, testInfo) => {
      const api = getSandboxApiOrigin(baseURL);
      if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
      else if (count === 25)
        await page.setViewportSize({ width: 900, height: 800 });
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
                pfp: count === 2 && index === 0 ? "/icon-512.png" : null,
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
      const rowStyles: Awaited<
        ReturnType<typeof getContributorRowPresentation>
      >[] = [];
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
        await expect(list.getByRole("link").first().locator("img")).toHaveCount(
          count === 2 ? 1 : 0
        );
        await expect(
          list.getByRole("link").nth(1).locator('[aria-hidden="true"]')
        ).toHaveCount(0);
        await expect(
          list.getByText(
            `${count} ${direction === "Received" ? "raters" : "receivers"}`,
            { exact: true }
          )
        ).toHaveCount(0);
        await expect(list.getByRole("link")).toHaveCount(count);
        await expect(list.getByRole("textbox")).toHaveCount(0);
        if (!isMobile) await expectContributorHandleHover(list);
        rowStyles.push(await getContributorRowPresentation(list));
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
          if (!isMobile) {
            // At the tablet breakpoint the fixed top offset still occupies
            // layout space when the keyboard reduces the visual viewport.
            await page.evaluate(() => {
              const viewport = globalThis.visualViewport;
              if (!viewport) throw new Error("Expected a visual viewport");
              Object.defineProperty(viewport, "height", {
                configurable: true,
                value: globalThis.innerHeight - 300,
              });
              viewport.dispatchEvent(new Event("resize"));
            });
            try {
              await expect
                .poll(async () => {
                  const bounds = await page
                    .getByRole("dialog", { name, exact: true })
                    .locator(".mobile-wrapper-dialog")
                    .boundingBox();
                  return bounds ? bounds.y + bounds.height : Infinity;
                })
                .toBeLessThanOrEqual(viewportHeight - 300 - 24 + 1);
              await list.getByRole("link").last().scrollIntoViewIfNeeded();
              await expect(list.getByRole("link").last()).toBeInViewport();
              await page.screenshot({
                path: testInfo.outputPath(
                  `REP-${direction}-tablet-keyboard.png`
                ),
              });
            } finally {
              await page.evaluate(() => {
                const viewport = globalThis.visualViewport;
                if (!viewport) throw new Error("Expected a visual viewport");
                Reflect.deleteProperty(viewport, "height");
                viewport.dispatchEvent(new Event("resize"));
              });
            }
          }
        }
        if (count === 2) {
          await page.screenshot({
            path: testInfo.outputPath(`REP-${direction}-contributors.png`),
          });
        }
        await expectNoHorizontalOverflow(page);
        await list.getByRole("button", { name: "Close", exact: true }).click();
        await expect(list).toBeHidden();
      }
      if (count === 25) expect(heights[0]).toBeCloseTo(heights[1]!, 0);
      expect(rowStyles[1]).toEqual(rowStyles[0]);
      expect(rowStyles[0]).toEqual(
        expect.objectContaining({
          border: "0px",
          radius: "12px",
          fontSize: "14px",
          fontWeight: "500",
          padding: "6px 12px",
          avatarSize: count === 2 ? 28 : null,
          avatarRadius: count === 2 ? "9999px" : null,
        })
      );
    });
  }

  test("visitor can inspect NIC Received and Given without management controls", async ({
    page,
    baseURL,
    isMobile,
    browserName,
  }, testInfo) => {
    const api = getSandboxApiOrigin(baseURL);
    const activate = (control: Locator) =>
      isMobile ? control.tap() : control.click();
    await installCategories(page, api);
    const directions: string[] = [];
    const overviewDirections: string[] = [];
    const rowStyles: Awaited<
      ReturnType<typeof getContributorRowPresentation>
    >[] = [];
    if (isMobile) await page.setViewportSize({ width: 320, height: 844 });
    await page.route(`${api}/api/profiles/*/cic/overview*`, (route) => {
      const direction =
        new URL(route.request().url()).searchParams.get("direction") ??
        "incoming";
      overviewDirections.push(direction);
      return route.fulfill({
        json: {
          total_cic: direction === "outgoing" ? 1250 : 4100,
          authenticated_user_contribution:
            direction === "outgoing" ? null : 4100,
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
                profile_id: "00000000-0000-4000-8000-000000000531",
                handle: "playwright",
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
        .tap();
    const section = page
      .getByRole("region", { name: "NIC", exact: true })
      .filter({ visible: true });
    for (const direction of ["Received", "Given"]) {
      await activate(
        section.getByRole("button", { name: direction, exact: true })
      );
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
        const rateButton = section.getByRole("button", {
          name: "Rate NIC",
          exact: true,
        });
        const personalRating = section.getByText("Your rating: 4,100", {
          exact: true,
        });
        await expect(personalRating).toBeVisible();
        if (isMobile) {
          for (const width of [320, 540, 768]) {
            await page.setViewportSize({ width, height: 844 });
            const rateBox = await rateButton.boundingBox();
            const countBox = await contributorsButton.boundingBox();
            const ratingBox = await personalRating.boundingBox();
            expect(rateBox).not.toBeNull();
            expect(countBox).not.toBeNull();
            expect(ratingBox).not.toBeNull();
            if (rateBox && countBox && ratingBox) {
              expect(rateBox.y).toBeGreaterThanOrEqual(
                countBox.y + countBox.height
              );
              expect(rateBox.x - ratingBox.x - ratingBox.width).toBeCloseTo(
                8,
                0
              );
              expect(ratingBox.y + ratingBox.height / 2).toBeCloseTo(
                rateBox.y + rateBox.height / 2,
                0
              );
            }
          }
          await page.setViewportSize({ width: 320, height: 844 });
        }
        await activate(rateButton);
        const rate = page.getByRole("dialog", {
          name: "Rate NIC",
          exact: true,
        });
        await expectDesktopRatingPosition(page, "Rate NIC");
        if (isMobile) await expect(rate.getByRole("textbox")).not.toBeFocused();
        else await expect(rate.getByRole("textbox")).toBeFocused();
        await activate(
          rate.getByRole("button", { name: "Cancel", exact: true })
        );
        await expect(rate).toBeHidden();
      }
      if (!isMobile) {
        await expect(avatar).toHaveAttribute("href", "/playwright");
        expect(
          await avatar.evaluate((link) => link.closest("button"))
        ).toBeNull();
        const scoreBox = await section
          .getByText(expectedTotal, { exact: true })
          .boundingBox();
        const contributorsBox = await contributorsButton.boundingBox();
        const avatarBox = await avatar.boundingBox();
        expect(scoreBox).not.toBeNull();
        expect(contributorsBox).not.toBeNull();
        expect(avatarBox).not.toBeNull();
        expect(avatarBox!.x).toBeGreaterThan(scoreBox!.x + scoreBox!.width);
        expect(contributorsBox!.y + contributorsBox!.height / 2).toBeCloseTo(
          scoreBox!.y + scoreBox!.height / 2,
          0
        );
        expect(contributorsBox!.x).toBeGreaterThan(
          avatarBox!.x + avatarBox!.width
        );
      }
      const summaryScreenshot = testInfo.outputPath(
        `NIC-${direction}-summary.png`
      );
      // Full-page captures reset Chromium touch emulation; keep this flow touch-capable.
      await page.screenshot({ path: summaryScreenshot });
      await testInfo.attach(`NIC-${direction}-summary`, {
        path: summaryScreenshot,
        contentType: "image/png",
      });
      if (isMobile) {
        await expect(avatar).toHaveCount(0);
        await contributorsButton
          .getByRole("img", { name: "playwright", exact: true })
          .tap();
      } else {
        await avatar.focus();
        await page.keyboard.press(browserName === "webkit" ? "Alt+Tab" : "Tab");
        await expect(contributorsButton).toBeFocused();
        await contributorsButton.press("Enter");
      }
      const list = page.getByRole("dialog", {
        name: `NIC ${direction}`,
        exact: true,
      });
      const closeButton = list.getByRole("button", {
        name: "Close",
        exact: true,
      });
      await expect(closeButton).toHaveCSS("border-radius", "8px");
      await expect(
        list.getByRole("button", { name: "Close", exact: true }).locator("span")
      ).toHaveCSS("border-radius", "8px");
      await expectDesktopRatingPosition(page, `NIC ${direction}`);
      await expect(
        list.getByText(`1 ${direction === "Received" ? "rater" : "receiver"}`, {
          exact: true,
        })
      ).toHaveCount(1);
      await expect(list.getByRole("textbox")).toHaveCount(0);
      if (!isMobile) await expectContributorHandleHover(list);
      rowStyles.push(await getContributorRowPresentation(list));
      await expect(
        list.getByRole("link", { name: "playwright" })
      ).toBeVisible();
      await expect(list.getByRole("button", { name: /Adjust/ })).toHaveCount(0);
      await expect(
        list.getByRole("button", {
          name: new RegExp(`^Sort ${direction.toLowerCase()} NIC:`),
        })
      ).toHaveCount(1);
      const panel = await page
        .getByRole("dialog", { name: `NIC ${direction}`, exact: true })
        .locator(".mobile-wrapper-dialog")
        .boundingBox();
      expect(panel?.height).toBeLessThan(
        (page.viewportSize()?.height ?? 720) * 0.6
      );
      await page.screenshot({
        path: testInfo.outputPath(`NIC-${direction}-contributors.png`),
      });
      await activate(list.getByRole("button", { name: "Close", exact: true }));
      await expect(list).toBeHidden();
    }
    expect(directions).toEqual(["false", "true"]);
    expect(rowStyles[1]).toEqual(rowStyles[0]);
    expect(rowStyles[0]?.avatarRadius).toBeNull();
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
      await sections.getByRole("button", { name: "REP", exact: true }).tap();
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
      const statementCount = statements.getByText(/^[0-9,]+ statements?$/);
      await expect(statementCount).toBeVisible();
      await expect(statementCount).toHaveCSS("padding-left", "0px");
      await expect(statementCount).toHaveCSS("padding-right", "0px");
      for (const width of [320, 768]) {
        await page.setViewportSize({ width, height: 844 });
        const sectionBox = await statements.boundingBox();
        expect(sectionBox).not.toBeNull();
        for (const content of [
          statements.getByRole("heading", { level: 3 }).first(),
          statements.getByRole("heading", { level: 3 }).last(),
          statements.getByRole("list").first(),
        ]) {
          const box = await content.boundingBox();
          expect(box).not.toBeNull();
          if (box && sectionBox) {
            expect(box.x).toBeCloseTo(sectionBox.x, 0);
            expect(box.x + box.width).toBeLessThanOrEqual(
              sectionBox.x + sectionBox.width + 1
            );
          }
        }
        await expectNoHorizontalOverflow(page);
      }
      await page.setViewportSize({ width: 320, height: 844 });
      await page.screenshot({
        path: testInfo.outputPath("id-statements-mobile.png"),
      });
      await sections.getByRole("button", { name: "NIC", exact: true }).click();
      await expect(section.getByText("4,100", { exact: true })).toBeVisible();
    }
    expect(
      overviewDirections.filter((direction) => direction === "outgoing")
    ).toHaveLength(1);
    await expectNoHorizontalOverflow(page);
    if (isMobile) {
      await section.getByRole("button", { name: /^View NIC Received:/ }).tap();
      await page
        .getByRole("dialog", { name: "NIC Received", exact: true })
        .getByRole("link", { name: "playwright", exact: true })
        .tap();
    } else {
      await section
        .getByRole("link", { name: "playwright", exact: true })
        .press("Enter");
    }
    await expect(page).toHaveURL(/\/playwright$/);
    await expect(
      page.getByRole("heading", { name: "playwright", exact: true })
    ).toBeVisible();
  });
});
