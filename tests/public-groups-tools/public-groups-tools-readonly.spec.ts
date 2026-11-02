import { installGroupGrantFixtures } from "../support/groupGrantFixtures";
import { installSurfaceSimulation } from "../support/surfaceSimulation";
import type { Locator, Page } from "@playwright/test";

import {
  expect,
  expectActiveOptionIndicator,
  expectKeyboardFocusIndicator,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";
import { expectUrlState } from "../support/urlState";

async function gotoReady(
  page: Page,
  path: string,
  options: { readySelector?: string } = {}
) {
  await gotoDocumentWithTransientRetry(page, path);
  await waitForRouteReady(page, options);
  await expectNoHorizontalOverflow(page);
}

async function openGroupFilters(page: Page) {
  const openButton = page.getByRole("button", { name: "Open group filters" });
  // The route shell can be visible before the data-backed controls render.
  // This control is required on both viewports, so do not silently skip it.
  await expect(openButton.first()).toBeVisible();
  await openButton.first().click();
}

async function expectAnyVisible(
  candidates: readonly Locator[],
  description: string
) {
  for (const candidate of candidates) {
    if (
      await candidate
        .first()
        .isVisible({ timeout: 1000 })
        .catch(() => false)
    ) {
      return;
    }
  }

  expect(false, `Expected one visible ${description}`).toBe(true);
}

async function expectSubscriptionsSettled(page: Page) {
  await expect(page.getByText(/Loading upcoming drops/i)).toBeHidden({
    timeout: 30000,
  });
  await expect(page.getByText(/Loading past drops/i)).toBeHidden({
    timeout: 30000,
  });
}

function resolveApiEndpoint(baseURL: string): string {
  const appUrl = new URL(baseURL);
  if (process.env["PLAYWRIGHT_COMPOSER_SANDBOX"] === "1") {
    const sandboxPort =
      process.env["PLAYWRIGHT_COMPOSER_SANDBOX_API_PORT"] ||
      String(Number(appUrl.port || "3001") + 1000);
    return `http://127.0.0.1:${sandboxPort}`;
  }
  if (appUrl.hostname === "staging.6529.io") {
    return "https://api.staging.6529.io";
  }
  if (appUrl.hostname === "6529.io" || appUrl.hostname === "www.6529.io") {
    return "https://api.6529.io";
  }
  return process.env["API_ENDPOINT"] || "http://localhost:3000";
}

async function getStagingApiHeaders(
  page: Page,
  apiEndpoint: string
): Promise<Record<string, string>> {
  if (new URL(apiEndpoint).hostname !== "api.staging.6529.io") {
    return {};
  }
  const apiAuth =
    (await page.context().cookies()).find(
      (cookie) => cookie.name === "x-6529-auth"
    )?.value ?? process.env["STAGING_API_KEY"];

  return apiAuth ? { "x-6529-auth": apiAuth } : {};
}

test.describe("Public tools, calendar, and removed Groups route coverage @surface @medium @large @readonly", () => {
  test("About groups Safe Collecting pages and keeps GDRC and Primary Address last", async ({
    page,
  }) => {
    await gotoReady(page, "/about");
    const main = page.getByRole("main").first();
    const wallets = main.getByRole("region", {
      name: "Safe Collecting",
      exact: true,
    });
    // Links by exact href, scoped under accessible queries.
    const mainLinkTo = (href: string) =>
      page.getByRole("main").first().locator(`a[href="${href}"]`);
    const walletLinkTo = (href: string) =>
      page
        .getByRole("main")
        .first()
        .getByRole("region", { name: "Safe Collecting", exact: true })
        .locator(`a[href="${href}"]`);
    const collections = main.getByRole("region", {
      name: "Collections & Minting",
      exact: true,
    });
    await expect(wallets).toBeVisible();
    await expect(wallets.getByRole("link").last()).toHaveAttribute(
      "href",
      "/about/primary-address"
    );
    await expect(collections.getByRole("link").last()).toHaveAttribute(
      "href",
      "/about/gdrc1"
    );
    await expect(mainLinkTo("/about/nft-delegation")).toHaveCount(0);
    await expect(walletLinkTo("/about/gdrc1")).toHaveCount(0);
    for (const path of [
      "/safe-collecting",
      "/safe-collecting/tap-guide",
      "/safe-collecting/faq",
      "/safe-collecting/consolidation-use-cases",
      "/safe-collecting/wallet-checker",
    ]) {
      await expect(walletLinkTo(path)).toHaveCount(1);
    }
    await wallets
      .getByRole("link", { name: "Open page: FAQ", exact: true })
      .click();
    await expect(page).toHaveURL(
      (url) => url.pathname === "/safe-collecting/faq"
    );
    await expect(
      page.getByRole("heading", { level: 1, name: "FAQ", exact: true })
    ).toBeVisible();
  });

  test("renders the Tools index with grouped utility links", async ({
    page,
  }) => {
    await gotoReady(page, "/tools");

    await expect(page).toHaveURL((url) => url.pathname === "/tools");
    await expect(page).toHaveTitle("Tools");
    await expect(
      page.getByRole("heading", { level: 1, name: "6529 Tools" })
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Safe Collecting", exact: true })
    ).toBeVisible();
    await expect(page.getByText("The Memes Tools")).toBeVisible();
    await expect(page.getByText("Builder Tools")).toBeVisible();
    await expect(
      page.getByRole("heading", { level: 2, name: "Open Data" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Open tool: API" })
    ).toHaveAttribute("href", "/tools/api");
    await expect(
      page.getByRole("link", { name: "Open tool: 6529bot Usage" })
    ).toHaveAttribute("href", "/open-data/6529bot");
    await expect(
      page.getByRole("link", { name: "Open tool: GDRC" })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  for (const path of [
    "/network/groups",
    "/network/groups?edit=new",
    "/network/groups?edit=example-group",
  ]) {
    test(`keeps the removed Groups route unavailable at ${path}`, async ({
      page,
    }) => {
      await gotoDocumentWithTransientRetry(page, path);

      // Predicate-based toHaveURL also waits for the load event, which pending
      // media can delay after the URL already matches; see tests/README.md.
      await expectUrlState(page, (url) => url.pathname + url.search === path);
      await expect(page).toHaveTitle(/404/i);
      await expect(
        page.getByRole("heading", { name: /404.*PAGE NOT FOUND/i })
      ).toBeVisible();
      await expectNoHorizontalOverflow(page);
    });
  }

  test("uses a criteria-only network filter and restores deep-linked groups", async ({
    baseURL,
    page,
  }) => {
    await gotoReady(page, "/network");

    await openGroupFilters(page);
    const filter = page.getByRole("dialog", { name: "Filter Network" });
    const narrowFilter = await page.evaluate(
      () =>
        window.matchMedia("(max-width: 1023px), (any-pointer: coarse)").matches
    );
    const choices = filter.getByRole("group", {
      name: "Filter Network",
      includeHidden: true,
    });
    const openCriterion = async (name: string | RegExp) => {
      const back = filter.getByRole("button", { name: "Back", exact: true });
      if (await back.isVisible()) await back.click();
      await choices.getByRole("button", { name, exact: true }).click();
    };
    const readiness = filter.getByRole("button", { name: "Not ready yet." });
    const guidance = page.getByRole("tooltip");
    await expect(guidance).toBeHidden();
    if (narrowFilter) {
      await readiness.tap();
    } else {
      await readiness.hover();
    }
    await expect(guidance).toBeVisible();
    await expect(guidance).toContainText(
      "Finish the missing group rules before you create this group."
    );
    const guidanceBounds = await guidance.boundingBox();
    const viewportWidth = await page.evaluate(() => window.innerWidth);
    expect(guidanceBounds!.width).toBeGreaterThanOrEqual(240);
    expect(guidanceBounds!.x).toBeGreaterThanOrEqual(0);
    expect(guidanceBounds!.x + guidanceBounds!.width).toBeLessThanOrEqual(
      viewportWidth
    );
    expect(
      await guidance
        .getByRole("paragraph")
        .last()
        .evaluate((element) =>
          Number.parseFloat(getComputedStyle(element).lineHeight)
        )
    ).toBeGreaterThanOrEqual(19);
    await choices
      .getByRole("button", { name: "Identities", exact: true })
      .focus();
    await page.mouse.move(0, 0);
    await expect(guidance).toBeHidden();
    await readiness.focus();
    await expect(guidance).toBeVisible();
    const levelInput = filter.getByRole("spinbutton", {
      name: "Level at least",
    });
    await expect(levelInput).toBeHidden();
    const criteria = [
      "Identities",
      "Level",
      "TDH",
      "NIC",
      "Rep",
      "Required NFTs",
      "Collection Access",
      "xTDH Grant",
    ];
    await expect(
      filter
        .getByRole("group", { name: "Filter Network", includeHidden: true })
        .locator("[data-criterion]")
    ).toHaveText(criteria);
    const identityEditor = filter.getByRole("region", { name: "Identities" });
    if (narrowFilter) {
      await expect(identityEditor).toBeHidden();
      await expect(choices).toBeVisible();
    } else {
      await expect(identityEditor).toBeVisible();
    }
    if (!narrowFilter) {
      const navigationBounds = await choices.boundingBox();
      const editorBounds = await filter
        .getByRole("region", { name: "Identities", exact: true })
        .boundingBox();
      expect(editorBounds!.x).toBeGreaterThanOrEqual(
        navigationBounds!.x + navigationBounds!.width
      );
      const positions = await choices
        .getByRole("button")
        .evaluateAll((buttons) =>
          buttons.map((button) => button.getBoundingClientRect().x)
        );
      expect(Math.max(...positions) - Math.min(...positions)).toBeLessThan(1);
    }
    for (const name of criteria) {
      const choice = choices.getByRole("button", { name, exact: true });
      await choice.scrollIntoViewIfNeeded();
      await expect(choice).toBeInViewport();
    }
    await choices
      .getByRole("button", { name: "Identities", exact: true })
      .scrollIntoViewIfNeeded();
    await expect(
      filter.getByRole("button", { name: "Edit criteria" })
    ).toHaveCount(0);
    const apply = filter.getByRole("button", {
      name: "Create and use new group",
    });
    await expect(apply).toBeDisabled();
    await expect(apply).toBeInViewport({ ratio: 1 });
    const emptySummary = filter.getByText("No criteria selected");
    if (narrowFilter) await emptySummary.scrollIntoViewIfNeeded();
    await expect(emptySummary).toBeInViewport();
    await expect(
      filter.getByText("Before editing", { exact: true })
    ).toHaveCount(0);
    await expect(
      filter.getByText("After editing", { exact: true })
    ).toHaveCount(0);
    await expect(
      filter.getByText("All Network members", { exact: true })
    ).toHaveCount(0);
    const restingHeight = await choices.evaluate(
      (element) =>
        element.closest(".mobile-wrapper-dialog")?.getBoundingClientRect()
          .height
    );
    if (narrowFilter) {
      const availableHeight = await page.evaluate(
        () => window.innerHeight - 64
      );
      expect(restingHeight).toBeCloseTo(availableHeight, 0);
      const navigationWidth = await choices.evaluate((element) => ({
        width: element.clientWidth,
        scrollWidth: element.scrollWidth,
      }));
      expect(navigationWidth.scrollWidth).toBeLessThanOrEqual(
        navigationWidth.width
      );
    }
    if (narrowFilter) {
      const widths = await apply.evaluate((element) => ({
        button: element.getBoundingClientRect().width,
        content: element.parentElement
          ? element.parentElement.getBoundingClientRect().width -
            Number.parseFloat(
              getComputedStyle(element.parentElement).paddingLeft
            ) -
            Number.parseFloat(
              getComputedStyle(element.parentElement).paddingRight
            )
          : 0,
      }));
      expect(widths.button).toBeCloseTo(widths.content ?? 0, 0);
    }
    for (const name of [
      "Identities",
      "Required NFTs",
      "Collection Access",
      "xTDH Grant",
    ]) {
      await openCriterion(name);
      await expect(filter.getByRole("region", { name })).toBeVisible();
      await expect
        .poll(() =>
          choices.evaluate(
            (element) =>
              element.closest(".mobile-wrapper-dialog")?.getBoundingClientRect()
                .height
          )
        )
        .toBeCloseTo(restingHeight ?? 0, 0);
      if (narrowFilter) {
        await expect(choices).toBeHidden();
        await expect(
          filter.getByRole("button", { name: "Back", exact: true })
        ).toBeInViewport({ ratio: 1 });
      } else {
        await expect(choices).toBeInViewport({ ratio: 1 });
      }
    }
    const clearGrantFilters = filter.getByRole("button", {
      name: "Clear filters",
      exact: true,
    });
    const collectionName = filter.getByRole("textbox", {
      name: "Collection name",
    });
    await expect(clearGrantFilters).toHaveCount(0);
    await collectionName.fill("Memes");
    await expect(clearGrantFilters).toBeVisible();
    await clearGrantFilters.click();
    await expect(collectionName).toHaveValue("");
    await expect(clearGrantFilters).toHaveCount(0);
    await filter.getByRole("tab", { name: "Pending", exact: true }).click();
    await expect(clearGrantFilters).toHaveCount(0);
    await collectionName.fill("Memes");
    await expect(clearGrantFilters).toBeVisible();
    await clearGrantFilters.click();
    await expect(
      filter.getByRole("tab", { name: "Pending", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      filter.getByRole("tab", { name: "Pending", exact: true })
    ).toBeFocused();
    await expect(collectionName).toHaveValue("");
    await expect(clearGrantFilters).toHaveCount(0);
    await expect(apply).toBeDisabled();
    await openCriterion("Level");
    await levelInput.fill("10");
    await openCriterion("Identities");
    await expect(
      filter.getByText("No identities are explicitly included.")
    ).toHaveCount(0);
    await expect(
      filter.getByRole("heading", { name: "Find an identity to include" })
    ).toBeVisible();
    await expect(
      filter.getByRole("textbox", { name: "Find an identity to include" })
    ).toBeVisible();
    await expect(
      filter.getByRole("textbox", { name: "Find an identity to include" })
    ).toHaveAttribute("placeholder", "Search identities to include...");
    await expect(
      filter.getByText("No allowlist added.", { exact: true })
    ).toHaveCount(0);
    await expect(
      filter.getByText("No CSV file added.", { exact: true })
    ).toHaveCount(0);
    await expect(
      filter.getByText("0 unique identities included", { exact: true })
    ).toHaveCount(0);
    await expect(
      filter.getByRole("heading", { name: "EMMA", exact: true })
    ).toBeVisible();
    await expect(
      filter.getByRole("heading", { name: "CSV file", exact: true })
    ).toBeVisible();
    await expect(
      filter.getByRole("textbox", { name: "Search allowlists", exact: true })
    ).toBeVisible();
    await expect(
      filter.getByRole("button", { name: "EMMA", exact: true })
    ).toHaveCount(0);
    await expect(
      filter.getByRole("button", { name: "CSV file", exact: true })
    ).toHaveCount(0);
    const identityModes = filter.getByRole("tablist", {
      name: "Identity treatment",
    });
    await expect(
      identityModes.getByRole("tab", { name: "Included", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await identityModes
      .getByRole("tab", { name: "Excluded", exact: true })
      .click();
    await expect(
      identityModes.getByRole("tab", { name: "Excluded", exact: true })
    ).toHaveAttribute("aria-selected", "true");
    await expect(
      filter.getByText("No identities are explicitly excluded.")
    ).toHaveCount(0);
    await expect(
      filter.getByText("No allowlist added.", { exact: true })
    ).toHaveCount(0);
    await expect(
      filter.getByText("No CSV file added.", { exact: true })
    ).toHaveCount(0);
    await openCriterion(/^Level(?: Configured)?$/);
    await expect(levelInput).toHaveValue("10");
    await expect(apply).toBeEnabled();
    await expect(apply).toBeInViewport({ ratio: 1 });
    await openCriterion("TDH");
    await filter
      .getByRole("spinbutton", { name: "TDH + xTDH at least" })
      .fill("1000");
    await openCriterion("Collection Access");
    for (const name of ["Gradients", "Memes", "Memelab", "Nextgen"]) {
      await filter
        .getByRole("region", { name: "Collection Access", exact: true })
        .getByRole("button", { name, exact: true })
        .click();
    }
    const criteriaTags = filter.getByRole("list").filter({
      has: page.getByText("Level at least 10", { exact: true }),
    });
    await expect(criteriaTags.getByRole("listitem")).toHaveCount(6);
    await expect(
      criteriaTags.getByText("TDH + xTDH at least 1,000", { exact: true })
    ).toBeVisible();
    await expect(apply).toBeInViewport({ ratio: 1 });
    await expectNoHorizontalOverflow(page);
    const preview = filter.getByRole("button", { name: "View members" });
    if (narrowFilter) {
      await preview.scrollIntoViewIfNeeded();
      expect(
        await criteriaTags.evaluate((element) => ({
          maxHeight: getComputedStyle(element).maxHeight,
          overflow: getComputedStyle(element).overflowY,
        }))
      ).toEqual({ maxHeight: "none", overflow: "visible" });
    }
    await expect(preview).toBeInViewport();
    await expect(apply).toBeInViewport({ ratio: 1 });
    await expect(
      page
        .getByRole("button", { name: "Choose group" })
        .filter({ visible: true })
    ).toHaveCount(0);
    await expect(page.getByText("Hide criteria and members")).toHaveCount(0);

    await filter.getByRole("button", { name: "Close", exact: true }).click();
    await expect(filter).toBeHidden();
    await expect(
      page.getByRole("button", { name: "Open group filters" })
    ).toBeFocused();

    // Resolve a real group id read-only so the deep-link behavior remains
    // portable across local, staging, and production data sets.
    const apiEndpoint = resolveApiEndpoint(baseURL ?? "http://localhost:3001");
    const groupsResponse = await page.request.get(`${apiEndpoint}/api/groups`, {
      headers: await getStagingApiHeaders(page, apiEndpoint),
    });
    expect(groupsResponse.ok()).toBe(true);
    const groupsPayload = (await groupsResponse.json()) as
      | { readonly id?: string; readonly name?: string }[]
      | { readonly data?: { readonly id?: string; readonly name?: string }[] };
    const groups = Array.isArray(groupsPayload)
      ? groupsPayload
      : (groupsPayload.data ?? []);
    expect(groups.length, "Expected at least one public group").toBeGreaterThan(
      0
    );
    const groupId = groups[0]?.id;
    if (typeof groupId !== "string") {
      throw new Error("Expected the first public group to have an id");
    }

    // Deep-link the group: the URL param hydrates the active-group state.
    await gotoReady(page, `/network?group=${groupId}`);
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("group") === groupId
    );

    // The current Network UI exposes the active state in the filter trigger and
    // the selected-group summary on both desktop and mobile layouts.
    await expect(
      page.getByRole("button", { name: "Open group filters (active)" })
    ).toBeVisible({ timeout: 30000 });
    await expect(page.getByText("Selected group", { exact: true })).toBeVisible(
      {
        timeout: 30000,
      }
    );

    // Clearing the group exercises the state transition back to null and
    // must drop the URL param.
    const clearButton = page
      .getByRole("button", { name: "Clear selected group" })
      .filter({ visible: true });
    await expect(clearButton).toBeVisible({ timeout: 15000 });
    await clearButton.click();
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("group") === null,
      { timeout: 15000 }
    );

    await expectNoHorizontalOverflow(page);
  });

  test("scrolls the mobile summary after the editor while keeping navigation and the action visible", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 620 });
    await gotoReady(page, "/network");
    await openGroupFilters(page);
    const filter = page.getByRole("dialog", { name: "Filter Network" });
    const choices = filter.getByRole("group", { name: "Filter Network" });
    const level = filter.getByRole("spinbutton", { name: "Level at least" });
    await choices.getByRole("button", { name: "Level", exact: true }).click();
    await level.fill("10");
    const back = filter.getByRole("button", { name: "Back", exact: true });
    await back.click();
    await choices
      .getByRole("button", { name: "Identities", exact: true })
      .click();
    const identities = filter.getByRole("region", {
      name: "Identities",
      exact: true,
    });
    const summary = filter
      .getByRole("region", { name: "Identities", exact: true })
      .locator("[data-group-criteria-summary]");
    await expect(summary).toHaveCount(1);
    await expect(summary).not.toBeInViewport();
    const apply = filter.getByRole("button", {
      name: "Create and use new group",
    });
    const applyBeforeScroll = await apply.boundingBox();
    const backBeforeScroll = await back.boundingBox();
    // Mobile WebKit does not support mouse.wheel. Scroll the real editor
    // directly and keep the same rendered-position and navigation guarantees.
    await identities.evaluate((element) => {
      element.scrollTo({ top: element.scrollHeight });
    });
    await expect
      .poll(() => identities.evaluate((element) => element.scrollTop))
      .toBeGreaterThan(0);
    await expect(choices).toBeHidden();
    await expect(summary).toBeInViewport({ ratio: 1 });
    await expect(
      summary.getByText("Level at least 10", { exact: true })
    ).toBeVisible();
    expect(
      await summary.evaluate((element) => ({
        background: getComputedStyle(element).backgroundColor,
        borderWidth: getComputedStyle(element).borderTopWidth,
      }))
    ).toEqual({ background: "rgb(28, 28, 33)", borderWidth: "0px" });
    await expect
      .poll(async () => (await apply.boundingBox())?.y)
      .toBeCloseTo(applyBeforeScroll?.y ?? 0, 0);
    await expect(back).toBeInViewport({ ratio: 1 });
    await expect
      .poll(async () => (await back.boundingBox())?.y)
      .toBeCloseTo(backBeforeScroll?.y ?? 0, 0);
    await expect(
      filter.getByRole("button", { name: "Close", exact: true })
    ).toBeInViewport({ ratio: 1 });
    await expect(
      filter.getByRole("button", { name: "Create and use new group" })
    ).toBeInViewport({ ratio: 1 });
    await expect(identities).toBeFocused();
    await back.click();
    await expect(
      choices.getByRole("button", { name: "Identities", exact: true })
    ).toBeFocused();
    await choices
      .getByRole("button", { name: "Level Configured", exact: true })
      .click();
    await expect(level).toHaveValue("10");
  });

  test("scrolls mobile grant filters and paginated results together", async ({
    page,
    isMobile,
  }) => {
    const requestedPages = await installGroupGrantFixtures(page);
    // The synthetic grant has no real audience; keep its read-only preview local.
    await page.route("**/api/groups/preview-members?**", (route) =>
      route.fulfill({ json: { data: [], count: 0, page: 1, next: false } })
    );
    await page.setViewportSize({ width: 390, height: 620 });
    await gotoReady(page, "/network");
    await openGroupFilters(page);
    const filter = page.getByRole("dialog", { name: "Filter Network" });
    await filter
      .getByRole("button", { name: "xTDH Grant", exact: true })
      .click();
    const editor = filter.getByRole("region", {
      name: "xTDH Grant",
      exact: true,
    });
    const cards = editor.getByRole("button", { name: /Scroll collection / });
    const loadMore = editor.getByRole("button", {
      name: "Load more",
      exact: true,
    });
    const collectionName = editor.getByRole("textbox", {
      name: "Collection name",
    });
    await expect(cards).toHaveCount(20);
    await expect(collectionName).toBeInViewport();
    const statusTabs = editor.getByRole("tablist", {
      name: "Filter by status",
    });
    const statusBounds = await statusTabs.boundingBox();
    const inputBounds = await collectionName.boundingBox();
    expect(statusBounds!.width).toBeCloseTo(inputBounds!.width, 0);
    const lastStatusBounds = await statusTabs
      .getByRole("tab", { name: "Failed", exact: true })
      .boundingBox();
    expect(lastStatusBounds!.x + lastStatusBounds!.width).toBeCloseTo(
      statusBounds!.x + statusBounds!.width - 5,
      0
    );
    await expect(loadMore).not.toBeInViewport();
    const list = editor.getByRole("list");
    expect(
      await list.evaluate((element) => {
        let ancestor = element.parentElement;
        let nestedScrollers = 0;
        while (ancestor && ancestor.tagName !== "SECTION") {
          if (
            ["auto", "scroll"].includes(getComputedStyle(ancestor).overflowY) &&
            ancestor.scrollHeight > ancestor.clientHeight + 1
          )
            nestedScrollers++;
          ancestor = ancestor.parentElement;
        }
        return nestedScrollers;
      })
    ).toBe(0);
    const back = filter.getByRole("button", { name: "Back", exact: true });
    const headerBefore = await back.boundingBox();
    await loadMore.scrollIntoViewIfNeeded();
    await expect(collectionName).not.toBeInViewport();
    await expect(loadMore).toBeInViewport({ ratio: 1 });
    const lastCardBounds = await cards.last().boundingBox();
    const loadMoreBounds = await loadMore.boundingBox();
    expect(loadMoreBounds!.y).toBeGreaterThanOrEqual(
      lastCardBounds!.y + lastCardBounds!.height
    );
    await expect(back).toBeInViewport({ ratio: 1 });
    expect((await back.boundingBox())!.y).toBeCloseTo(headerBefore!.y, 0);
    await expect(
      filter.getByRole("button", { name: "Close", exact: true })
    ).toBeInViewport({ ratio: 1 });
    await expect(
      filter.getByRole("button", { name: "Create and use new group" })
    ).toBeInViewport({ ratio: 1 });
    await loadMore.click();
    await expect(cards).toHaveCount(22);
    await expect(loadMore).toHaveCount(0);
    expect(requestedPages).toEqual([1, 2]);
    await cards.last().scrollIntoViewIfNeeded();
    await expect(cards.last()).toBeInViewport({ ratio: 1 });
    await expectNoHorizontalOverflow(page);
    if (
      !(await page.evaluate(() => matchMedia("(any-pointer: coarse)").matches))
    ) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await expect
        .poll(() =>
          list.evaluate((element) => element.parentElement?.clientHeight)
        )
        .toBe(320);
    }
    await cards
      .last()
      .getByText("Scroll collection 22", { exact: true })
      .click();
    const selection = editor.getByRole("group", {
      name: "xTDH Grant Beneficiary",
      exact: true,
    });
    await expect(selection).toBeFocused();
    await expect(
      selection.getByText("Scroll collection 22", { exact: true })
    ).toBeInViewport({ ratio: 1 });
    await expect(
      editor.getByRole("textbox", { name: "Collection name" })
    ).toHaveCount(0);
    await expect(
      filter.getByRole("button", { name: "Close", exact: true })
    ).toBeInViewport({ ratio: 1 });
  });

  test("keeps the mobile sheet header stable while keyboard layout animates", async ({
    page,
    baseURL,
    isMobile,
  }) => {
    test.skip(!isMobile, "Native keyboard geometry uses the mobile viewport.");
    await page.setViewportSize({ width: 390, height: 844 });
    await installSurfaceSimulation(
      page.context(),
      "capacitor-ios-sim",
      baseURL
    );
    await installGroupGrantFixtures(page);
    await gotoReady(page, "/network");
    await openGroupFilters(page);
    const filter = page.getByRole("dialog", { name: "Filter Network" });
    await filter
      .getByRole("button", { name: "xTDH Grant", exact: true })
      .click();
    await expect(
      filter.getByRole("textbox", { name: "Collection name" })
    ).toBeVisible();
    const sheet = page
      .getByRole("dialog", { name: "Filter Network" })
      .locator(".mobile-wrapper-dialog");
    // The native phone supplies these CSS variables. This checks browser layout,
    // not the OS keyboard or its animation frame rate.
    const geometry = await sheet.evaluate(async (element) => {
      const style = document.documentElement.style;
      const insetName = "--native-keyboard-inset-bottom";
      const durationName = "--native-keyboard-layout-transition-duration";
      const previousInset = style.getPropertyValue(insetName);
      const previousDuration = style.getPropertyValue(durationName);
      const initial = element.getBoundingClientRect();
      const samples: { top: number; height: number }[] = [];
      const sampleTransition = (inset: number) =>
        new Promise<void>((resolve) => {
          style.setProperty(insetName, `${inset}px`);
          const start = performance.now();
          const sample = () => {
            const bounds = element.getBoundingClientRect();
            samples.push({ top: bounds.top, height: bounds.height });
            if (performance.now() - start < 400) requestAnimationFrame(sample);
            else resolve();
          };
          requestAnimationFrame(sample);
        });
      try {
        style.setProperty(durationName, "250ms");
        await sampleTransition(300);
        await sampleTransition(0);
        return { top: initial.top, height: initial.height, samples };
      } finally {
        if (previousInset) style.setProperty(insetName, previousInset);
        else style.removeProperty(insetName);
        if (previousDuration) style.setProperty(durationName, previousDuration);
        else style.removeProperty(durationName);
      }
    });
    expect(
      Math.max(
        ...geometry.samples.map(({ top }) => Math.abs(top - geometry.top))
      )
    ).toBeLessThan(2);
    expect(
      Math.min(...geometry.samples.map(({ height }) => height))
    ).toBeLessThan(geometry.height - 290);
    expect(geometry.samples.at(-1)!.height).toBeCloseTo(geometry.height, 0);
    await expect(
      filter.getByRole("button", { name: "Back", exact: true })
    ).toBeInViewport({ ratio: 1 });
    await expect(
      filter.getByRole("button", { name: "Close", exact: true })
    ).toBeInViewport({ ratio: 1 });
  });

  test("keeps the Network filter as a sheet at tablet and touch widths", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 820, height: 900 });
    await gotoReady(page, "/network");
    await openGroupFilters(page);
    const sheet = page
      .getByRole("dialog", { name: "Filter Network" })
      .locator(".mobile-wrapper-dialog");
    // A compact sheet need not start near the top. Its bottom anchoring and
    // stable height distinguish it from the centered desktop modal.
    await expect
      .poll(async () => {
        const bounds = await sheet.boundingBox();
        return bounds ? bounds.y + bounds.height : null;
      })
      .toBeCloseTo(900, 0);
    const tabletBounds = await sheet.boundingBox();
    expect(tabletBounds).not.toBeNull();
    expect(tabletBounds?.y).toBeGreaterThanOrEqual(0);
    expect(tabletBounds?.height).toBeGreaterThan(0);

    if (
      await page.evaluate(() => matchMedia("(any-pointer: coarse)").matches)
    ) {
      await page.setViewportSize({ width: 1280, height: 900 });
      await expect
        .poll(async () => {
          const bounds = await sheet.boundingBox();
          return bounds ? bounds.y + bounds.height : null;
        })
        .toBeCloseTo(900, 0);
      const touchBounds = await sheet.boundingBox();
      expect(touchBounds?.y).toBeGreaterThanOrEqual(0);
      expect(touchBounds?.height).toBeCloseTo(tabletBounds?.height ?? 0, 0);
    }
  });

  test("renders the subscriptions report read-only and keeps download actions explicit", async ({
    page,
  }) => {
    await gotoReady(page, "/tools/subscriptions-report");

    await expect(page).toHaveURL(
      (url) => url.pathname === "/tools/subscriptions-report"
    );
    await expect(page).toHaveTitle(/Subscriptions Report/i);
    await expect(
      page.getByRole("heading", { level: 1, name: "Subscriptions Report" })
    ).toBeVisible();
    await expect(
      page.getByRole("link", {
        name: "Learn more about The Memes subscriptions",
      })
    ).toHaveAttribute("href", "/about/subscriptions");
    await expect(
      page.getByText("Upcoming Drops", { exact: true })
    ).toBeVisible();
    await expect(page.getByText("Past Drops", { exact: true })).toBeVisible();

    await expectSubscriptionsSettled(page);
    const upcomingDrops = page.getByTestId(
      "subscriptions-report-upcoming-drops"
    );
    const pastDrops = page.getByTestId("subscriptions-report-past-drops");
    await expectAnyVisible(
      [
        upcomingDrops.getByRole("link", { name: /^View The Memes card #/ }),
        upcomingDrops.getByText("No Subscriptions Found", { exact: true }),
      ],
      "upcoming subscription rows or empty state"
    );
    await expectAnyVisible(
      [
        pastDrops.getByRole("link", { name: /^View The Memes card #/ }),
        pastDrops.getByText("No Subscriptions Found", { exact: true }),
      ],
      "past subscription rows or empty state"
    );
    await expect(
      page.getByRole("button", { name: /^Download$/ })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "My Subscriptions" })
    ).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });

  test("renders the Meme Calendar locale and timezone controls without downloads", async ({
    page,
  }) => {
    await gotoReady(page, "/meme-calendar?locale=de-DE");

    await expect(page).toHaveURL((url) => {
      return (
        url.pathname === "/meme-calendar" &&
        url.searchParams.get("locale") === "de-DE"
      );
    });
    await expect(page).toHaveTitle(/Memes Minting Calendar/i);
    await expect(
      page.getByRole("heading", {
        level: 1,
        name: "The Memes Minting Calendar",
      })
    ).toBeVisible();

    const timezoneTabs = page.getByRole("tablist", {
      name: "Calendar timezone",
    });
    const localTab = timezoneTabs.getByRole("tab", {
      name: "Local",
      exact: true,
    });
    const utcTab = timezoneTabs.getByRole("tab", {
      name: "UTC",
      exact: true,
    });
    await expect(localTab).toHaveAttribute("aria-selected", "true");
    await expect(utcTab).toHaveAttribute("aria-selected", "false");
    await utcTab.click();
    await expect(utcTab).toHaveAttribute("aria-selected", "true");
    await expect(localTab).toHaveAttribute("aria-selected", "false");

    await expect(page.getByRole("button", { name: "Next Mint" })).toBeVisible();
    const overviewMemeNumberInput = page.getByLabel("Meme #").first();
    const calendarMemeNumberInput = page.getByLabel("Meme #").last();
    await expect(overviewMemeNumberInput).toBeVisible();
    await expect(calendarMemeNumberInput).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Show mint schedule" })
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "Find mint date" })
    ).toBeVisible();

    await overviewMemeNumberInput.fill("551");
    await page.getByRole("button", { name: "Show mint schedule" }).click();
    await expect(
      page.getByRole("link", { name: "Open Meme #551" })
    ).toHaveAttribute("href", "/the-memes/551?locale=de-DE", {
      timeout: 30000,
    });
    await calendarMemeNumberInput.fill("551");
    await page.getByRole("button", { name: "Find mint date" }).click();
    const tooltipArtworkLink = page
      .getByRole("tooltip")
      .getByRole("link", { name: "Open Meme #551" });
    await expect(tooltipArtworkLink).toBeVisible({ timeout: 30000 });
    await tooltipArtworkLink.focus();
    await expect(tooltipArtworkLink).toBeFocused();
    await expect(
      page.getByRole("button", { name: "Screenshot" })
    ).toBeVisible();
    await expect(
      page.getByRole("row", { name: /^SZN \d+ / }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("row", { name: /^Year \d+ / }).first()
    ).toBeVisible();
    await expect(
      page.getByRole("row", { name: /^Epoch \d+ / }).first()
    ).toBeVisible();

    const calendarLink = page
      .getByRole("link", { name: "Add to Calendar" })
      .first();
    const googleCalendarLink = page
      .getByRole("link", { name: "Add to Google Calendar" })
      .first();
    await expect(calendarLink).toHaveAttribute(
      "href",
      /^data:text\/calendar;charset=utf-8,/
    );
    await expect(googleCalendarLink).toHaveAttribute(
      "href",
      /^https:\/\/calendar\.google\.com\/calendar\/render/
    );
    await expectNoHorizontalOverflow(page);
  });

  test("keeps ReMeme fields intact and makes Meme references searchable", async ({
    page,
  }, testInfo) => {
    if (testInfo.project.name === "web-desktop-chromium") {
      await page.setViewportSize({ width: 1536, height: 1000 });
    }
    await page.route("**/api/memes_lite", async (route) => {
      const headers = { ...route.request().headers() };
      delete headers["if-modified-since"];
      delete headers["if-none-match"];
      await route.continue({ headers });
    });
    await gotoReady(page, "/rememes/add", {
      readySelector: "#rememe-reference-search",
    });

    await expect(page.getByLabel("Contract", { exact: true })).toBeVisible();
    await expect(page.getByLabel("Token IDs", { exact: true })).toHaveAttribute(
      "placeholder",
      "1,2,3 or 1-3 or 1,2-5 or 1-3,5"
    );
    await expect(page.getByRole("button", { name: "Validate" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Add Rememe" })).toHaveCount(
      0
    );

    // A @tailwindcss/forms control drawing its own ring on keyboard focus.
    await expectKeyboardFocusIndicator(
      page,
      page.getByLabel("Contract", { exact: true }),
      { maxTabs: 150 }
    );

    if (testInfo.project.name === "web-desktop-chromium") {
      const [logoBox, contractBox] = await Promise.all([
        page.getByAltText("re-memes").boundingBox(),
        page.getByLabel("Contract", { exact: true }).boundingBox(),
      ]);
      if (!logoBox || !contractBox) {
        throw new Error(
          "Expected the ReMeme logo and contract input to render"
        );
      }
      expect(Math.abs(contractBox.x - logoBox.x)).toBeLessThanOrEqual(1);
    }

    const referenceSearch = page.getByRole("combobox", {
      name: "Meme References",
    });
    await expect(referenceSearch).toBeEnabled({ timeout: 30000 });
    await referenceSearch.fill("551");
    const memeOption = page.getByRole("option", { name: /^#551 - / });
    await expect(memeOption).toBeVisible();

    if (testInfo.project.name === "web-mobile-chromium") {
      await memeOption.tap();
    } else {
      await referenceSearch.press("ArrowDown");
      // The active Headless UI option keeps focus on the input, so it has to
      // paint its own indicator instead of a background tint alone.
      await expectActiveOptionIndicator(memeOption);
      await referenceSearch.press("Enter");
    }

    const clearReference = page.getByRole("button", {
      name: "Clear reference #551",
    });
    await expect(clearReference).toBeVisible();
    const [searchBox, selectedReferenceBox] = await Promise.all([
      referenceSearch.boundingBox(),
      clearReference.boundingBox(),
    ]);
    if (!searchBox || !selectedReferenceBox) {
      throw new Error("Expected the reference search and selection to render");
    }
    expect(selectedReferenceBox.y).toBeGreaterThan(searchBox.y);
    if (testInfo.project.name === "web-mobile-chromium") {
      await clearReference.tap();
    } else {
      await clearReference.click();
    }
    await expect(clearReference).toHaveCount(0);
    await expectNoHorizontalOverflow(page);
  });
});
