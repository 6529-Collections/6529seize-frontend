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
    expect(await map.getByRole("option").count()).toBeGreaterThan(60);
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
