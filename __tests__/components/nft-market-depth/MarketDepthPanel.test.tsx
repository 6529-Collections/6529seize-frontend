import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import MarketDepthPanel from "@/components/nft-market-depth/MarketDepthPanel";
import { commonApiFetch } from "@/services/api/common-api";

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
}));

const fetchMock = commonApiFetch as jest.MockedFunction<typeof commonApiFetch>;

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

  it("shows a safe error and does not refetch when only the locale changes", async () => {
    fetchMock.mockRejectedValue(new Error("private provider diagnostic"));
    const { rerender } = render(
      <MarketDepthPanel contract="0x1" tokenId="7" locale="en-US" />
    );
    expect(
      await screen.findByText("Market depth could not be loaded.")
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
    await screen.findByText("Best ask · ETH");
    fireEvent.click(screen.getByText("Order details (1)"));
    fireEvent.click(screen.getByRole("button", { name: "Load more orders" }));
    expect(
      await screen.findByText("More order details could not be loaded.")
    ).toBeInTheDocument();
    expect(screen.getByText("Best ask · ETH")).toBeInTheDocument();
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
      expect(screen.getByText("Best ask · ETH")).toBeInTheDocument()
    );
    expect(screen.getByText("Best ask · ETH")).toBeInTheDocument();
    expect(screen.getByText("Best bid · WETH")).toBeInTheDocument();
    expect(screen.getByText("Asks (listings) · ETH")).toBeInTheDocument();
    expect(screen.getByText("Bids (offers) · WETH")).toBeInTheDocument();
    expect(screen.queryByText("Bids (offers) · ETH")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Asks (listings) · WETH")
    ).not.toBeInTheDocument();
    expect(screen.getByText("Criteria match unverified")).toBeInTheDocument();
    expect(
      screen.getByText(/listings and offers captured from OpenSea/i)
    ).toBeInTheDocument();
    expect(fetchMock).toHaveBeenCalledWith(
      expect.objectContaining({
        endpoint: "market-depth/0x0000000000000000000000000000000000000001/7",
        includeWalletAuth: false,
      })
    );
  });

  it("distinguishes an empty completed snapshot from unavailable data", async () => {
    fetchMock.mockResolvedValueOnce(
      depth({ books: [], orders: [], order_count: 0, criteria_order_count: 0 })
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
          "No quoted depth was returned in the completed snapshot."
        )
      ).toBeInTheDocument()
    );

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
          "A completed market snapshot is not available for this token."
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
      expect(screen.getByText("Order details (14)")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByText("Order details (14)"));
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
    fireEvent.click(screen.getByText("Order details (1)"));
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
