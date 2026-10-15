import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";
import { gotoDocumentWithTransientRetry } from "../support/routeReadiness";

// One representative browser check for the World Time Zones tool: the live
// parts render only after hydration (times from the browser's Intl tz data,
// the map from a lazily loaded data chunk), which Jest cannot exercise.
// Offset parsing, formatting, filtering and sorting are covered in Jest.
test.describe("World Time Zones tool @surface @medium @large @readonly", () => {
  test("renders the map and table after hydration and filters zones", async ({
    page,
  }) => {
    await gotoDocumentWithTransientRetry(page, "/tools/time-zones");
    await waitForRouteReady(page);

    await expect(page).toHaveTitle(/World Time Zones/);
    await expect(
      page.getByRole("heading", { level: 1, name: "World Time Zones" })
    ).toBeVisible();

    const map = page.getByRole("listbox", { name: "Time zone map" });
    await expect(map).toBeVisible({ timeout: 30000 });
    // One dot per zone in tzdata zone1970.tab.
    expect(await map.getByRole("option").count()).toBeGreaterThan(300);

    // APG listbox: focus stays on the map and aria-activedescendant follows
    // the selected option as the keys move west to east.
    await map.focus();
    await page.keyboard.press("Home");
    const firstId = await map.getAttribute("aria-activedescendant");
    expect(firstId).toBeTruthy();
    await page.keyboard.press("ArrowRight");
    await expect(map).toBeFocused();
    await expect(map).not.toHaveAttribute("aria-activedescendant", firstId!);
    const selected = map.getByRole("option", { selected: true });
    await expect(selected).toHaveCount(1);
    await expect(map).toHaveAttribute(
      "aria-activedescendant",
      (await selected.getAttribute("id")) ?? ""
    );
    await expect(
      page.getByRole("region", { name: "Selected zone" })
    ).toContainText("UTC");

    const table = page.getByRole("table", {
      name: /local time, UTC offset and daylight saving/i,
    });
    await expect(table.getByRole("row").nth(1)).toBeVisible();

    await page
      .getByRole("searchbox", { name: "Search time zones" })
      .fill("kolkata");
    await expect(table.getByRole("row", { name: /Kolkata/ })).toBeVisible();
    await expect(table.getByRole("row")).toHaveCount(2);
    await expect(page.getByText("1 time zone", { exact: true })).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await expectAxeClean(page);
  });
});
