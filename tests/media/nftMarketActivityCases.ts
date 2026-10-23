import { expect, test, expectNoHorizontalOverflow } from "../testHelpers";

const MAKER = "0x1111111111111111111111111111111111111111";
const RECIPIENT = "0x2222222222222222222222222222222222222222";
const LONG_NAME = "a-collector-with-a-very-long-readable-name.eth";

export function defineNftMarketActivityTests() {
  test("card activity reflows without losing links, values, or table semantics", async ({
    page,
  }) => {
    await page.route("**/api/nft-activity?*", (route) =>
      route.fulfill({
        json: {
          data: [
            {
              event_id: "activity-responsive-fixture",
              kind: "transaction",
              action: "sale",
              occurred_at: "2026-09-10T12:00:00Z",
              observed_at: "2026-09-10T12:00:00Z",
              source: "ethereum",
              evidence: "chain",
              contract: "0x33FD426905F149f8376e227d0C9D3340AaD17aF1",
              token_id: null,
              collection_slug: "the-memes-by-6529",
              quantity: "12",
              maker: MAKER,
              taker: RECIPIENT,
              price: "123456789.123456789012345678",
              currency: { symbol: "ETH", decimals: 18, address: MAKER },
              transaction_hash: `0x${"a".repeat(64)}`,
              transaction_details: {
                from_display: LONG_NAME,
                to_display: "collector",
              },
            },
          ],
          next: null,
          market_history_started_at: null,
          notes: [],
        },
      })
    );
    await page.goto("/the-memes/1?focus=activity");
    const table = page.getByRole("table", {
      name: "NFT activity",
      exact: true,
    });
    const row = table.getByRole("row").filter({ hasText: LONG_NAME });
    await expect(row).toBeVisible({ timeout: 45000 });
    await expect(table.getByRole("columnheader")).toHaveCount(6);
    await expect(row.getByRole("cell")).toHaveCount(6);
    await expect(
      row.getByRole("link", { name: "The Memes", exact: true })
    ).toHaveAttribute("href", "/the-memes");
    await expect(
      row.getByRole("link", { name: LONG_NAME, exact: true })
    ).toHaveAttribute("href", `/${LONG_NAME}`);
    await expect(
      row.getByText("123,456,789.123456789012345678 ETH")
    ).toBeVisible();

    for (const width of [1440, 1280, 900, 390, 360]) {
      await page.setViewportSize({ width, height: 1000 });
      await expectNoHorizontalOverflow(page);
      const layout = await row.evaluate((element) => {
        const style = getComputedStyle(element);
        const cells = Array.from(element.querySelectorAll("td"));
        return {
          border: [
            style.borderTopWidth,
            style.borderRightWidth,
            style.borderLeftWidth,
          ],
          overflowing: cells.some(
            (cell) => cell.scrollWidth > cell.clientWidth + 1
          ),
          positions: cells.map((cell) => ({
            x: cell.getBoundingClientRect().x,
            y: cell.getBoundingClientRect().y,
          })),
        };
      });
      expect(layout.border).toEqual(["0px", "0px", "0px"]);
      expect(layout.overflowing, `Activity cells overflow at ${width}px`).toBe(
        false
      );
      const [action, item, maker, recipient, total, date] = layout.positions;
      if (!action || !item || !maker || !recipient || !total || !date)
        throw new Error("Six activity cells are required");
      if (width >= 1280) {
        expect(
          new Set(layout.positions.map((position) => position.y)).size
        ).toBe(1);
      } else {
        expect(Math.abs(action.y - total.y)).toBeLessThan(50);
        expect(item.y).toBeGreaterThan(action.y);
        expect(maker.y).toBeGreaterThan(item.y);
        expect(recipient.y).toBe(maker.y);
        expect(date.y).toBeGreaterThan(maker.y);
      }
      const targets = await row.getByRole("link").evaluateAll((links) =>
        links.map((link) => ({
          width: link.getBoundingClientRect().width,
          height: link.getBoundingClientRect().height,
        }))
      );
      expect(
        targets.every((target) => target.width >= 44 && target.height >= 44)
      ).toBe(true);
    }
    const transaction = row.getByRole("link", { name: /Etherscan/i });
    await transaction.focus();
    await expect(transaction).toBeFocused();
    expect(
      await transaction.evaluate(
        (element) => getComputedStyle(element).outlineStyle
      )
    ).not.toBe("none");
  });
}
