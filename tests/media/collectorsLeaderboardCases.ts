import type { Page } from "@playwright/test";
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
    const count = search === "no-match" ? 0 : search ? 1 : 79;
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
        })),
      },
    });
  });
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
    const initialWidth = page.viewportSize()?.width ?? 1280;

    if (initialWidth >= 1024) {
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
    await expect(list.getByRole("listitem").nth(1)).toContainText("1 card");

    for (const width of [320, 360, 390, 430, 640, 1023]) {
      await page.setViewportSize({ width, height: 844 });
      await expectNoHorizontalOverflow(page);
      const overflow = await list
        .getByRole("listitem")
        .evaluateAll((rows) =>
          rows.some((row) => row.scrollWidth > row.clientWidth + 1)
        );
      expect(overflow, `Collector rows overflow at ${width}px`).toBe(false);
      const csvSize = await section
        .getByRole("button", { name: "Download collectors leaderboard as CSV" })
        .boundingBox();
      expect(csvSize?.width).toBe(36);
      expect(csvSize?.height).toBe(36);
    }
    await page.setViewportSize({ width: 390, height: 844 });
    const sortGroup = page.getByRole("group", { name: "Sort collectors by" });
    const farSort = sortGroup.getByRole("button", {
      name: "Total unweighted TDH",
      exact: true,
    });
    await farSort.click();
    await expect(farSort).toHaveAttribute("aria-pressed", "true");
    await expect(
      page.getByRole("button", { name: "Sort descending", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await page
      .getByRole("button", { name: "Sort ascending", exact: true })
      .press("Enter");
    await expect(
      page.getByRole("button", { name: "Sort ascending", exact: true })
    ).toHaveAttribute("aria-pressed", "true");
    await expect(farSort).toBeInViewport();

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
    await expect(
      section.getByText("1 collector", { exact: true })
    ).toBeVisible();

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
