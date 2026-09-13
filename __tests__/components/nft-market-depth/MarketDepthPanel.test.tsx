import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { useState, type ReactElement } from "react";
import MarketDepthPanel from "@/components/nft-market-depth/MarketDepthPanel";
import NftDetailTabSection from "@/components/nft-navigation/NftDetailTabSection";
import { commonApiFetch } from "@/services/api/common-api";
import { revealMarketDepth } from "@/components/nft-market-depth/market-depth-disclosure";

function renderOpenDepth(ui: ReactElement) {
  const result = render(ui);
  fireEvent.click(screen.getByRole("button", { name: "Listings & offers" }));
  return result;
}

jest.mock("@/hooks/useNftPurchasingVisibility", () => ({
  useNftPurchasingVisibility: () => ({ hideNftPurchasing: false }),
}));

jest.mock("@/services/api/common-api", () => ({
  commonApiFetch: jest.fn(),
  getStructuredApiErrorStatus: (error: unknown) =>
    typeof error === "object" &&
    error !== null &&
    "status" in error &&
    typeof error.status === "number"
      ? error.status
      : undefined,
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
  const ethAsk = {
    order_key: "order-ask",
    order_id: "order-ask",
    source: "opensea",
    protocol: "seaport",
    collection_slug: "collection",
    side: "ask",
    scope: "token",
    maker: "0xask-maker",
    token_id: "7",
    original_quantity: "2",
    remaining_quantity: "2",
    currency: {
      address: "0x0000000000000000000000000000000000000000",
      symbol: "ETH",
      decimals: 18,
    },
    total_price_raw: "2500000000000000000",
    unit_price: "1.25",
    starts_at: "2026-09-10T11:00:00.000Z",
    expires_at: "2026-09-12T11:00:00.000Z",
    observed_at: "2026-09-10T12:00:00.000Z",
    applicability: "token",
    liquidity_group: "ask-group",
    caveats: [],
  };
  const wethBid = {
    ...ethAsk,
    order_key: "order-bid",
    order_id: "order-bid",
    side: "bid",
    scope: "token",
    maker: "0xbid-maker",
    currency: {
      address: "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2",
      symbol: "WETH",
      decimals: 18,
    },
    unit_price: "1.1",
    total_price_raw: "1100000000000000000",
    liquidity_group: "bid-group",
  };
  const criteriaOrder = {
    ...ethAsk,
    order_key: "order-criteria",
    order_id: "order-criteria",
    scope: "collection",
    maker: "0xcriteria-maker",
    token_id: null,
    unit_price: null,
    applicability: "criteria_unverified",
    liquidity_group: "criteria-group",
  };
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
    orders: [ethAsk, wethBid, criteriaOrder],
    order_count: 3,
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

  it("keeps the price summary visible and tables closed until requested, preserving expanded rows on collapse", async () => {
    fetchMock.mockResolvedValue(depth());
    render(<MarketDepthPanel contract="0x1" tokenId="7" />);
    expect(await screen.findByText("Lowest listing · ETH")).toBeVisible();
    const heading = screen.getByRole("button", { name: "Listings & offers" });
    expect(heading).toHaveAttribute("aria-expanded", "false");
    expect(
      screen.queryByRole("button", { name: "Listings at 1.25 ETH" })
    ).not.toBeInTheDocument();
    fireEvent.click(heading);
    const level = screen.getByRole("button", { name: "Listings at 1.25 ETH" });
    fireEvent.click(level);
    expect(level).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(heading);
    expect(heading).toHaveFocus();
    expect(level).not.toBeVisible();
    fireEvent.click(heading);
    expect(screen.getByRole("button", { name: "Listings at 1.25 ETH" })).toBe(
      level
    );
    expect(level).toHaveAttribute("aria-expanded", "true");
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("opens an embedded book immediately and retains row state across tab changes", async () => {
    fetchMock.mockResolvedValue(depth());
    const onReveal = jest.fn();
    const view = (active: boolean) => (
      <MarketDepthPanel
        contract="0x1"
        tokenId="7"
        embedded
        active={active}
        onReveal={onReveal}
      />
    );
    const { rerender } = render(view(true));
    const row = await screen.findByRole("button", {
      name: "Listings at 1.25 ETH",
    });
    expect(
      screen.queryByRole("button", { name: "Listings & offers" })
    ).not.toBeInTheDocument();
    fireEvent.click(row);
    rerender(view(false));
    expect(row).not.toBeVisible();
    const panel = screen.getByRole("region", { hidden: true });
    panel.scrollIntoView = jest.fn();
    act(() => revealMarketDepth("0x1", "7"));
    expect(onReveal).toHaveBeenCalledTimes(1);
    expect(panel).not.toHaveFocus();
    rerender(view(true));
    expect(panel).toHaveFocus();
    expect(panel.scrollIntoView).toHaveBeenCalledWith({
      block: "start",
      behavior: expect.stringMatching(/smooth|instant/),
    });
    expect(row).toBeVisible();
    expect(row).toHaveAttribute("aria-expanded", "true");
    expect(fetchMock).toHaveBeenCalledTimes(1);
    rerender(view(false));
    const outside = document.createElement("button");
    document.body.append(outside);
    outside.focus();
    rerender(view(true));
    expect(outside).toHaveFocus();
    outside.remove();
  });

  it("keeps the owning tab navigation in view when revealing an already active market", async () => {
    fetchMock.mockResolvedValue(depth());
    render(
      <NftDetailTabSection
        activeFocus="listings-and-offers"
        locale="en-US"
        navigation={<button type="button">Overview</button>}
        persistentContent={
          <MarketDepthPanel contract="0x1" tokenId="7" embedded />
        }
      >
        {null}
      </NftDetailTabSection>
    );
    await screen.findByRole("button", { name: "Listings at 1.25 ETH" });
    const panel = screen.getByRole("region", { name: "Listings & offers" });
    const tab = screen.getByRole("button", { name: "Overview" });
    const section = tab.closest<HTMLElement>("[data-nft-detail-tab-section]");
    expect(section).not.toBeNull();
    if (!section) throw new Error("Missing owning tab section");
    const scrollSection = jest.fn();
    section.scrollIntoView = scrollSection;
    const scrollPanel = jest.fn();
    panel.scrollIntoView = scrollPanel;
    for (const expectedCalls of [1, 2]) {
      tab.focus();
      act(() => revealMarketDepth("0x1", "7"));
      expect(panel).toHaveFocus();
      expect(scrollSection).toHaveBeenCalledTimes(expectedCalls);
      expect(scrollSection).toHaveBeenLastCalledWith({
        block: "start",
        behavior: expect.stringMatching(/smooth|instant/),
      });
      expect(scrollPanel).not.toHaveBeenCalled();
    }
  });

  it("opens only the matching NFT and focuses its heading with reduced-motion-aware scrolling", async () => {
    fetchMock.mockResolvedValue(depth());
    const scroll = jest.fn();
    const { rerender, unmount } = render(
      <MarketDepthPanel contract="0xAbC" tokenId="7" />
    );
    const heading = screen.getByRole("button", { name: "Listings & offers" });
    heading.scrollIntoView = scroll;
    await screen.findByText("Lowest listing · ETH");
    act(() => revealMarketDepth("0xabc", "8"));
    expect(heading).toHaveAttribute("aria-expanded", "false");
    act(() => revealMarketDepth("0xabc", "7"));
    expect(heading).toHaveAttribute("aria-expanded", "true");
    expect(heading).toHaveFocus();
    expect(scroll).toHaveBeenCalledWith({
      block: "start",
      behavior: expect.stringMatching(/smooth|instant/),
    });
    rerender(<MarketDepthPanel contract="0xAbC" tokenId="8" />);
    expect(heading).toHaveAttribute("aria-expanded", "false");
    act(() => revealMarketDepth("0xabc", "7"));
    expect(heading).toHaveAttribute("aria-expanded", "false");
    unmount();
    act(() => revealMarketDepth("0xabc", "8"));
    expect(scroll).toHaveBeenCalledTimes(1);
  });

  it("shows a safe error and does not refetch when only the locale changes", async () => {
    fetchMock.mockRejectedValue(new Error("private provider diagnostic"));
    const { rerender } = renderOpenDepth(
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

  it("keeps currencies separate and labels criteria applicability", async () => {
    fetchMock.mockResolvedValue(depth());

    renderOpenDepth(
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
    expect(
      screen.getByRole("button", { name: "Listings at 1.25 ETH" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Offers at 1.1 WETH" })
    ).toBeInTheDocument();
    expect(
      screen.getByText("Orders requiring verification (1)")
    ).toBeInTheDocument();
    expect(
      screen.getByText("OpenSea listings and offers captured for this card.")
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Source: OpenSea. Prices and availability can change. Quoted quantities may overlap."
      )
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Individual listings and offers")
    ).not.toBeInTheDocument();
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
            order_count: 3,
            unsupported_count: 2,
            schema_version: 1,
            normalizer_version: "1",
          },
        ],
      })
    );

    renderOpenDepth(
      <MarketDepthPanel contract="0x1" tokenId="7" locale="en-US" />
    );

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

      renderOpenDepth(
        <MarketDepthPanel contract="0x1" tokenId="7" locale="en-US" />
      );

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

    const { container } = renderOpenDepth(
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

    renderOpenDepth(
      <MarketDepthPanel
        contract="0x0000000000000000000000000000000000000001"
        tokenId="7"
        actions={<button type="button">Collect this card</button>}
      />
    );

    const title = screen.getByRole("heading", {
      name: "Listings & offers",
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

    const { container } = renderOpenDepth(
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

    renderOpenDepth(
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

  it("aborts a pending first page when refreshKey changes and preserves the action slot", async () => {
    let resolveOldPage: ((page: ReturnType<typeof depth>) => void) | undefined;
    const pendingOldPage = new Promise<ReturnType<typeof depth>>((resolve) => {
      resolveOldPage = resolve;
    });
    fetchMock
      .mockReturnValueOnce(pendingOldPage)
      .mockResolvedValueOnce(depth());

    const { rerender } = renderOpenDepth(
      <MarketDepthPanel
        contract="0x1"
        tokenId="7"
        locale="en-US"
        refreshKey={0}
        actions={(refresh) => <StatefulAction refresh={refresh} />}
      />
    );
    const actionSlot = screen.getByTestId("market-depth-action-slot");
    const oldPageSignal = fetchMock.mock.calls[0]?.[0].signal;
    rerender(
      <MarketDepthPanel
        contract="0x1"
        tokenId="7"
        locale="en-US"
        refreshKey={1}
        actions={(refresh) => <StatefulAction refresh={refresh} />}
      />
    );

    await waitFor(() => expect(oldPageSignal?.aborted).toBe(true));
    expect(screen.getByTestId("market-depth-action-slot")).toBe(actionSlot);
    resolveOldPage?.(
      depth({
        books: [
          {
            ...depth().books[0],
            asks: [
              {
                unit_price: "99.99",
                quantity: "1",
                cumulative_quantity: "1",
                order_count: 1,
              },
            ],
            best_ask: "99.99",
          },
          depth().books[1],
        ],
      })
    );

    await screen.findByRole("button", { name: "Listings at 1.25 ETH" });
    expect(
      screen.queryByRole("button", { name: "Listings at 99.99 ETH" })
    ).not.toBeInTheDocument();
  });

  it("aborts pending price-row details and ignores their late result on refresh", async () => {
    let resolveOldPage: ((page: ReturnType<typeof depth>) => void) | undefined;
    const pendingOldPage = new Promise<ReturnType<typeof depth>>((resolve) => {
      resolveOldPage = resolve;
    });
    const initial = depth({
      orders: [depth().orders[0]],
      order_count: 3,
      next: "cursor-1",
    });
    const refreshed = depth({
      books: [
        {
          ...depth().books[0],
          asks: [
            {
              unit_price: "3.33",
              quantity: "1",
              cumulative_quantity: "1",
              order_count: 1,
            },
          ],
          best_ask: "3.33",
        },
        depth().books[1],
      ],
      orders: [
        { ...depth().orders[0], unit_price: "3.33" },
        depth().orders[1],
        depth().orders[2],
      ],
      order_count: 3,
      next: null,
    });
    fetchMock
      .mockResolvedValueOnce(initial)
      .mockReturnValueOnce(pendingOldPage)
      .mockResolvedValueOnce(refreshed);

    renderOpenDepth(
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

    await screen.findByRole("button", { name: "Listings at 1.25 ETH" });
    fireEvent.click(
      screen.getByRole("button", { name: "Listings at 1.25 ETH" })
    );
    const oldPageSignal = fetchMock.mock.calls[1]?.[0].signal;
    fireEvent.click(screen.getByRole("button", { name: "Refresh market" }));

    await waitFor(() => expect(oldPageSignal?.aborted).toBe(true));
    await act(async () => {
      resolveOldPage?.(
        depth({
          orders: [depth().orders[1], depth().orders[2]],
          order_count: 3,
          next: null,
        })
      );
    });
    await screen.findByRole("button", { name: "Listings at 3.33 ETH" });
    expect(screen.queryByText("99.99")).not.toBeInTheDocument();
  });

  it("uses the action callback to recover from the initial error", async () => {
    fetchMock
      .mockRejectedValueOnce(new Error("private provider diagnostic"))
      .mockResolvedValueOnce(depth());

    renderOpenDepth(
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
        orders: [depth().orders[2]],
        order_count: 1,
        criteria_order_count: 1,
        snapshots: [
          {
            id: "snapshot-1",
            source: "opensea",
            collection_slug: "collection",
            started_at: "2026-09-10T11:59:00.000Z",
            completed_at: "2026-09-10T12:00:00.000Z",
            order_count: 1,
            unsupported_count: 1,
            schema_version: 1,
            normalizer_version: "1",
          },
        ],
      })
    );

    const { rerender } = renderOpenDepth(
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
      screen.getByText("Orders requiring verification (1)")
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

  it("loads all price-row pages before showing order details", async () => {
    let resolveFirstNextPage:
      | ((page: ReturnType<typeof depth>) => void)
      | undefined;
    let resolveSecondNextPage:
      | ((page: ReturnType<typeof depth>) => void)
      | undefined;
    const pendingFirstNextPage = new Promise<ReturnType<typeof depth>>(
      (resolve) => {
        resolveFirstNextPage = resolve;
      }
    );
    const pendingSecondNextPage = new Promise<ReturnType<typeof depth>>(
      (resolve) => {
        resolveSecondNextPage = resolve;
      }
    );
    fetchMock
      .mockResolvedValueOnce(
        depth({
          orders: [depth().orders[0]],
          order_count: 3,
          next: "cursor-1",
        })
      )
      .mockReturnValueOnce(pendingFirstNextPage)
      .mockReturnValueOnce(pendingSecondNextPage);

    renderOpenDepth(
      <MarketDepthPanel contract="0x1" tokenId="7" locale="en-US" />
    );

    const priceButton = await screen.findByRole("button", {
      name: "Listings at 1.25 ETH",
    });
    fireEvent.click(priceButton);
    expect(priceButton).toHaveAttribute("aria-expanded", "true");
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(
      screen.queryByRole("list", { name: "Orders at this price" })
    ).not.toBeInTheDocument();

    resolveFirstNextPage?.(
      depth({
        orders: [depth().orders[1]],
        order_count: 3,
        next: "cursor-2",
      })
    );
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(3));
    expect(
      screen.queryByRole("list", { name: "Orders at this price" })
    ).not.toBeInTheDocument();
    resolveSecondNextPage?.(
      depth({
        orders: [depth().orders[2]],
        order_count: 3,
        next: null,
      })
    );
    await screen.findByRole("list", { name: "Orders at this price" });
    expect(
      screen.getByRole("list", { name: "Orders at this price" })
    ).toBeInTheDocument();
    expect(screen.getByText("Quoted quantity")).toBeInTheDocument();
    expect(screen.getByText("Expires")).toBeInTheDocument();
    fireEvent.click(priceButton);
    fireEvent.click(priceButton);
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(
      screen.queryByText("Individual listings and offers")
    ).not.toBeInTheDocument();
  });

  it("restarts once after a structured 400 and then drains the new snapshot", async () => {
    const restartedPage = depth({
      orders: [depth().orders[0]],
      order_count: 3,
      next: "cursor-2",
    });
    fetchMock
      .mockResolvedValueOnce(
        depth({
          orders: [depth().orders[0]],
          order_count: 3,
          next: "cursor-1",
        })
      )
      .mockRejectedValueOnce(
        Object.assign(new Error("book changed"), { status: 400 })
      )
      .mockResolvedValueOnce(restartedPage)
      .mockResolvedValueOnce(
        depth({
          orders: [depth().orders[1], depth().orders[2]],
          order_count: 3,
          next: null,
        })
      );

    renderOpenDepth(
      <MarketDepthPanel contract="0x1" tokenId="7" locale="en-US" />
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Listings at 1.25 ETH" })
    );

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(4));
    expect(fetchMock.mock.calls[1]?.[0]).toEqual(
      expect.objectContaining({
        params: { page_size: "40", cursor: "cursor-1" },
      })
    );
    expect(fetchMock.mock.calls[2]?.[0]).toEqual(
      expect.objectContaining({ params: { page_size: "40" } })
    );
    expect(fetchMock.mock.calls[3]?.[0]).toEqual(
      expect.objectContaining({
        params: { page_size: "40", cursor: "cursor-2" },
      })
    );
    await screen.findByRole("list", { name: "Orders at this price" });
    fireEvent.click(screen.getByText("Order information"));
    expect(screen.getByText("0xask-maker")).toBeInTheDocument();
  });

  it("shows generic retry details after a persistent pagination failure", async () => {
    fetchMock
      .mockResolvedValueOnce(
        depth({
          orders: [depth().orders[0]],
          order_count: 3,
          next: "cursor-1",
        })
      )
      .mockRejectedValueOnce(
        Object.assign(new Error("private provider diagnostic"), { status: 400 })
      )
      .mockRejectedValueOnce(
        Object.assign(new Error("private provider diagnostic"), { status: 400 })
      );

    renderOpenDepth(
      <MarketDepthPanel contract="0x1" tokenId="7" locale="en-US" />
    );
    fireEvent.click(
      await screen.findByRole("button", { name: "Listings at 1.25 ETH" })
    );

    expect(
      await screen.findByRole("button", { name: "Retry details" })
    ).toBeInTheDocument();
    expect(screen.getByRole("alert")).toBeInTheDocument();
    expect(
      screen.queryByText("private provider diagnostic")
    ).not.toBeInTheDocument();
  });

  it("does not merge a pending price-row page after the card changes", async () => {
    let resolvePendingPage:
      | ((page: ReturnType<typeof depth>) => void)
      | undefined;
    const pendingPage = new Promise<ReturnType<typeof depth>>((resolve) => {
      resolvePendingPage = resolve;
    });
    fetchMock
      .mockResolvedValueOnce(
        depth({
          orders: [depth().orders[0]],
          order_count: 3,
          next: "cursor-1",
        })
      )
      .mockReturnValueOnce(pendingPage)
      .mockResolvedValueOnce(
        depth({
          token_id: "8",
          books: [],
          orders: [],
          order_count: 0,
          criteria_order_count: 0,
          next: null,
        })
      );

    const { rerender } = renderOpenDepth(
      <MarketDepthPanel
        contract="0x0000000000000000000000000000000000000001"
        tokenId="7"
      />
    );

    fireEvent.click(
      await screen.findByRole("button", { name: "Listings at 1.25 ETH" })
    );
    rerender(
      <MarketDepthPanel
        contract="0x0000000000000000000000000000000000000001"
        tokenId="8"
      />
    );
    resolvePendingPage?.(
      depth({ orders: [depth().orders[1], depth().orders[2]], next: null })
    );

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith(
        expect.objectContaining({
          endpoint: "market-depth/0x0000000000000000000000000000000000000001/8",
        })
      )
    );
    expect(
      screen.queryByRole("button", { name: "Listings at 1.25 ETH" })
    ).not.toBeInTheDocument();
  });
});
