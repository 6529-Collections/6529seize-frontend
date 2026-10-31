import {
  expect,
  expectAxeClean,
  expectNoHorizontalOverflow,
  test,
  waitForRouteReady,
} from "../testHelpers";

// One route per template (AGENTS.md, Test Layer Selection): the static
// explainer with client islands, and the data dashboard. Content, links and
// data states are covered by Jest.
const HOW_IT_WORKS_ROUTE = "/network/tdh/how-it-works";
const VERIFICATION_ROUTE = "/network/tdh/verification";

test.describe("TDH explained and verified @network @wcag @medium @large", () => {
  test("How TDH is calculated renders its parts without sideways scroll and updates the boost ladder", async ({
    page,
  }) => {
    await page.goto(HOW_IT_WORKS_ROUTE, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "How TDH is calculated" })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    // The boost ladder runs the TDH v1.4 engine in the browser: one more
    // Gradient moves the readout from 1.02 to 1.04.
    const ladder = page.getByRole("region", { name: "The boost ladder" });
    await ladder.scrollIntoViewIfNeeded();
    const readout = ladder.locator("[data-readout]");
    await expect(readout).toContainText("1.02");
    await ladder.getByRole("button", { name: "One more: Gradients" }).click();
    await expect(readout).toContainText("1.04");

    await expectAxeClean(page, { route: HOW_IT_WORKS_ROUTE });
  });

  test("TDH verification renders the day at a glance, the calendar and the history table", async ({
    page,
  }) => {
    await page.goto(VERIFICATION_ROUTE, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "TDH verification" })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const glance = page.getByRole("region", { name: "The day at a glance" });
    const empty = page.getByText(
      /^Daily reports (start on 16 October 2026|are not yet connected to this page)\.$/
    );
    if (await empty.isVisible()) {
      // Production without a data source: the honest awaiting state.
      await expectAxeClean(page, { route: VERIFICATION_ROUTE });
      return;
    }
    await expect(glance).toBeVisible();

    // Every published day is a link in the calendar strip, the shown day
    // marked as current.
    await expect(
      page
        .getByRole("region", { name: "Every day" })
        .locator('a[aria-current="date"]')
        .first()
    ).toBeVisible();

    // Fewer than seven days show as a table at once; from seven, a chart
    // comes first on wide screens with the table one click away. On a phone
    // the same results are one card per day, in a list.
    const showTable = page.getByText("Show as table");
    if (await showTable.isVisible()) {
      await showTable.click();
    }
    await expect(
      page
        .getByRole("table", { name: "Daily results" })
        .or(page.getByRole("list", { name: "Daily results" }))
        .first()
    ).toBeVisible();

    // Differences are counts only: no record is ever listed.
    await expect(
      page.getByRole("region", { name: "Differences" })
    ).toBeVisible();
    await expect(page.getByText(/holder-\d/)).toHaveCount(0);

    await expectAxeClean(page, { route: VERIFICATION_ROUTE });
  });
});
