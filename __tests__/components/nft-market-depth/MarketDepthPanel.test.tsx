import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState } from "react";
import MarketDepthPanel from "@/components/nft-market-depth/MarketDepthPanel";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const fetchMock = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;

function StatefulAction({ refresh }: { refresh: () => void }) {
  const [count, setCount] = useState(0);
  return (
    <div data-testid="market-depth-action-slot">
      <button type="button" onClick={() => setCount((value) => value + 1)}>
        Remember action state
      </button>
      <span data-testid="market-depth-action-count">{count}</span>
      <button type="button" onClick={refresh}>
        Refresh market
      </button>
    </div>
  );
}

function depth(overrides: Record<string, unknown> = {}) {
  return {
    contract: "0x0000000000000000000000000000000000000001",
    token_id: "7",
    status: "fresh",
    as_of: "2026-09-10T12:00:00.000Z",
    snapshots: [],
    books: [
      {
        currency: {
          address: "0x0000000000000000000000000000000000000000",
          symbol: "ETH",
          decimals: 18,
        },
        asks: [
          {
            unit_price: "1.25",
            quantity: "2",
            cumulative_quantity: "2",
            order_count: 1,
          },
        ],
        bids: [],
        best_ask: "1.25",
        best_bid: null,
        ask_order_count: 1,
        bid_order_count: 0,
      },
      {
        currency: {
          address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
          symbol: "WETH",
          decimals: 18,
        },
        asks: [],
        bids: [
          {
            unit_price: "1.1",
            quantity: "1",
            cumulative_quantity: "1",
            order_count: 1,
          },
        ],
        best_ask: null,
        best_bid: "1.1",
        ask_order_count: 0,
        bid_order_count: 1,
      },
    ],
    orders: [
      {
        order_key: "order-1",
        order_id: "order-1",
        source: "opensea",
        protocol: "seaport",
        collection_slug: "collection",
        side: "ask",
        scope: "collection",
        maker: "0xmaker",
        token_id: null,
        original_quantity: "1",
        remaining_quantity: "1",
        currency: {
          address: "0x0000000000000000000000000000000000000000",
          symbol: "ETH",
          decimals: 18,
        },
        total_price_raw: "1250000000000000000",
        unit_price: "1.25",
        starts_at: null,
        expires_at: null,
        observed_at: "2026-09-10T12:00:00.000Z",
        applicability: "criteria_unverified",
        liquidity_group: "group-1",
        caveats: [],
      },
    ],
    order_count: 1,
    next: null,
    criteria_order_count: 1,
    notes: [],
    ...overrides,
  };
}

