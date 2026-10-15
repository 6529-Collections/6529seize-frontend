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
  test("How TDH is calculated renders its steps without sideways scroll and updates the boost builder", async ({
    page,
  }) => {
    await page.goto(HOW_IT_WORKS_ROUTE, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "How TDH is calculated" })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const builder = page.getByRole("region", { name: "Boost builder" });
    await builder.scrollIntoViewIfNeeded();
    await expect(builder.getByText("Boost 1.02")).toBeVisible();
    await builder.getByRole("button", { name: "Increase Gradients" }).click();
    await expect(builder.getByText("Boost 1.04")).toBeVisible();

    await expectAxeClean(page, { route: HOW_IT_WORKS_ROUTE });
  });

  test("TDH verification renders tiles, the history table and class filters", async ({
    page,
  }) => {
    await page.goto(VERIFICATION_ROUTE, { waitUntil: "domcontentloaded" });
    await waitForRouteReady(page);

    await expect(
      page.getByRole("heading", { level: 1, name: "TDH verification" })
    ).toBeVisible();
    await expectNoHorizontalOverflow(page);

    const agreement = page.getByRole("region", { name: "Agreement" });
    const empty = page.getByText(
      /^Daily reports (start on 16 October 2026|are not yet connected to this page)\.$/
    );
    if (await empty.isVisible()) {
      // Production without a data source: the honest awaiting state.
      await expectAxeClean(page, { route: VERIFICATION_ROUTE });
      return;
    }
    await expect(agreement).toBeVisible();

    // Fewer than seven days show as a table at once; from seven, a chart
    // comes first on wide screens with the table one click away.
    const showTable = page.getByText("Show as table");
    if (await showTable.isVisible()) {
      await showTable.click();
    }
    await expect(
      page.getByRole("table", { name: "Daily results" }).first()
    ).toBeVisible();

    const filters = page.getByRole("group", {
      name: "Filter differences by class",
    });
    if (await filters.isVisible()) {
      const classFilter = filters
        .getByRole("button", { name: /Class / })
        .first();
      await classFilter.click();
      await expect(classFilter).toHaveAttribute("aria-pressed", "true");
    }

    await expectAxeClean(page, { route: VERIFICATION_ROUTE });
  });
});
