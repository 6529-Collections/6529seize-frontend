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

test.describe("Profile deep-link read-only coverage @surface @medium @large @readonly", () => {
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
    await expect(metrics.getByRole("button").first()).toBeVisible();
    await expect(fade).toBeVisible();
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
            "10px"
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
        await expect(header).toHaveCSS("font-size", "10px");
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
    await walletActivity.press("End");
    await expect(history).toHaveAttribute("aria-selected", "true");
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
    await expect(walletActivity).toHaveAttribute("aria-selected", "true");
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
      "10px"
    );
  });

  test("keeps Collected page counts on one line below Network artwork", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(page, `/${PROFILE_HANDLE}/collected?collection=network`);
    const networkCards = page.getByRole("list", {
      name: "Collected network cards",
    });
    const networkCount = page.getByText(/^Page 1 of \d+$/, { exact: true });
    await expect(networkCards).toBeVisible();
    await expect(networkCount).toBeVisible();

    for (const width of [320, 390, 1280]) {
      await page.setViewportSize({ width, height: 844 });
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

  test("keeps Native Collected page counts and pagination readable", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await gotoReady(
      page,
      `/${PROFILE_HANDLE}/collected?collection=memes&page=2`
    );
    const nativeCount = page.getByText(/^Page 2 of \d+$/, { exact: true });
    await expect(nativeCount).toBeVisible();
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
    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get("page") === "3" &&
        url.searchParams.get("collection") === "memes"
    );
    await expect(
      page.getByText(/^Page 3 of \d+$/, { exact: true })
    ).toBeVisible();
    await previous.click();
    await expect(nativeCount).toBeVisible();
    await expect(page).toHaveURL(
      (url) =>
        url.searchParams.get("page") === "2" &&
        url.searchParams.get("collection") === "memes"
    );
  });

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
      expect(bounds?.height).toBeGreaterThanOrEqual(40);
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
          rowHeight: row.getBoundingClientRect().height,
          offsets: Array.from(row.querySelectorAll("svg")).map((icon) => {
            const bounds = icon.getBoundingClientRect();
            return Math.abs(bounds.y + bounds.height / 2 - center);
          }),
        };
      });
      expect(alignment.rowHeight).toBeGreaterThanOrEqual(44);
      expect(alignment.offsets.every((offset) => offset <= 1)).toBe(true);
    }
    await sortPanel.press("Escape");
    await expect(sort).toBeFocused();
    await expect(sort).toHaveCSS("box-shadow", /rgba?\(82[, ]+139[, ]+255/);
    await expectAxeClean(page, { include: ["main button[aria-haspopup]"] });
    await sort.click();
    await page.getByRole("menuitem", { name: "Token ID", exact: true }).click();
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("sort-direction") === "asc"
    );
    await expect(sort).toHaveAttribute("aria-expanded", "false");
    const view = page.getByRole("button", {
      name: "View: Native",
      exact: true,
    });
    await view.press("Enter");
    await page.getByRole("menuitem", { name: "Network", exact: true }).click();
    await expect(page).toHaveURL(
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
    await expect(page).toHaveURL(
      (url) => url.searchParams.get("activity") === "tdh-history"
    );
  });

  test("keeps public profile query links readable without mutation", async ({
    page,
  }) => {
    await gotoReady(page, `/${PROFILE_HANDLE}?source=e2e&view=legacy`);

    await expect(page).toHaveURL((url) => {
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

    await expect(page).toHaveURL((url) => {
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

      await expect(page).toHaveURL((url) => {
        return (
          url.pathname === `/${PROFILE_HANDLE}` &&
          !url.searchParams.has("source")
        );
      });
      await expectProfileShell(page);
    });
  }
});