describe("MarketDepthPanel", () => {
  beforeEach(() => {
    fetchMock.mockReset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("shows a safe error and does not refetch when only the locale changes", async () => {
    fetchMock.mockRejectedValue(new Error("private provider diagnostic"));
    const { rerender } = render(
      <MarketDepthPanel contract="0x1" tokenId="7" locale="en-US" />
    );
    expect(
      await screen.findByText("Listings and offers could not be loaded.")
    ).toBeInTheDocument();
    expect(
      screen.queryByText("private provider diagnostic")
    ).not.toBeInTheDocument();
    rerender(<MarketDepthPanel contract="0x1" tokenId="7" locale="fr-FR" />);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("keeps captured depth visible when another page fails without exposing diagnostics", async () => {
    fetchMock
      .mockResolvedValueOnce(depth({ next: "cursor-1" }))
      .mockRejectedValueOnce(new Error("private order diagnostic"));
    render(<MarketDepthPanel contract="0x1" tokenId="7" locale="en-US" />);
    await screen.findByText("Lowest listing · ETH");
    fireEvent.click(screen.getByText("Individual listings and offers"));
    fireEvent.click(screen.getByRole("button", { name: "Load more orders" }));
    expect(
      await screen.findByText("More listings and offers could not be loaded.")
    ).toBeInTheDocument();
    expect(screen.getByText("Lowest listing · ETH")).toBeInTheDocument();
    expect(
      screen.queryByText("private order diagnostic")
    ).not.toBeInTheDocument();
  });

  it("keeps currencies separate and labels criteria applicability", async () => {
    fetchMock.mockResolvedValue(depth());

    render(
      <MarketDepthPanel
        contract="0x0000000000000000000000000000000000000001"
        tokenId="7"
      />
    );

    await waitFor(() =>
      expect(screen.getByText("Lowest listing · ETH")).toBeInTheDocument()
    );
    expect(screen.getByText("Lowest listing · ETH")).toBeInTheDocument();
    expect(screen.getByText("Highest offer · WETH")).toBeInTheDocument();
    expect(screen.getByText("Listings · ETH")).toBeInTheDocument();
    expect(screen.getByText("Offers · WETH")).toBeInTheDocument();
    expect(screen.queryByText("Offers · ETH")).not.toBeInTheDocument();
    expect(screen.queryByText("Listings · WETH")).not.toBeInTheDocument();
    expect(screen.getByText("Criteria match unverified")).toBeInTheDocument();
    expect(
      screen.getByText("OpenSea listings and offers captured for this card.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Source: OpenSea. Prices and availability can change. Quoted quantities may overlap."
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText("Individual listings and offers")
    ).toBeInTheDocument();
    expect(screen.getByText("About these prices")).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "market-depth/0x0000000000000000000000000000000000000001/7",
        includeWalletAuth: false,
      })
    );
  });

  it("shows a live relative update time and backed stale and unpriced states", async () => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date("2026-09-10T12:05:00.000Z"));
    fetchMock.mockResolvedValue(
      depth({
        status: "stale",
        snapshots: [
          {
            id: "snapshot-1",
            source: "opensea",
            collection_slug: "collection",
            started_at: "2026-09-10T11:59:00.000Z",
            completed_at: "2026-09-10T12:00:00.000Z",
            order_count: 1,
            unsupported_count: 2,
            schema_version: 1,
            normalizer_version: "1",
          },
        ],
      })
    );

    render(<MarketDepthPanel contract="0x1" tokenId="7" locale="en-US" />);

    expect(
      await screen.findByText("Updated 5 minutes ago")
    ).toBeInTheDocument();
    expect(screen.getByText("Snapshot is stale.")).toBeInTheDocument();
    expect(
      screen.getByText("Some orders in the collection could not be priced.")
    ).toBeInTheDocument();

    act(() => {
      jest.advanceTimersByTime(60_000);
    });
    expect(screen.getByText("Updated 6 minutes ago")).toBeInTheDocument();
  });

  it.each(["2026-09-10T12:00:30.000Z", "2026-09-10T12:01:00.000Z"])(
    "uses an absolute update time for future timestamp %s",
    async (asOf) => {
      jest.useFakeTimers();
      jest.setSystemTime(new Date("2026-09-10T12:00:00.000Z"));
      fetchMock.mockResolvedValue(depth({ as_of: asOf }));

      render(<MarketDepthPanel contract="0x1" tokenId="7" locale="en-US" />);

      await screen.findByText("Lowest listing · ETH");
      expect(screen.queryByText(/Updated in /)).not.toBeInTheDocument();
      expect(screen.queryByText("Updated now")).not.toBeInTheDocument();
      expect(screen.getByText(/^Updated /).closest("p")).toHaveAttribute(
        "title",
        expect.stringContaining("2026")
      );
    }
  );

  it("shows five price levels initially and reveals the complete list", async () => {
    const levels = Array.from({ length: 7 }, (_, index) => ({
      unit_price: `${index + 1}.123`,
      quantity: "1",
      cumulative_quantity: String(index + 1),
      order_count: 1,
    }));
    fetchMock.mockResolvedValue(
      depth({
        books: [
          {
            ...depth().books[0],
            asks: levels,
            best_ask: levels[0]?.unit_price,
            ask_order_count: levels.length,
          },
        ],
      })
    );

    const { container } = render(
      <MarketDepthPanel contract="0x1" tokenId="7" locale="en-US" />
    );

    await screen.findByText("Listings · ETH");
    expect(container.querySelector('[title="5.123"]')).toBeInTheDocument();
    expect(container.querySelector('[title="6.123"]')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show all levels" }));
    expect(container.querySelector('[title="7.123"]')).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Show fewer levels" }));
    expect(container.querySelector('[title="6.123"]')).not.toBeInTheDocument();
  });

  it("renders the optional action slot once between the summary and prices", async () => {
    fetchMock.mockResolvedValue(depth());

    render(
      <MarketDepthPanel
        contract="0x0000000000000000000000000000000000000001"
        tokenId="7"
        actions={<button type="button">Collect this card</button>}
      />
    );

    const title = screen.getByRole("heading", {
      name: "Listings and Offers",
    });
    const action = screen.getByRole("button", { name: "Collect this card" });
    const firstPrice = await screen.findByText("Lowest listing · ETH");

    expect(
      screen.getAllByRole("button", { name: "Collect this card" })
    ).toHaveLength(1);
    expect(title.compareDocumentPosition(action)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(action.compareDocumentPosition(firstPrice)).toBe(
      Node.DOCUMENT_POSITION_FOLLOWING
    );
    expect(action.closest("section")).toBe(title.closest("section"));
  });

  it("lets the action callback refresh the first page", async () => {
    fetchMock.mockResolvedValueOnce(depth()).mockResolvedValueOnce(
      depth({
        books: [
          {
            ...depth().books[0],
            asks: [
              {
                unit_price: "2.5",
                quantity: "1",
                cumulative_quantity: "1",
                order_count: 1,
              },
            ],
            best_ask: "2.5",
          },
        ],
      })
    );

    const { container } = render(
      <MarketDepthPanel
        contract="0x1"
        tokenId="7"
        locale="en-US"
        actions={(refresh) => (
          <button type="button" onClick={refresh}>
            Refresh market
          </button>
        )}
      />
    );

    await screen.findByText("Lowest listing · ETH");
    fireEvent.click(screen.getByRole("button", { name: "Refresh market" }));

    await waitFor(() =>
      expect(container.querySelector('[title="2.5"]')).toBeInTheDocument()
    );
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        params: { page_size: "40" },
      })
    );
  });

  it("preserves callback action state while refresh shows loading", async () => {
    let resolveRefresh: ((value: ReturnType<typeof depth>) => void) | undefined;
    const pendingRefresh = new Promise<ReturnType<typeof depth>>((resolve) => {
      resolveRefresh = resolve;
    });
    fetchMock
      .mockResolvedValueOnce(depth())
      .mockReturnValueOnce(pendingRefresh);

    render(
      <MarketDepthPanel
        contract="0x1"
        tokenId="7"
        locale="en-US"
        actions={(refresh) => <StatefulAction refresh={refresh} />}
      />
    );

    await screen.findByText("Lowest listing · ETH");
    const actionSlot = screen.getByTestId("market-depth-action-slot");
    fireEvent.click(
      screen.getByRole("button", { name: "Remember action state" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Refresh market" }));

    expect(screen.getByTestId("market-depth-action-slot")).toBe(actionSlot);
    expect(screen.getByTestId("market-depth-action-count")).toHaveTextContent(
      "1"
    );
    expect(screen.getByText("Loading listings and offers")).toBeInTheDocument();

    resolveRefresh?.(depth());
    await screen.findByText("Lowest listing · ETH");
    expect(screen.getByTestId("market-depth-action-slot")).toBe(actionSlot);
    expect(screen.getByTestId("market-depth-action-count")).toHaveTextContent(
      "1"
    );
  });

  it("aborts a pending old order page and ignores its late result", async () => {
    let resolveOldPage: ((page: ReturnType<typeof depth>) => void) | undefined;
    const pendingOldPage = new Promise<ReturnType<typeof depth>>((resolve) => {
      resolveOldPage = resolve;
    });
    fetchMock
      .mockResolvedValueOnce(depth({ next: "cursor-1" }))
      .mockReturnValueOnce(pendingOldPage)
      .mockResolvedValueOnce(
        depth({
          orders: [
            {
              ...depth().orders[0],
              order_key: "new-card-page",
              unit_price: "3.33",
            },
          ],
          order_count: 1,
          next: null,
        })
      );

    render(
      <MarketDepthPanel
        contract="0x1"
        tokenId="7"
        locale="en-US"
        actions={(refresh) => (
          <button type="button" onClick={refresh}>
            Refresh market
          </button>
        )}
      />
    );

    await screen.findByText("Load more orders");
    fireEvent.click(screen.getByText("Individual listings and offers"));
    fireEvent.click(screen.getByRole("button", { name: "Load more orders" }));
    const oldPageSignal = fetchMock.mock.calls[1]?.[0].signal;
    fireEvent.click(screen.getByRole("button", { name: "Refresh market" }));

    await waitFor(() => expect(oldPageSignal?.aborted).toBe(true));
    await act(async () => {
      resolveOldPage?.(
        depth({
          orders: [
            {
              ...depth().orders[0],
              order_key: "old-page-result",
              unit_price: "99.99",
            },
          ],
        })
      );
    });
    await waitFor(() => expect(screen.getByText("3.33")).toBeInTheDocument());
    expect(
      screen.queryByText("More listings and offers could not be loaded.")
    ).not.toBeInTheDocument();
    expect(screen.queryByText("99.99")).not.toBeInTheDocument();
  });

  it("uses the action callback to recover from the initial error", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("private provider diagnostic"))
      .mockResolvedValueOnce(depth());

    render(
      <MarketDepthPanel
        contract="0x1"
        tokenId="7"
        locale="en-US"
        actions={(refresh) => (
          <button type="button" onClick={refresh}>
            Refresh market
          </button>
        )}
      />
    );

    await screen.findByText("Listings and offers could not be loaded.");
    fireEvent.click(screen.getByRole("button", { name: "Refresh market" }));

    await screen.findByText("Lowest listing · ETH");
    expect(
      screen.queryByText("Listings and offers could not be loaded.")
    ).not.toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("distinguishes an empty completed snapshot from unavailable data", async () => {
    fetchMock.mockResolvedValueOnce(
      depth({
        books: [],
        orders: [],
        order_count: 0,
        criteria_order_count: 1,
        snapshots: [
          {
            id: "snapshot-1",
            source: "opensea",
            collection_slug: "collection",
            started_at: "2026-09-10T11:59:00.000Z",
            completed_at: "2026-09-10T12:00:00.000Z",
            order_count: 1,
            unsupported_count: 2,
            schema_version: 1,
            normalizer_version: "1",
          },
        ],
      })
    );

    const { rerender } = render(
      <MarketDepthPanel
        contract="0x0000000000000000000000000000000000000001"
        tokenId="7"
      />
    );

    await waitFor(() =>
      expect(
        screen.getByText(
          "No fixed-price listings or offers are available in this update."
        )
      ).toBeInTheDocument()
    );
    expect(
      screen.getByText("Some orders in the collection could not be priced.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "1 criteria order is shown separately; token applicability is unverified."
      )
    ).toBeInTheDocument();

    fetchMock.mockResolvedValueOnce(
      depth({
        status: "unavailable",
        notes: ["Provider has not completed a snapshot."],
      })
    );
    rerender(
      <MarketDepthPanel
        contract="0x0000000000000000000000000000000000000001"
        tokenId="8"
      />
    );
    await waitFor(() =>
      expect(
        screen.getByText(
          "Listings and offers are not available for this card yet."
        )
      ).toBeInTheDocument()
    );
  });

  it("shows every fetched order and appends the next immutable page", async () => {
    const firstPage = depth({
      orders: Array.from({ length: 13 }, (_, index) => ({
        ...depth().orders[0],
        order_key: `order-${index + 1}`,
        unit_price: `${index + 1}.123456789012345678`,
      })),
      order_count: 14,
      next: "cursor-1",
    });
    const secondPage = depth({
      orders: [
        {
          ...depth().orders[0],
          order_key: "order-14",
          unit_price: "14.123456789012345678",
        },
      ],
      order_count: 14,
      next: null,
    });
    fetchMock
      .mockResolvedValueOnce(firstPage)
      .mockResolvedValueOnce(secondPage);

    render(
      <MarketDepthPanel
        contract="0x0000000000000000000000000000000000000001"
        tokenId="7"
      />
    );

    await waitFor(() =>
      expect(
        screen.getByText("Individual listings and offers")
      ).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText("Individual listings and offers"));
    expect(screen.getByText("13.123456789012345678")).toBeInTheDocument();
    expect(
      screen.getAllByText("0x0000000000000000000000000000000000000000").length
    ).toBeGreaterThan(0);

    fireEvent.click(screen.getByRole("button", { name: "Load more orders" }));
    await waitFor(() =>
      expect(screen.getByText("14.123456789012345678")).toBeInTheDocument()
    );
  });

  it("does not merge a pending order page after the card changes", async () => {
    let resolvePendingPage:
      | ((page: ReturnType<typeof depth>) => void)
      | undefined;
    const pendingPage = new Promise<ReturnType<typeof depth>>((resolve) => {
      resolvePendingPage = resolve;
    });
    fetchMock
      .mockResolvedValueOnce(depth({ next: "cursor-1" }))
      .mockReturnValueOnce(pendingPage)
      .mockResolvedValueOnce(
        depth({ token_id: "8", orders: [], order_count: 0, next: null })
      );

    const { rerender } = render(
      <MarketDepthPanel
        contract="0x0000000000000000000000000000000000000001"
        tokenId="7"
      />
    );

    await waitFor(() =>
      expect(screen.getByText("Load more orders")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText("Individual listings and offers"));
    fireEvent.click(screen.getByRole("button", { name: "Load more orders" }));
    rerender(
      <MarketDepthPanel
        contract="0x0000000000000000000000000000000000000001"
        tokenId="8"
      />
    );
    resolvePendingPage?.(
      depth({
        orders: [
          { ...depth().orders[0], order_key: "old-card", unit_price: "99.99" },
        ],
      })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "market-depth/0x0000000000000000000000000000000000000001/8",
        })
      )
    );
    expect(screen.queryByText("99.99")).not.toBeInTheDocument();
  });
});
