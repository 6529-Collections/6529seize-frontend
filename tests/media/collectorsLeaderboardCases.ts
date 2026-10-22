import type { Locator, Page } from "@playwright/test";
import {
  expect,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

const COLLECTOR = {
  id: 1,
  handle: "collector-with-a-very-long-profile-name",
  consolidation_key: "0x0000000000000000000000000000000000000529",
  consolidation_display: "Collector fixture",
  primary_wallet: "0x0000000000000000000000000000000000000529",
  pfp_url: "",
  level: 100,
  cic_score: 0,
  balance: 111,
  boosted_tdh: 0,
  tdh__raw: 158,
  tdh_rank: 87,
  total_balance: 33806,
  total_boosted_tdh: 181123456,
  total_tdh__raw: 14300000,
};

async function installCollectorsFixture(page: Page) {
  await page.route("**/api/tdh/nft/**", async (route) => {
    const params = new URL(route.request().url()).searchParams;
    const search = params.get("search");
    let count = 79;
    if (search === "no-match") {
      count = 0;
    } else if (search) {
      count = 1;
    }
    const pageNumber = Number(params.get("page") ?? 1);
    const pageSize = Number(params.get("page_size") ?? 25);
    const offset = (pageNumber - 1) * pageSize;
    const length = Math.max(0, Math.min(count - offset, pageSize));
    await route.fulfill({
      json: {
        count,
        page: pageNumber,
        next: null,
        data: Array.from({ length }, (_, index) => ({
          ...COLLECTOR,
          consolidation_key: `${COLLECTOR.consolidation_key}-${offset + index}`,
          balance: index === 1 ? 1 : COLLECTOR.balance,
          tdh__raw: index === 2 ? 99999 : COLLECTOR.tdh__raw,
        })),
      },
    });
  });
}

async function expectMobileCollectorLayout(
  page: Page,
  section: Locator,
  list: Locator,
  width: number
) {
  await page.setViewportSize({ width, height: 844 });
  await expect(list).toBeVisible();
  await expect(section.getByRole("table")).toBeHidden();
  await expectNoHorizontalOverflow(page);
  const overflow = await list
    .getByRole("listitem")
    .evaluateAll((rows) =>
      rows.some((row) => row.scrollWidth > row.clientWidth + 1)
    );
  expect(overflow, `Collector rows overflow at ${width}px`).toBe(false);
  const firstRow = list.getByRole("listitem").first();
  await expect(firstRow.getByText("Total", { exact: true })).toBeVisible();
  for (const label of ["Balance", "TDH", "Unweighted TDH"]) {
    await expect(firstRow.getByText(label, { exact: true })).toBeVisible();
  }
  const statHeights = await list
    .getByRole("listitem")
    .first()
    .locator(":scope > span, :scope > div:last-child > span")
    .evaluateAll((cells) =>
      cells.map((cell) => cell.getBoundingClientRect().height)
    );
  expect(
    statHeights.every((height) => height <= 16),
    `Collector labels and values stay on one line at ${width}px`
  ).toBe(true);
  const statFontSizes = await list
    .getByRole("listitem")
    .first()
    .locator(":scope > span, :scope > div:last-child > span")
    .evaluateAll((cells) =>
      cells.flatMap((cell) =>
        [cell, ...cell.querySelectorAll('span[aria-hidden="true"]')].map(
          (element) => getComputedStyle(element).fontSize
        )
      )
    );
  expect(new Set(statFontSizes)).toEqual(
    new Set([width <= 380 ? "11px" : "12px"])
  );
  const identityBounds = await firstRow
    .getByRole("link", { name: /collector-with-/ })
    .boundingBox();
  for (const scope of ["This card", "Total"]) {
    const scopeBounds = await firstRow
      .getByText(scope, { exact: true })
      .boundingBox();
    if (!identityBounds || !scopeBounds) {
      throw new Error("Collector identity and scope must have visible bounds");
    }
    // The avatar starts at the profile link's left edge.
    expect(Math.abs(identityBounds.x - scopeBounds.x)).toBeLessThan(1);
  }
  const [scope, balance, tdh, unweighted] = await Promise.all(
    ["This card", "Balance", "TDH", "Unweighted TDH"].map((label) =>
      firstRow.getByText(label, { exact: true }).boundingBox()
    )
  );
  const rowBounds = await firstRow.boundingBox();
  if (!scope || !balance || !tdh || !unweighted || !rowBounds) {
    throw new Error("Collector stat groups must have visible bounds");
  }
  const gaps = [
    balance.x - scope.x - scope.width,
    tdh.x - balance.x - balance.width,
    unweighted.x - tdh.x - tdh.width,
  ];
  expect(Math.min(...gaps)).toBeGreaterThanOrEqual(19);
  expect(Math.max(...gaps) - Math.min(...gaps)).toBeLessThan(1);
  expect(
    Math.abs(unweighted.x + unweighted.width - rowBounds.x - rowBounds.width)
  ).toBeLessThan(1);
  const csvSize = await section
    .getByRole("button", { name: "Download collectors leaderboard as CSV" })
    .boundingBox();
  expect(csvSize?.width).toBe(36);
  expect(csvSize?.height).toBe(36);
  if (width === 320) {
    await list.focus();
    await list.press("ArrowRight");
    await expect
      .poll(() => list.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
    await list.press("Tab");
    await expect(
      firstRow.getByRole("link", { name: /collector-with-/ })
    ).toBeFocused();
    await list.evaluate((element) => {
      element.scrollLeft = 0;
    });
  }
}

export function defineCollectorsLeaderboardTests() {
  test("Collectors retains every metric and control across responsive layouts", async ({
    page,
  }) => {
    await installCollectorsFixture(page);
    await page.goto("/the-memes/1?focus=collectors");
    await waitForRouteReady(page);
    const section = page
      .getByRole("heading", { name: "Collectors leaderboard" })
      .locator("..")
      .locator("..");
    const list = page.getByRole("list", { name: "Collectors leaderboard" });
    const csvButton = section.getByRole("button", {
      name: "Download collectors leaderboard as CSV",
    });
    const csvTooltip = page
      .getByRole("tooltip")
      .filter({ hasText: "Download CSV" });
    const initialWidth = page.viewportSize()?.width ?? 1280;

    if (initialWidth >= 768) {
      await csvButton.focus();
      await expect(csvTooltip).toBeHidden();
      await expect(list).toBeHidden();
      await expect(section.getByRole("table").getByRole("row")).toHaveCount(27);
      await expect(
        section.getByRole("columnheader", { name: "Collector x79" })
      ).toBeVisible();
      await expect(
        section.getByRole("button", {
          name: "Sort Balance ascending",
          exact: true,
        })
      ).toHaveCount(2);
      return;
    }

    await expect(list.getByRole("listitem")).toHaveCount(25);
    await expect(section.getByRole("table")).toBeHidden();
    await expect(list.getByRole("listitem").first()).toContainText(
      "Total TDH: 181,123,456"
    );
    await expect(list.getByRole("listitem").first()).toContainText(
      "This card TDH: 0"
    );
    await expect(list.getByRole("listitem").nth(1)).toContainText(
      "This card balance: 1"
    );

    // Settle the intentional page scroll before testing hover; scrolling closes tooltips.
    await csvButton.scrollIntoViewIfNeeded();
    await expect(csvButton).toBeInViewport({ ratio: 1 });
    await csvButton.hover();
    await expect(csvTooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(csvTooltip).toBeHidden();
    await csvButton.focus();
    await expect(csvTooltip).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(csvTooltip).toBeHidden();
    await expect(csvButton).toBeFocused();
    await csvButton.blur();

    for (const width of [320, 360, 375, 380, 381, 390, 430, 640, 767]) {
      await expectMobileCollectorLayout(page, section, list, width);
    }
    for (const width of [768, 1023, 1024]) {
      await page.setViewportSize({ width, height: 844 });
      await expect(list).toBeHidden();
      await csvButton.focus();
      await expect(csvTooltip).toBeHidden();
      await csvButton.blur();
      await expect(section.getByRole("table")).toBeVisible();
      await expect(section.getByRole("table").getByRole("row")).toHaveCount(27);
      await expect(
        page.getByRole("group", { name: "Sort collectors by" })
      ).toBeHidden();
      await expectNoHorizontalOverflow(page);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const sortGroup = page.getByRole("group", { name: "Sort collectors by" });
    const farSort = sortGroup.getByRole("button", {
      name: "Total unweighted TDH",
      exact: true,
    });
    await sortGroup
      .getByRole("button", { name: "Balance", exact: true })
      .focus();
    for (const name of [
      "TDH",
      "Unweighted TDH",
      "Total balance",
      "Total TDH",
      "Total unweighted TDH",
    ]) {
      await page.keyboard.press("Tab");
      const chip = sortGroup.getByRole("button", { name, exact: true });
      await expect(chip).toBeFocused();
      await expect(chip).toBeInViewport({ ratio: 1 });
      await expect(sortGroup).toHaveCSS("mask-image", "none");
    }
    await farSort.click();
    await expect(farSort).toHaveAttribute("aria-pressed", "true");
    await expect(farSort).toBeInViewport({ ratio: 1 });
    await expect(
      page.getByRole("button", { name: "Sort descending", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: "Sort ascending", exact: true })
      .press("Enter");
    await expect(
      page.getByRole("button", { name: "Sort ascending", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(farSort).toBeInViewport({ ratio: 1 });

    await page.getByRole("button", { name: "Next page", exact: true }).click();
    await expect(
      page.getByRole("textbox", { name: "Page number", exact: true })
    ).toHaveValue("2");
    await expect(list.getByRole("listitem").first()).toContainText(/Rank\s*26/);
    await expect(section.getByRole("heading")).toBeInViewport();

    await section
      .getByRole("button", { name: "Filter by identity", exact: true })
      .click();
    await page
      .getByRole("textbox", { name: "Handle, ENS name, or wallet address" })
      .fill("collector-fixture");
    await page.getByRole("button", { name: "Add identity filter" }).click();
    await page.getByRole("button", { name: "Done", exact: true }).click();
    await expect(list.getByRole("listitem")).toHaveCount(1);
    await expect(list.getByRole("listitem")).toContainText(/Rank\s*87/);
    await expect(
      page.getByRole("button", { name: "Next page", exact: true })
    ).toBeHidden();
    await expect(section.getByText("1 collector", { exact: true })).toHaveCount(
      0
    );

    const download = page.waitForEvent("download");
    await section
      .getByRole("button", { name: "Download collectors leaderboard as CSV" })
      .click();
    expect((await download).suggestedFilename()).toBe(
      "the-memes-1-collectors.csv"
    );
    await expect(section.getByRole("status")).toHaveText(
      "Collectors CSV download ready."
    );
    await page
      .getByRole("button", { name: "Clear all search wallets" })
      .click();
    await expect(list.getByRole("listitem")).toHaveCount(25);
  });
}
