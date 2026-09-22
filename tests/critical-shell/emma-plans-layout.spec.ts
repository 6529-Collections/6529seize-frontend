import { expect, expectNoHorizontalOverflow, test } from "../testHelpers";

const plan = {
  id: "emma-layout-fixture",
  name: `${"Long distribution plan name ".repeat(4)}${"N".repeat(80)}`,
  description: `${"A description that must wrap inside the plan table. ".repeat(6)}${"D".repeat(120)}`,
  createdAt: Date.UTC(2026, 8, 22),
};

test.describe("EMMA plan layout @critical-shell @medium @large", () => {
  for (const width of [320, 768, 1440]) {
    test(`contains long plan text and controls at ${width}px`, async ({
      page,
    }, testInfo) => {
      await page.setViewportSize({ width, height: 1000 });
      await page.route(
        (url) => url.pathname === "/allowlists",
        async (route) => {
          if (route.request().method() === "GET") {
            await route.fulfill({ json: [plan] });
          } else {
            await route.abort("blockedbyclient");
          }
        }
      );

      await page.goto("/emma/plans", { waitUntil: "domcontentloaded" });
      const table = page.getByRole("table");
      await expect(
        table.getByRole("cell", { name: plan.name, exact: true })
      ).toBeVisible();
      await expect(table.getByRole("columnheader")).toHaveCount(4);
      await expect(table.getByRole("row")).toHaveCount(2);
      await expect(table.getByRole("cell")).toHaveCount(4);
      await expect(
        page.getByRole("button", { name: "Create new", exact: true })
      ).toBeInViewport({ ratio: 1 });
      await expectNoHorizontalOverflow(page);

      // The page wrapper clips overflow, so document width alone cannot catch
      // a table or cell extending beyond its visible container.
      const geometry = await table.evaluate((element) => {
        const tableBounds = element.getBoundingClientRect();
        const cells = Array.from(element.querySelectorAll("tbody td"));
        return {
          left: tableBounds.left,
          right: tableBounds.right,
          viewportWidth: document.documentElement.clientWidth,
          cells: cells.map((cell) => {
            const bounds = cell.getBoundingClientRect();
            const range = document.createRange();
            range.selectNodeContents(cell);
            const lines = Array.from(range.getClientRects());
            return {
              contained: lines.every(
                (line) =>
                  line.left >= bounds.left - 1 && line.right <= bounds.right + 1
              ),
              lineCount: lines.length,
              left: bounds.left,
              right: bounds.right,
              textLeft: Math.min(...lines.map((line) => line.left)),
              textRight: Math.max(...lines.map((line) => line.right)),
            };
          }),
        };
      });
      expect(geometry.left).toBeGreaterThanOrEqual(0);
      expect(geometry.right).toBeLessThanOrEqual(geometry.viewportWidth);
      await testInfo.attach("EMMA plans layout", {
        body: await page.screenshot({ fullPage: true }),
        contentType: "image/png",
      });
      expect(
        geometry.cells.every((cell) => cell.contained),
        JSON.stringify(geometry)
      ).toBe(true);
      // These cells render the fixture as inline text, with one rect per line.
      expect(geometry.cells[0]?.lineCount).toBeGreaterThan(1);
      expect(geometry.cells[1]?.lineCount).toBeGreaterThan(1);
      const deleteButton = table.getByRole("button", {
        name: "Delete",
        exact: true,
      });
      await deleteButton.scrollIntoViewIfNeeded();
      await expect(deleteButton).toBeInViewport({ ratio: 1 });
    });
  }
});
