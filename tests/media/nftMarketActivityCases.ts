import { expect, test, expectNoHorizontalOverflow } from "../testHelpers";

const MAKER = "0x1111111111111111111111111111111111111111";
const RECIPIENT = "0x2222222222222222222222222222222222222222";
const LONG_NAME = "a-collector-with-a-very-long-readable-name.eth";

export function defineNftMarketActivityTests() {
  test("card activity reflows without losing links, values, or table semantics", async ({
    page,
  }) => {
    const activityEvent = {
      event_id: "activity-responsive-fixture",
      kind: "market",
      action: "revalidation",
      occurred_at: "2026-09-10T12:00:00Z",
      observed_at: "2026-09-10T12:00:00Z",
      source: "ethereum",
      evidence: "provider_order_status",
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
    };
    await page.route("**/api/nft-activity?*", (route) =>
      route.fulfill({
        json: {
          data: [
            activityEvent,
            {
              ...activityEvent,
              event_id: "activity-real-amount",
              action: "offer",
              evidence: "chain",
              price: "0.06510000000000001",
              currency: { symbol: "WETH", decimals: 18, address: MAKER },
              transaction_details: {
                from_display: "real-amount.eth",
                to_display: "collector",
              },
            },
            {
              ...activityEvent,
              event_id: "activity-extreme-amount",
              price: "12345678901234567890.000000000000000001",
              transaction_details: {
                from_display: "extreme-amount.eth",
                to_display: "collector",
              },
            },
            {
              ...activityEvent,
              event_id: "activity-wide-desktop-amount",
              price:
                "115792089237316195423570985008687907853269984665640564039457.584007913129639935",
              transaction_details: {
                from_display: "wide-amount.eth",
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
    const scrollRegion = page.getByRole("region", {
      name: "Scrollable NFT activity table",
      exact: true,
    });
    const row = table.getByRole("row").filter({ hasText: LONG_NAME });
    const realAmount = table.getByRole("cell", {
      name: "0.06510000000000001 WETH",
      exact: true,
    });
    const heading = page.getByRole("heading", {
      name: "Card Activity",
      exact: true,
    });
    const filter = page.getByRole("button", {
      name: "Transaction Type: All activity",
      exact: true,
    });
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
    await expect(realAmount).toBeVisible();
    await expect(filter).toBeVisible();
    await expect(
      table.getByRole("cell", {
        name: "12,345,678,901,234,567,890.000000000000000001 ETH",
        exact: true,
      })
    ).toBeVisible();
    await expect(
      table.getByRole("cell", {
        name: "115,792,089,237,316,195,423,570,985,008,687,907,853,269,984,665,640,564,039,457.584007913129639935 ETH",
        exact: true,
      })
    ).toBeVisible();

    for (const width of [1440, 1280, 900, 390, 360, 320]) {
      await page.setViewportSize({ width, height: 1000 });
      await expectNoHorizontalOverflow(page);
      expect(
        await table
          .getByRole("cell")
          .evaluateAll((cells) =>
            cells.some((cell) => cell.scrollWidth > cell.clientWidth + 1)
          ),
        `All activity values remain inside their cells at ${width}px`
      ).toBe(false);
      expect(
        await realAmount.evaluate((element) => {
          const text = element.firstChild;
          if (!text) throw new Error("Total text is required");
          const range = document.createRange();
          range.setStart(text, 0);
          range.setEnd(text, (text.textContent ?? "").indexOf(" WETH"));
          return range.getClientRects().length;
        }),
        `The real offer amount stays on one line at ${width}px`
      ).toBe(1);
      // Read both rectangles together so page movement after a resize cannot
      // make measurements from different frames look like misalignment.
      const headerLayout = await heading.evaluate((element) => {
        const dropdown = element.parentElement?.querySelector(
          'button[aria-haspopup="true"]'
        );
        if (!dropdown) throw new Error("Activity filter must be present");
        const headingBox = element.getBoundingClientRect();
        const filterBox = dropdown.getBoundingClientRect();
        return {
          centerDifference: Math.abs(
            headingBox.y +
              headingBox.height / 2 -
              (filterBox.y + filterBox.height / 2)
          ),
          headingRight: headingBox.right,
          filterLeft: filterBox.left,
        };
      });
      expect(
        headerLayout.centerDifference,
        `Activity heading and filter are vertically centered at ${width}px`
      ).toBeLessThan(1);
      expect(headerLayout.headingRight).toBeLessThan(headerLayout.filterLeft);
      expect(
        await row
          .getByText("Revalidated", { exact: true })
          .evaluate((element) => {
            const range = document.createRange();
            range.selectNodeContents(element);
            return range.getClientRects().length;
          })
      ).toBe(1);
      const totalLineCount = await row
        .getByRole("cell")
        .nth(4)
        .evaluate((element) => {
          const text = element.firstChild;
          if (!text) throw new Error("Total text is required");
          const range = document.createRange();
          range.setStart(text, 0);
          range.setEnd(text, (text.textContent ?? "").indexOf(" ETH"));
          return range.getClientRects().length;
        });
      const layout = await row.evaluate((element) => {
        const style = getComputedStyle(element);
        const cells = Array.from(element.querySelectorAll("td"));
        return {
          availableWidth: element.parentElement?.clientWidth ?? 0,
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
            height: cell.getBoundingClientRect().height,
          })),
        };
      });
      expect(layout.border).toEqual(["0px", "0px", "0px"]);
      expect(layout.overflowing, `Activity cells overflow at ${width}px`).toBe(
        false
      );
      if (layout.availableWidth >= 320) {
        expect(totalLineCount).toBe(1);
      }
      const [action, item, maker, recipient, total, date] = layout.positions;
      if (!action || !item || !maker || !recipient || !total || !date)
        throw new Error("Six activity cells are required");
      if (width >= 1280) {
        expect(
          new Set(layout.positions.map((position) => position.y)).size
        ).toBe(1);
      } else {
        expect(
          await scrollRegion.evaluate(
            (element) => element.scrollWidth > element.clientWidth + 1
          ),
          `Phone and tablet cards need no horizontal scrolling at ${width}px`
        ).toBe(false);
        expect(
          Math.abs(action.y + action.height / 2 - (total.y + total.height / 2))
        ).toBeLessThan(1);
        expect(action.x).toBeLessThan(total.x);
        expect(item.y).toBeGreaterThan(action.y);
        expect(item.y).toBeGreaterThan(total.y);
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

    await page.setViewportSize({ width: 1050, height: 1000 });
    await expectNoHorizontalOverflow(page);
    expect(
      await scrollRegion.evaluate(
        (element) => element.scrollWidth > element.clientWidth
      )
    ).toBe(true);
    await scrollRegion.scrollIntoViewIfNeeded();
    await scrollRegion.focus();
    await expect(scrollRegion).toBeFocused();
    await transaction.focus();
    await expect(transaction).toBeFocused();
    await expect
      .poll(() => scrollRegion.evaluate((element) => element.scrollLeft))
      .toBeGreaterThan(0);
  });
}
