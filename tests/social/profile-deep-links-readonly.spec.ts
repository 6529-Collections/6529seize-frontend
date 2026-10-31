import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
} from "../testHelpers";
import {
  expectProfileShell,
  gotoReady,
  PROFILE_HANDLE,
} from "./profileReadonlyHelpers";

import { RESPONSE_TIMEOUT_MS } from "../support/routeReadiness";
import { expectUrlState } from "../support/urlState";
import { isCapacitorSimulationProject } from "../support/surfaceSimulation";

test.describe("Profile deep-link read-only coverage @surface @medium @large @readonly", () => {
  test("toggles Details without a route fetch while its own data is loading", async ({
    page,
  }) => {
    await gotoReady(
      page,
      `/${PROFILE_HANDLE}/collected?collection=memes&details=closed`
    );
    // Filters mount after the profile has hydrated and its initial cards load.
    await expect(
      page.getByRole("main").locator('[data-profile-section="Filters"]')
    ).toBeVisible({
      timeout: RESPONSE_TIMEOUT_MS,
    });
    let releaseDetails!: () => void;
    const pendingDetails = new Promise<void>((resolve) => {
      releaseDetails = resolve;
    });
    await page.route(
      /\/(?:new_memes_seasons|tdh\/consolidation\/|owners-balances\/consolidation\/)/,
      async (route) => {
        await pendingDetails;
        await route.continue();
      }
    );
    const routeFetches: string[] = [];
    page.on("request", (request) => {
      const url = new URL(request.url());
      const headers = request.headers();
      // Visible profile tabs can prefetch this route independently of Details.
      // Count navigation fetches so the toggle must still avoid a server round trip.
      if (
        url.pathname === `/${PROFILE_HANDLE}/collected` &&
        headers["rsc"] === "1" &&
        !headers["next-router-prefetch"]
      ) {
        routeFetches.push(url.pathname + url.search);
      }
    });
    try {
      await page.getByRole("button", { name: "Details", exact: true }).click();
      await expect(
        page.getByRole("button", { name: "Hide Details", exact: true })
      ).toHaveAttribute("aria-expanded", "true");
      await expect(
        page
          .getByRole("status")
          .filter({ hasText: "Loading collection details" })
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Hide Details", exact: true })
        .click();
      await expect(
        page.getByRole("button", { name: "Details", exact: true })
      ).toHaveAttribute("aria-expanded", "false");
      await expect(
        page.getByText("Loading collection details…", { exact: true })
      ).toHaveCount(0);
      // One event-loop turn catches stale render state during fast repeated activation.
      await page
        .getByRole("button", { name: "Details", exact: true })
        .evaluate((button) => {
          for (let i = 0; i < 3; i++) (button as HTMLButtonElement).click();
        });
      await expect(
        page.getByRole("button", { name: "Hide Details", exact: true })
      ).toHaveAttribute("aria-expanded", "true");
      await expectUrlState(
        page,
        (url) =>
          url.searchParams.get("details") === "open" &&
          url.searchParams.get("collection") === "memes"
      );
      expect(routeFetches).toEqual([]);
    } finally {
      releaseDetails();
    }
    const clippedHeight = await page
      .getByRole("main")
      .locator('[data-profile-section="Collection details"]')
      .evaluate(async (panel) => {
        while (!panel.querySelector("#collected-details-heading")) {
          await new Promise<void>((resolve) =>
            requestAnimationFrame(() => resolve())
          );
        }
        // Loaded content must fit immediately, without restarting an outer
        // height animation each time another section receives its data.
        await new Promise<void>((resolve) =>
          requestAnimationFrame(() => resolve())
        );
        let clipped = 0;
        for (
          let ancestor = panel.parentElement;
          ancestor;
          ancestor = ancestor.parentElement
        ) {
          if (getComputedStyle(ancestor).overflowY === "hidden") {
            clipped = Math.max(
              clipped,
              panel.getBoundingClientRect().bottom -
                ancestor.getBoundingClientRect().bottom
            );
          }
        }
        return clipped;
      });
    expect(clippedHeight).toBeLessThanOrEqual(1);
    await expect(
      page.getByRole("region", { name: "Collected", exact: true })
    ).toBeVisible();
  });

  test("browser Back from Collect actions keeps the Collected filters", async ({
    page,
  }, testInfo) => {
    test.skip(
      isCapacitorSimulationProject(testInfo.project.name),
      "Web history contract; native app Back is covered in native-shell-readonly"
    );
    for (const action of ["Manage orders", "Complete my set"]) {
      await gotoReady(
        page,
        `/${PROFILE_HANDLE}/collected?collection=memes&szn=1&details=closed`
      );
      await expect(
        page.getByRole("main").locator('[data-profile-section="Filters"]')
      ).toBeVisible({
        timeout: RESPONSE_TIMEOUT_MS,
      });
      const source = new URL(page.url());
      const link = page.getByRole("link", { name: action, exact: true });
      // Record the position after Playwright's click preparation scrolls the
      // target clear of the mobile browser's viewport edge.
      await link.click({ trial: true });
      const sourceTop = await link.evaluate(
        (element) => element.getBoundingClientRect().top
      );
      const destination = new URL(
        (await link.getAttribute("href"))!,
        page.url()
      );
      expect(destination.searchParams.has("returnTo")).toBe(false);
      await link.click();
      await expect(page).toHaveURL(
        (url) =>
          url.pathname ===
          (action === "Manage orders" ? "/collect/orders" : "/collect")
      );
      await expect(
        page.getByRole("button", { name: "Back", exact: true })
      ).toHaveCount(0);
      await page.goBack();
      await expect(page).toHaveURL((url) => url.pathname === source.pathname);
      await expectUrlState(page, (url) =>
        ["collection", "szn", "details"].every(
          (key) => url.searchParams.get(key) === source.searchParams.get(key)
        )
      );
      await expect
        .poll(() =>
          link.evaluate(
            (element, top) =>
              Math.abs(element.getBoundingClientRect().top - top),
            sourceTop
          )
        )
        .toBeLessThanOrEqual(2);
    }
  });

  test("keeps Collected statistics, tabs and tables readable on compact screens", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, `/${PROFILE_HANDLE}/collected`);
    await expectProfileShell(page, "Collected");

    const details = page.getByRole("button", { name: "Details", exact: true });
    const metrics = page
      .getByRole("button", { name: "Details", exact: true })
      .locator("..")
      .locator("[class~='tw-overflow-x-auto']");
    const fade = page
      .getByRole("button", { name: "Details", exact: true })
      .locator("..")
      .locator("[class~='tw-overflow-x-auto']")
      .locator("..")
      .locator(":scope > div[aria-hidden='true']");

    await expect(details).toBeVisible();
    // The shell precedes the API-backed statistics, so those controls get the
    // bounded data-readiness budget. The layout checks below stay strict.
    await expect(metrics.getByRole("button").first()).toBeVisible({
      timeout: RESPONSE_TIMEOUT_MS,
    });
    await expect(fade).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    for (const width of [430, 520, 640, 767, 390]) {
      await page.setViewportSize({ width, height: 844 });
      await expect
        .poll(async () => {
          const hasMore = await metrics.evaluate(
            (node) => node.scrollLeft + node.clientWidth < node.scrollWidth - 1
          );
          return (await fade.isVisible()) === hasMore;
        })
        .toBe(true);
    }
    const detailsBefore = await details.boundingBox();
    const metricsBox = await metrics.boundingBox();
    expect(detailsBefore).not.toBeNull();
    expect(metricsBox).not.toBeNull();
    if (!detailsBefore || !metricsBox) {
      throw new Error(
        "Expected the Collected statistics header to be rendered"
      );
    }
    expect(detailsBefore.height).toBeLessThanOrEqual(40);
    expect(
      Math.abs(
        detailsBefore.y +
          detailsBefore.height / 2 -
          (metricsBox.y + metricsBox.height / 2)
      )
    ).toBeLessThanOrEqual(1);
    expect(
      detailsBefore.x - (metricsBox.x + metricsBox.width)
    ).toBeGreaterThanOrEqual(16);

    const lastMetricShortcut = metrics.getByRole("button").last();
    await lastMetricShortcut.focus();
    for (let press = 0; press < 10; press += 1) {
      await lastMetricShortcut.press("ArrowRight");
    }
    await expect
      .poll(() =>
        metrics.evaluate(
          (node) => node.scrollLeft + node.clientWidth >= node.scrollWidth - 1
        )
      )
      .toBe(true);
    await expect(lastMetricShortcut).toBeFocused();
    await expect(fade).toHaveCount(0);

    await metrics.hover();
    await page.mouse.wheel(1000, 0);
    await expect
      .poll(() =>
        metrics.evaluate(
          (node) => node.scrollLeft + node.clientWidth >= node.scrollWidth - 1
        )
      )
      .toBe(true);
    await expect(fade).toHaveCount(0);
    expect(await details.boundingBox()).toEqual(detailsBefore);
    const boostMetric = metrics
      .getByText("Boost", { exact: true })
      .locator("..");
    await expect(boostMetric).toBeVisible();
    const boostMetricBounds = await boostMetric.boundingBox();
    expect(boostMetricBounds).not.toBeNull();
    if (!boostMetricBounds) {
      throw new Error("Expected the Boost statistic at the end of the row");
    }
    expect(
      detailsBefore.x - (boostMetricBounds.x + boostMetricBounds.width)
    ).toBeGreaterThanOrEqual(16);
    await expect(page.getByText("Seasons", { exact: true })).toBeVisible();
    await expect(page.getByRole("button", { name: /^SZN1 / })).toBeVisible();

    await details.click();
    await expectUrlState(
      page,
      (url) => url.searchParams.get("details") === "open"
    );
    await expect(
      page.getByRole("button", { name: "Hide Details", exact: true })
    ).toHaveAttribute("aria-expanded", "true");

    for (const title of ["Collected", "Activity Overview"]) {
      const disclosures = page
        .getByRole("region", { name: title, exact: true })
        .locator("details");
      await expect(disclosures).toHaveCount(2);
      for (const disclosure of await disclosures.all()) {
        await expect(disclosure).not.toHaveAttribute("open");
        const summary = disclosure
          .getByText(/^(Overview|Memes Breakdown By Season)$/, { exact: true })
          .locator("..");
        await expect(summary).toHaveCSS("font-size", "14px");
        await summary.press("Enter");
        await expect(disclosure).toHaveAttribute("open", "");
        const table = disclosure.getByRole("table");
        const emptySeasonActivity = disclosure.getByText(
          title === "Collected"
            ? "No Meme holdings by season yet."
            : "No Meme activity by season yet.",
          { exact: true }
        );
        await expect(table.or(emptySeasonActivity)).toBeVisible();
        if (await table.isVisible()) {
          await expect(table.getByRole("columnheader").first()).toHaveCSS(
            "font-size",
            "11px"
          );
        }
        await summary.press("Space");
        await expect(disclosure).not.toHaveAttribute("open");
      }
    }

    const boost = page.getByRole("table", {
      name: "TDH boost breakdown by source",
      exact: true,
    });
    await expect(boost).toBeVisible();
    for (const width of [360, 390, 430, 520, 639, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      const actions = await page
        .getByRole("link", { name: "Manage orders", exact: true })
        .evaluate((orders) => {
          const row = orders.parentElement!;
          const rowBounds = row.getBoundingClientRect();
          const complete = row.querySelector("a")!.getBoundingClientRect();
          const manage = orders.getBoundingClientRect();
          const style = getComputedStyle(row);
          const left = rowBounds.left + Number.parseFloat(style.paddingLeft);
          const right = rowBounds.right - Number.parseFloat(style.paddingRight);
          return {
            fits:
              right - left >=
              complete.width +
                manage.width +
                Number.parseFloat(style.columnGap),
            centers: Math.abs(
              complete.y + complete.height / 2 - manage.y - manage.height / 2
            ),
            leftInset: Math.abs(complete.left - left),
            rightInset: Math.abs(manage.right - right),
            stackedLeftInset: Math.abs(manage.left - left),
            stackedGap: manage.top - complete.bottom,
          };
        });
      expect(actions.leftInset).toBeLessThanOrEqual(1);
      if (actions.fits) {
        expect(actions.centers).toBeLessThanOrEqual(1);
        expect(actions.rightInset).toBeLessThanOrEqual(1);
      } else {
        expect(actions.stackedLeftInset).toBeLessThanOrEqual(1);
        expect(actions.stackedGap).toBeGreaterThanOrEqual(8);
      }
      await expect(
        page.getByRole("region", {
          name: "TDH boost breakdown by source",
          exact: true,
        })
      ).toHaveCSS("overflow-x", "auto");
      const dimensions = await boost.evaluate((table) => ({
        tableWidth: table.getBoundingClientRect().width,
        availableWidth: table.parentElement!.clientWidth,
      }));
      expect(dimensions.tableWidth).toBeGreaterThanOrEqual(
        dimensions.availableWidth - 1
      );
      for (const header of await boost.getByRole("columnheader").all()) {
        await expect(header).toHaveCSS("font-size", "11px");
      }
      const boostCells = boost
        .getByRole("columnheader")
        .or(boost.getByRole("rowheader"))
        .or(boost.getByRole("cell"));
      for (const cell of await boostCells.all()) {
        await expect(cell).toHaveCSS("white-space", "nowrap");
      }
      const tablist = page.getByRole("tablist", {
        name: "Activity details sections",
      });
      const tabs = tablist.getByRole("tab");
      await expect(tablist).toHaveCSS("border-radius", "8px");
      for (const tab of await tabs.all()) {
        await expect(tab).toHaveCSS("white-space", "nowrap");
        await expect(tab).toHaveCSS("border-radius", "8px");
        if (width < 640) {
          await expect(tab).toHaveCSS("flex-grow", "1");
          await expect(tab).toHaveCSS("padding-left", "12px");
          await expect(tab).toHaveCSS("padding-right", "12px");
          await expect(tab).toHaveCSS("font-size", "12px");
        } else {
          await expect(tab).toHaveCSS("font-size", "14px");
        }
      }
      if (width < 640) {
        const sizing = await tablist.evaluate((node) => ({
          fits: node.scrollWidth <= node.clientWidth,
          widths: Array.from(node.querySelectorAll("button")).map(
            (tab) => tab.getBoundingClientRect().width
          ),
        }));
        if (sizing.fits) {
          expect(
            Math.max(...sizing.widths) - Math.min(...sizing.widths)
          ).toBeLessThanOrEqual(1);
          const filledWidth = sizing.widths.reduce(
            (sum, value) => sum + value,
            0
          );
          const availableWidth = await tablist.evaluate((node) => {
            const style = getComputedStyle(node);
            return (
              node.clientWidth -
              Number.parseFloat(style.paddingLeft) -
              Number.parseFloat(style.paddingRight)
            );
          });
          expect(Math.abs(filledWidth - availableWidth)).toBeLessThanOrEqual(1);
        }
      }
      const heights = await tabs.evaluateAll((nodes) =>
        nodes.map((node) => node.getBoundingClientRect().height)
      );
      expect(new Set(heights).size).toBe(1);
      for (const button of await boost.getByRole("button").all()) {
        const bounds = await button.boundingBox();
        expect(bounds?.width).toBeGreaterThanOrEqual(24);
        expect(bounds?.height).toBeGreaterThanOrEqual(24);
      }
    }

    await page.setViewportSize({ width: 320, height: 844 });
    const boostScroll = page.getByRole("region", {
      name: "TDH boost breakdown by source",
      exact: true,
    });
    await boostScroll.press("ArrowRight");
    await expect
      .poll(() =>
        boostScroll.evaluate((node) => ({
          canScroll: node.scrollWidth > node.clientWidth,
          focused: document.activeElement === node,
          moved: node.scrollLeft > 0,
        }))
      )
      .toEqual({ canScroll: true, focused: true, moved: true });

    const activityTabs = page.getByRole("tablist", {
      name: "Activity details sections",
    });
    const walletActivity = activityTabs.getByRole("tab", {
      name: "Wallet Activity",
      exact: true,
    });
    const history = activityTabs.getByRole("tab", { name: "TDH History" });
    // Tab selection is URL state: it commits after a client navigation, which
    // slower runners can take longer than the default assertion timeout.
    await walletActivity.press("End");
    await expect(history).toHaveAttribute("aria-selected", "true", {
      timeout: RESPONSE_TIMEOUT_MS,
    });
    await expect(history).toBeFocused();
    await expect
      .poll(() =>
        history.evaluate((node) => {
          const tab = node.getBoundingClientRect();
          const list = node
            .closest('[role="tablist"]')!
            .getBoundingClientRect();
          return tab.left >= list.left && tab.right <= list.right;
        })
      )
      .toBe(true);
    await history.press("Home");
    await expect(walletActivity).toHaveAttribute("aria-selected", "true", {
      timeout: RESPONSE_TIMEOUT_MS,
    });
    await expect(walletActivity).toBeFocused();

    await page.setViewportSize({ width: 1280, height: 900 });
    for (const title of ["Collected", "Activity Overview"]) {
      const disclosures = page
        .getByRole("region", { name: title, exact: true })
        .locator("details");
      for (const disclosure of await disclosures.all()) {
        await expect(disclosure).toHaveAttribute("open", "");
        await expect(
          disclosure
            .getByRole("table")
            .or(
              disclosure.getByText(
                title === "Collected"
                  ? "No Meme holdings by season yet."
                  : "No Meme activity by season yet.",
                { exact: true }
              )
            )
        ).toBeVisible();
      }
    }
    await expect(boost.getByRole("columnheader").first()).toHaveCSS(
      "font-size",
      "11px"
    );
  });

  test("keeps Network card metrics readable and page counts below artwork", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, `/${PROFILE_HANDLE}/collected?collection=network`);
    const networkCards = page.getByRole("list", {
      name: "Collected network cards",
    });
    const networkCount = page.getByText(/^Page 1 of \d+$/, { exact: true });
    await expect(networkCards).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(networkCount).toBeVisible();

    for (const width of [320, 390, 768, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      for (const card of await networkCards.getByRole("listitem").all()) {
        const metrics = card.getByText(/^xTDH(?:\/day)?$/, { exact: true });
        await expect(metrics).toHaveCount(2);
        const metricLayout = await metrics.evaluateAll((labels) => {
          const cardBounds = labels[0]!.closest("li")!.getBoundingClientRect();
          const bounds = labels.map((label) =>
            label.parentElement!.getBoundingClientRect()
          );
          const [total, rate] = bounds;
          return {
            overlap:
              Math.min(total!.right, rate!.right) >
                Math.max(total!.left, rate!.left) + 1 &&
              Math.min(total!.bottom, rate!.bottom) >
                Math.max(total!.top, rate!.top) + 1,
            textFits: labels.every((label) =>
              Array.from(label.parentElement!.children).every((part) => {
                const rect = part.getBoundingClientRect();
                return (
                  rect.left >= cardBounds.left && rect.right <= cardBounds.right
                );
              })
            ),
          };
        });
        expect(metricLayout.overlap).toBe(false);
        expect(metricLayout.textFits).toBe(true);
      }
      await expect(networkCount).toHaveCSS("white-space", "nowrap");
      const layout = await networkCount.evaluate((node) => {
        const count = node.getBoundingClientRect();
        const grid = document
          .querySelector('ul[aria-label="Collected network cards"]')!
          .getBoundingClientRect();
        const range = document.createRange();
        range.selectNodeContents(node);
        return {
          countTop: count.top,
          gridBottom: grid.bottom,
          alignedLeft: Math.abs(count.left - grid.left),
          lines: new Set(
            Array.from(range.getClientRects()).map((rect) => rect.y)
          ).size,
        };
      });
      expect(layout.countTop).toBeGreaterThanOrEqual(layout.gridBottom);
      expect(layout.alignedLeft).toBeLessThanOrEqual(1);
      expect(layout.lines).toBe(1);
      await expectNoHorizontalOverflow(page);
    }
  });

  test("recovers empty Collected filters and restores them with browser Back", async ({
    page,
  }) => {
    await gotoReady(
      page,
      "/simo/collected?collection=gradients&seized=seized&sort-direction=asc&details=closed&locale=fr-FR"
    );
    const clear = page.getByRole("button", {
      name: "Clear filters",
      exact: true,
    });
    await expect(
      page
        .getByRole("status")
        .filter({ hasText: "No artwork matches these filters." })
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    for (const width of [375, 440, 1280]) {
      await page.setViewportSize({ width, height: 900 });
      await clear.scrollIntoViewIfNeeded();
      const box = await clear.boundingBox();
      expect(box?.height).toBeGreaterThanOrEqual(44);
      await expectNoHorizontalOverflow(page);
    }
    await clear.click();
    await expectUrlState(
      page,
      (url) =>
        !url.searchParams.has("collection") &&
        !url.searchParams.has("seized") &&
        url.searchParams.get("sort-direction") === "asc" &&
        url.searchParams.get("details") === "closed" &&
        url.searchParams.get("locale") === "fr-FR"
    );
    const cards = page.getByRole("list", {
      name: "Collected cards",
      exact: true,
    });
    await expect(cards.getByRole("link").first()).toBeFocused();
    await expect(cards.getByRole("link").first()).toBeInViewport();
    await page.goBack();
    await expect(clear).toBeVisible();
    await expectUrlState(
      page,
      (url) => url.searchParams.get("collection") === "gradients"
    );
  });

  test("keeps Native Collected page counts and pagination readable", async ({
    page,
  }) => {
    // The initial load and both page changes each get the full data budget
    // (RESPONSE_TIMEOUT_MS), which together can exceed the default test timeout.
    test.setTimeout(120000);
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(
      page,
      `/${PROFILE_HANDLE}/collected?collection=memes&page=2`
    );
    const nativeCount = page.getByText(/^Page 2 of \d+$/, { exact: true });
    await expect(nativeCount).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    const cards = page.getByRole("list", {
      name: "Collected cards",
      exact: true,
    });
    const firstCard = cards.getByRole("link").first();
    // The count only renders with the page's cards, so the first card exists.
    const pageTwoFirstArtwork = new URL(
      (await firstCard.getAttribute("href")) ?? "",
      page.url()
    ).pathname;
    // Match the path literally: artwork paths may contain regex metacharacters.
    const pageTwoFirstArtworkPattern = pageTwoFirstArtwork.replaceAll(
      /[.*+?^${}()|[\]\\]/g,
      String.raw`\$&`
    );
    const previous = page.getByRole("button", {
      name: "Previous",
      exact: true,
    });
    const next = page.getByRole("button", { name: "Next", exact: true });
    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(nativeCount).toHaveCSS("white-space", "nowrap");
      const count = await nativeCount.boundingBox();
      expect(count).not.toBeNull();
      for (const control of [previous, next]) {
        const button = await control.boundingBox();
        expect(button).not.toBeNull();
        if (!count || !button)
          throw new Error("Expected readable pagination controls");
        expect(
          button.y >= count.y + count.height ||
            button.x >= count.x + count.width
        ).toBe(true);
      }
      await expectNoHorizontalOverflow(page);
    }
    await next.click();
    await expectUrlState(
      page,
      (url) =>
        url.searchParams.get("page") === "3" &&
        url.searchParams.get("collection") === "memes"
    );
    await expect(
      page.getByText(/^Page 3 of \d+$/, { exact: true })
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    // The page count follows the URL, so the cards can still be the previous
    // page's. Focus moves only after the requested page's cards render, so
    // wait for those with the data budget, then assert focus strictly with the
    // default timeout: late focus after the cards exist is a regression.
    await expect(firstCard).toHaveAttribute(
      "href",
      new RegExp(`^(?!${pageTwoFirstArtworkPattern}(?:[?#]|$)).+`),
      { timeout: RESPONSE_TIMEOUT_MS }
    );
    await expect(firstCard).toBeFocused();
    await expect(firstCard).toBeInViewport();
    await previous.click();
    await expect(nativeCount).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await expect(firstCard).toHaveAttribute(
      "href",
      new RegExp(`^${pageTwoFirstArtworkPattern}(?:[?#]|$)`),
      { timeout: RESPONSE_TIMEOUT_MS }
    );
    await expect(firstCard).toBeFocused();
    await expect(firstCard).toBeInViewport();
    await expectUrlState(
      page,
      (url) =>
        url.searchParams.get("page") === "2" &&
        url.searchParams.get("collection") === "memes"
    );
  });

  test("keeps Details closed when returning from a collected artwork", async ({
    page,
    isMobile,
  }) => {
    await gotoReady(
      page,
      `/${PROFILE_HANDLE}/collected?collection=memes&page=2&activity=distributions`
    );
    await expect(
      page.getByRole("list", { name: "Collected cards", exact: true })
    ).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
    await page
      .getByRole("button", { name: "Hide Details", exact: true })
      .click();
    await expectUrlState(
      page,
      (url) => url.searchParams.get("details") === "closed"
    );
    const card = page
      .getByRole("list", { name: "Collected cards", exact: true })
      .getByRole("link")
      .nth(6);
    const href = await card.getAttribute("href");
    expect(href).not.toBeNull();
    await card.click();
    await expectUrlState(page, (url) => url.pathname.startsWith("/the-memes/"));
    if (isMobile) {
      await page
        .getByRole("link", { name: `Back to ${PROFILE_HANDLE}'s collected` })
        .click();
      await expect(card).toBeFocused();
    } else {
      await page.goBack();
    }
    await expect(
      page.getByRole("button", { name: "Details", exact: true })
    ).toHaveAttribute("aria-expanded", "false");
    await expectUrlState(
      page,
      (url) =>
        url.searchParams.get("page") === "2" &&
        url.searchParams.get("activity") === "distributions"
    );
    await expect(card).toHaveAttribute("href", href!);
    await expect(card).toBeInViewport();
  });

  for (const shiftsAfterReturn of [false, true]) {
    test(
      shiftsAfterReturn
        ? "keeps the returned distribution row visible after Details expands late"
        : "returns from a Details artwork to its distribution page and row",
      async ({ page, isMobile }) => {
        await gotoReady(
          page,
          `/${PROFILE_HANDLE}/collected?collection=memes&page=2&activity=distributions&distribution-page=2`
        );
        const panel = page.getByRole("tabpanel", {
          name: "Distributions",
          exact: true,
        });
        const artwork = panel
          .getByRole("link", { name: /View The Memes token/ })
          .nth(4);
        await expect(artwork).toBeVisible({ timeout: RESPONSE_TIMEOUT_MS });
        const href = await artwork.getAttribute("href");
        expect(href).toContain("returnTo=");
        const returnTo = new URL(href!, page.url()).searchParams.get(
          "returnTo"
        );
        expect(returnTo).not.toBeNull();
        const returnUrl = new URL(returnTo!, page.url());
        await artwork.click();
        await expectUrlState(page, (url) =>
          url.pathname.startsWith("/the-memes/")
        );
        if (shiftsAfterReturn) {
          // Reproduce a late Details height change after the row has received focus.
          // Neither the test nor this callback scrolls the row into view.
          await page.evaluate((anchor) => {
            const deadline = performance.now() + 10_000;
            const waitForReturn = () => {
              const target = document.getElementById(anchor);
              if (
                location.hash === `#${anchor}` &&
                target === document.activeElement
              ) {
                requestAnimationFrame(() => {
                  const returnedPanel =
                    target?.closest<HTMLElement>('[role="tabpanel"]');
                  if (returnedPanel) {
                    returnedPanel.style.paddingTop = "1200px";
                    returnedPanel.dataset["returnLayoutShift"] = "applied";
                  }
                });
              } else if (performance.now() < deadline) {
                requestAnimationFrame(waitForReturn);
              }
            };
            requestAnimationFrame(waitForReturn);
          }, returnUrl.hash.slice(1));
        }
        if (isMobile) {
          await page
            .getByRole("link", {
              name: `Back to ${PROFILE_HANDLE}'s collected`,
            })
            .click();
          await expect(artwork).toBeFocused();
        } else {
          await page.goBack();
        }
        await expectUrlState(
          page,
          (url) =>
            url.pathname === returnUrl.pathname &&
            url.searchParams.get("page") === "2" &&
            url.searchParams.get("distribution-page") === "2" &&
            url.hash === returnUrl.hash
        );
        await expect(
          page.getByRole("button", { name: "Hide Details", exact: true })
        ).toHaveAttribute("aria-expanded", "true");
        await expect(artwork).toHaveAttribute("href", href!);
        await expect(artwork).toBeFocused();
        if (shiftsAfterReturn) {
          await expect(panel).toHaveAttribute(
            "data-return-layout-shift",
            "applied"
          );
        }
        await expect(artwork).toBeInViewport();
      }
    );
  }

  test("centers the Token ID sort arrows without changing selection behavior", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(
      page,
      `/${PROFILE_HANDLE}/collected?collection=memes&sort-by=token_id`
    );
    const sort = page.getByRole("button", {
      name: "Sort By: Token ID",
      exact: true,
    });
    for (const width of [360, 390, 767, 1023]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(sort).toBeVisible();
      await expect(
        page
          .getByRole("button", { name: "Sort By: Token ID", exact: true })
          .locator("svg")
      ).toHaveCount(2);
      const offsets = await sort.evaluate((button) => {
        const bounds = button.getBoundingClientRect();
        const center = bounds.y + bounds.height / 2;
        return Array.from(button.querySelectorAll("svg")).map((icon) => {
          const iconBounds = icon.getBoundingClientRect();
          return Math.abs(iconBounds.y + iconBounds.height / 2 - center);
        });
      });
      expect(offsets.every((offset) => offset <= 1)).toBe(true);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const filters = page.getByRole("button", {
      name: /^(View|Collection|Sort By|Seized|Season|Address):/,
    });
    await expect(filters).toHaveCount(6);
    if (
      await page.evaluate(
        () => matchMedia("(hover: hover) and (pointer: fine)").matches
      )
    ) {
      const collection = page.getByRole("button", {
        name: "Collection: The Memes",
        exact: true,
      });
      await collection.hover();
      await expect(collection).toHaveCSS("background-color", "rgb(28, 28, 33)");
      for (const filter of await filters.all()) {
        if (
          (await filter.getAttribute("aria-label")) !== "Collection: The Memes"
        ) {
          await expect(filter).toHaveCSS("background-color", "rgb(19, 19, 22)");
        }
      }
    }
    for (const filter of await filters.all()) {
      await expect(filter).toHaveCSS("font-size", "12px");
      await expect(filter).toHaveCSS("white-space", "nowrap");
      const bounds = await filter.boundingBox();
      expect(bounds?.height).toBe(32);
      expect(bounds?.width).toBeGreaterThanOrEqual(40);
    }
    await sort.focus();
    await sort.press("Enter");
    const sortPanel = page.getByRole("dialog", {
      name: "Sort By",
      exact: true,
    });
    const sortOptions = sortPanel.getByRole("menuitem");
    await expect(sortOptions).toHaveCount(3);
    for (const option of await sortOptions.all()) {
      const alignment = await option.evaluate((row) => {
        const label = row.querySelector("span")!.getBoundingClientRect();
        const center = label.y + label.height / 2;
        return {
          cssHeight: Number.parseFloat(getComputedStyle(row).height),
          rowHeight: row.getBoundingClientRect().height,
          offsets: Array.from(row.querySelectorAll("svg")).map((icon) => {
            const bounds = icon.getBoundingClientRect();
            return Math.abs(bounds.y + bounds.height / 2 - center);
          }),
        };
      });
      // Chromium can report a 44px row as 43.99993896484375 after transforms.
      expect(alignment.cssHeight).toBeGreaterThanOrEqual(44);
      expect(alignment.rowHeight).toBeGreaterThanOrEqual(44 - 0.001);
      expect(alignment.offsets.every((offset) => offset <= 1)).toBe(true);
    }
    await sortPanel.press("Escape");
    await expect(sort).toBeFocused();
    await expect(sort).toHaveCSS("outline-color", "rgb(82, 139, 255)");
    await expect(sort).toHaveCSS("outline-width", "2px");
    await expectAxeClean(page, { include: ["main button[aria-haspopup]"] });
    await sort.click();
    await page.getByRole("menuitem", { name: "Token ID", exact: true }).click();
    await expectUrlState(
      page,
      (url) => url.searchParams.get("sort-direction") === "asc"
    );
    await expect(sort).toHaveAttribute("aria-expanded", "false");
    const view = page.getByRole("button", {
      name: "View: Native",
      exact: true,
    });
    await view.press("Enter");
    await page.getByRole("menuitem", { name: "Network", exact: true }).click();
    await expectUrlState(
      page,
      (url) => url.searchParams.get("collection") === "network"
    );
    const networkView = page.getByRole("button", {
      name: "View: Network",
      exact: true,
    });
    await expect(networkView).toHaveAttribute("aria-expanded", "false");
    await expect(
      page.getByRole("button", { name: "Sort By: xTDH", exact: true })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await networkView.press("Enter");
    await page.getByRole("menuitem", { name: "Native", exact: true }).click();
    await expect(view).toHaveAttribute("aria-expanded", "false");
    await expect(
      page.getByRole("button", {
        name: "Collection: All Collections",
        exact: true,
      })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test("keeps the selected activity tab visible on compact deep links", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 360, height: 844 });
    await gotoReady(page, `/${PROFILE_HANDLE}/collected?activity=tdh-history`);
    await expectProfileShell(page, "Collected");
    const tablist = page.getByRole("tablist", {
      name: "Activity details sections",
    });
    const history = tablist.getByRole("tab", { name: "TDH History" });
    await expect(history).toHaveAttribute("aria-selected", "true");
    await expect
      .poll(() =>
        history.evaluate((node) => {
          const tab = node.getBoundingClientRect();
          const list = node
            .closest('[role="tablist"]')!
            .getBoundingClientRect();
          return tab.left >= list.left && tab.right <= list.right;
        })
      )
      .toBe(true);
    await page.setViewportSize({ width: 1280, height: 900 });
    await expect(history).toBeVisible();
    await page.setViewportSize({ width: 360, height: 844 });
    await expect
      .poll(() =>
        history.evaluate((node) => {
          const tab = node.getBoundingClientRect();
          const list = node
            .closest('[role="tablist"]')!
            .getBoundingClientRect();
          return tab.left >= list.left && tab.right <= list.right;
        })
      )
      .toBe(true);
    await expectUrlState(
      page,
      (url) => url.searchParams.get("activity") === "tdh-history"
    );
  });

  test("keeps public profile query links readable without mutation", async ({
    page,
  }) => {
    await gotoReady(page, `/${PROFILE_HANDLE}?source=e2e&view=legacy`);

    await expectUrlState(page, (url) => {
      return (
        url.pathname === `/${PROFILE_HANDLE}` &&
        url.searchParams.get("source") === "e2e" &&
        url.searchParams.get("view") === "legacy"
      );
    });
    await expectProfileShell(page);
  });

  test("redirects legacy waves links to the public curation/profile shell with query state intact", async ({
    page,
  }) => {
    await gotoReady(page, `/${PROFILE_HANDLE}/waves?source=e2e&serialNo=1`);

    await expectUrlState(page, (url) => {
      return (
        [`/${PROFILE_HANDLE}`, `/${PROFILE_HANDLE}/curations`].includes(
          url.pathname
        ) &&
        url.searchParams.get("source") === "e2e" &&
        url.searchParams.get("serialNo") === "1"
      );
    });

    if (new URL(page.url()).pathname.endsWith("/curations")) {
      await expectProfileShell(page, "Curation");
    } else {
      await expectProfileShell(page);
    }
  });

  for (const legacyPath of ["groups", "followers"]) {
    test(`redirects legacy ${legacyPath} links back to the public profile shell`, async ({
      page,
    }) => {
      await gotoReady(page, `/${PROFILE_HANDLE}/${legacyPath}?source=e2e`);

      await expectUrlState(page, (url) => {
        return (
          url.pathname === `/${PROFILE_HANDLE}` &&
          !url.searchParams.has("source")
        );
      });
      await expectProfileShell(page);
    });
  }
});
