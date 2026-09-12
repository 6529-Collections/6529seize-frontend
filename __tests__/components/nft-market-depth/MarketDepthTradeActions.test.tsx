import {
  MarketDepthOrderAction,
  MarketDepthTradeProvider,
} from "@/components/nft-market-depth/MarketDepthTradeActions";
import MarketDepthPriceLevels from "@/components/nft-market-depth/MarketDepthPriceLevels";
import { MarketDepthLevelAction } from "@/components/nft-market-depth/MarketDepthOrderAction";
import {
  MARKET_SEAPORT,
  MARKET_WETH,
  MARKET_ZERO,
} from "@/components/collect/market-validation";
import { MEMES_CONTRACT } from "@/constants/constants";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import {
  ApiMarketOrderApplicabilityEnum,
  ApiMarketOrderScopeEnum,
  ApiMarketOrderSideEnum,
  type ApiMarketOrder,
} from "@/generated/models/ApiMarketOrder";
import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState, type ReactNode } from "react";

const mockFetchAssets = jest.fn();
const mockFetchExactOrder = jest.fn();
const mockFetchOwnership = jest.fn();
const mockBatch = jest.fn();
const mockTrade = jest.fn();
const mockSeizeConnect = jest.fn();
let mockHideNftPurchasing = false;
let mockAuth = {
  connectedProfile: {
    id: "profile-1",
    wallets: [{ wallet: "0x3333333333333333333333333333333333333333" }],
  },
  activeProfileProxy: null,
  isAuthenticated: true,
};
let mockConnection = {
  address: "0x3333333333333333333333333333333333333333",
  seizeConnect: mockSeizeConnect,
};

jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockConnection,
}));
jest.mock("@/components/common/NftPurchasingGate", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => children,
}));
jest.mock("@/hooks/useNftPurchasingVisibility", () => ({
  useNftPurchasingVisibility: () => ({
    hideNftPurchasing: mockHideNftPurchasing,
  }),
}));
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectAssets: (...args: unknown[]) => mockFetchAssets(...args),
  fetchCollectAssetOwnership: (...args: unknown[]) =>
    mockFetchOwnership(...args),
}));
jest.mock("@/services/api/market-api", () => ({
  fetchExactMarketOrder: (...args: unknown[]) => mockFetchExactOrder(...args),
}));
jest.mock("@/components/collect/CollectBatchController", () => ({
  __esModule: true,
  default: (props: unknown) => {
    mockBatch(props);
    return <div data-testid="batch-review" />;
  },
}));
jest.mock("@/components/collect/CollectTradeController", () => ({
  __esModule: true,
  default: (props: {
    initialOrder: ApiMarketTradeOrder;
    onClose: () => void;
  }) => {
    mockTrade(props);
    return (
      <div
        data-testid="offer-review"
        data-order-hash={props.initialOrder.identity.order_hash}
      >
        <button type="button" onClick={props.onClose}>
          Close offer review
        </button>
      </div>
    );
  },
}));

const HASH = `0x${"a".repeat(64)}`;
const SECOND_HASH = `0x${"b".repeat(64)}`;
const MAKER = "0x1111111111111111111111111111111111111111";
const ASSET_KEY = `1:${MEMES_CONTRACT.toLowerCase()}:8`;
const NOW = Math.floor(Date.now() / 1000);
const asset: ApiCollectAsset = {
  asset_key: ASSET_KEY,
  chain_id: 1,
  contract: MEMES_CONTRACT,
  token_id: "8",
  family: ApiCollectFamily.Memes,
  name: "Card 8",
  image_url: null,
  artist_ids: [],
  season: 1,
  traits: [],
  hodl_rate: null,
  tdh_eligible: true,
};

function executableOrder(
  overrides: Partial<ApiMarketTradeOrder> = {}
): ApiMarketTradeOrder {
  return {
    identity: { protocol_address: MARKET_SEAPORT, order_hash: HASH },
    asset_key: ASSET_KEY,
    maker: MAKER,
    side: ApiMarketTradeOrderSideEnum.Listing,
    quantity: "3",
    available_quantity: "3",
    purchase_quantity: "1",
    quantity_step: "1",
    currency: MARKET_ZERO,
    total_wei: "300",
    net_wei: "270",
    fees: [
      {
        recipient: "0x2222222222222222222222222222222222222222",
        amount_wei: "30",
      },
    ],
    start_time: String(NOW - 60),
    end_time: String(NOW + 3600),
    recipient: MAKER,
    ...overrides,
  };
}

function depthOrder(overrides: Partial<ApiMarketOrder> = {}): ApiMarketOrder {
  return {
    order_key: "depth-1",
    order_id: HASH,
    source: "opensea",
    protocol: MARKET_SEAPORT,
    collection_slug: "the-memes-by-6529",
    side: ApiMarketOrderSideEnum.Ask,
    scope: ApiMarketOrderScopeEnum.Token,
    maker: MAKER,
    token_id: "8",
    original_quantity: "3",
    remaining_quantity: "3",
    currency: { address: MARKET_ZERO, symbol: "ETH", decimals: 18 },
    total_price_raw: "300",
    unit_price: "0.0000000000000001",
    starts_at: new Date((NOW - 60) * 1000),
    expires_at: new Date((NOW + 3600) * 1000),
    observed_at: new Date(),
    applicability: ApiMarketOrderApplicabilityEnum.Token,
    liquidity_group: "maker-asset-eth",
    caveats: [],
    ...overrides,
  };
}

function renderAction(order: ApiMarketOrder) {
  return render(
    <MarketDepthTradeProvider
      contract={MEMES_CONTRACT}
      tokenId="8"
      locale="en-US"
      onMarketChange={jest.fn()}
    >
      <MarketDepthOrderAction order={order} locale="en-US" />
    </MarketDepthTradeProvider>
  );
}

function renderLevel(
  orders: readonly ApiMarketOrder[],
  expectedCount = orders.length,
  isLoading = false
) {
  const reference = orders[0] ?? depthOrder();
  const onLoadOrders = jest.fn();
  const view = render(
    <MarketDepthTradeProvider
      contract={MEMES_CONTRACT}
      tokenId="8"
      locale="en-US"
      onMarketChange={jest.fn()}
    >
      <MarketDepthPriceLevels
        side={reference.side === ApiMarketOrderSideEnum.Ask ? "ask" : "bid"}
        levels={[
          {
            unit_price: reference.unit_price!,
            quantity: "3",
            cumulative_quantity: "3",
            order_count: expectedCount,
          },
        ]}
        currency={reference.currency}
        currencyLabel={reference.currency.symbol}
        locale="en-US"
        orders={orders}
        isLoading={isLoading}
        error={null}
        onLoadOrders={onLoadOrders}
        onRefresh={jest.fn()}
      />
    </MarketDepthTradeProvider>
  );
  return { ...view, onLoadOrders };
}

function offerRow(orderHash: string, orderKey: string): ApiMarketOrder {
  return depthOrder({
    order_id: orderHash,
    order_key: orderKey,
    side: ApiMarketOrderSideEnum.Bid,
    currency: { address: MARKET_WETH, symbol: "WETH", decimals: 18 },
  });
}

function renderOfferRows(rows: readonly ApiMarketOrder[]) {
  return render(
    <MarketDepthTradeProvider
      contract={MEMES_CONTRACT}
      tokenId="8"
      locale="en-US"
      onMarketChange={jest.fn()}
    >
      {rows.map((row) => (
        <MarketDepthOrderAction
          key={row.order_key}
          order={row}
          locale="en-US"
        />
      ))}
    </MarketDepthTradeProvider>
  );
}

function deferExactOrders() {
  const resolvers = new Map<string, (order: ApiMarketTradeOrder) => void>();
  mockFetchExactOrder.mockImplementation(
    (orderHash: string) =>
      new Promise<ApiMarketTradeOrder>((resolve) => {
        resolvers.set(orderHash, resolve);
      })
  );
  return (orderHash: string, order: ApiMarketTradeOrder) => {
    const resolve = resolvers.get(orderHash);
    if (!resolve) throw new Error(`MISSING_DEFERRED_ORDER_${orderHash}`);
    resolve(order);
  };
}

function ownedAsset() {
  mockFetchOwnership.mockResolvedValue({
    account: { profile_id: "profile-1" },
    requirements: [
      {
        holdings: [
          {
            asset_key: ASSET_KEY,
            wallet: mockConnection.address,
            quantity: "3",
          },
        ],
      },
    ],
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockHideNftPurchasing = false;
  mockAuth = {
    connectedProfile: {
      id: "profile-1",
      wallets: [{ wallet: "0x3333333333333333333333333333333333333333" }],
    },
    activeProfileProxy: null,
    isAuthenticated: true,
  };
  mockConnection = {
    address: "0x3333333333333333333333333333333333333333",
    seizeConnect: mockSeizeConnect,
  };
  mockFetchAssets.mockResolvedValue({ data: [asset], next: null, count: 1 });
  mockFetchExactOrder.mockResolvedValue(executableOrder());
});

describe("MarketDepthTradeActions", () => {
  it("collects a single order from its collapsed price row with keyboard access", async () => {
    const user = userEvent.setup();
    const { onLoadOrders } = renderLevel([depthOrder()]);
    const disclosure = screen.getByRole("button", { name: /^Listings at / });
    const collect = screen.getByRole("button", { name: "Collect" });
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    expect(collect).toHaveAttribute("aria-pressed", "false");
    await user.tab();
    expect(disclosure).toHaveFocus();
    await user.tab();
    expect(collect).toHaveFocus();
    await user.keyboard("{Enter}");
    await screen.findByRole("textbox", { name: "Quantity" });
    expect(screen.getByRole("button", { name: "Remove" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(disclosure).toHaveAttribute("aria-expanded", "false");
    expect(onLoadOrders).not.toHaveBeenCalled();
    expect(mockFetchExactOrder).toHaveBeenCalledTimes(1);
    expect(mockFetchExactOrder).toHaveBeenCalledWith(
      HASH,
      MARKET_SEAPORT,
      ASSET_KEY,
      ApiMarketTradeOrderSideEnum.Listing,
      expect.any(AbortSignal)
    );
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it("opens the existing fixed-order sale review directly from Sell", async () => {
    ownedAsset();
    mockFetchExactOrder.mockResolvedValue(
      executableOrder({
        side: ApiMarketTradeOrderSideEnum.Offer,
        currency: MARKET_WETH,
      })
    );
    const { onLoadOrders } = renderLevel([offerRow(HASH, "offer")]);
    fireEvent.click(screen.getByRole("button", { name: "Sell" }));
    await screen.findByTestId("offer-review");
    expect(screen.getByRole("button", { name: /^Offers at / })).toHaveAttribute(
      "aria-expanded",
      "false"
    );
    expect(onLoadOrders).not.toHaveBeenCalled();
    expect(mockTrade.mock.calls.at(-1)?.[0]).toMatchObject({
      action: "accept",
      fixedOrder: true,
      initialOrder: { identity: { order_hash: HASH } },
    });
  });

  it("lets the collector choose an exact order at a shared price without choosing one implicitly", async () => {
    const second = depthOrder({ order_key: "second", order_id: SECOND_HASH });
    mockFetchExactOrder.mockResolvedValue(
      executableOrder({
        identity: { protocol_address: MARKET_SEAPORT, order_hash: SECOND_HASH },
      })
    );
    renderLevel([depthOrder(), second]);
    fireEvent.click(screen.getByRole("button", { name: "Collect" }));
    expect(mockFetchExactOrder).not.toHaveBeenCalled();
    const choices = screen.getByRole("list", { name: "Orders at this price" });
    const actions = within(choices).getAllByRole("button", { name: "Collect" });
    expect(actions).toHaveLength(2);
    fireEvent.click(actions[1]!);
    await screen.findByRole("textbox", { name: "Quantity" });
    expect(mockFetchExactOrder).toHaveBeenCalledTimes(1);
    expect(mockFetchExactOrder).toHaveBeenCalledWith(
      SECOND_HASH,
      MARKET_SEAPORT,
      ASSET_KEY,
      ApiMarketTradeOrderSideEnum.Listing,
      expect.any(AbortSignal)
    );
  });

  it("keeps a missing-order action as a disclosure until the exact order is known", () => {
    const { onLoadOrders } = renderLevel([], 1, true);
    fireEvent.click(screen.getByRole("button", { name: "Collect" }));
    expect(onLoadOrders).toHaveBeenCalledTimes(1);
    expect(screen.getByText("Loading order details…")).toBeInTheDocument();
    expect(mockFetchExactOrder).not.toHaveBeenCalled();
  });

  it.each([false, true])(
    "preserves keyboard focus when single-order details arrive (moved away: %s)",
    async (movedAway) => {
      const user = userEvent.setup();
      const order = depthOrder();
      let resolveDetails!: () => void;
      const details = new Promise<void>((resolve) => {
        resolveDetails = resolve;
      });
      function Harness() {
        const [orders, setOrders] = useState<readonly ApiMarketOrder[]>([]);
        return (
          <>
            <MarketDepthTradeProvider
              contract={MEMES_CONTRACT}
              tokenId="8"
              locale="en-US"
              onMarketChange={jest.fn()}
            >
              <MarketDepthPriceLevels
                side="ask"
                levels={[
                  {
                    unit_price: order.unit_price!,
                    quantity: "3",
                    cumulative_quantity: "3",
                    order_count: 1,
                  },
                ]}
                currency={order.currency}
                currencyLabel="ETH"
                locale="en-US"
                orders={orders}
                isLoading={orders.length === 0}
                error={null}
                onLoadOrders={() => {
                  void details.then(() => setOrders([order]));
                }}
                onRefresh={jest.fn()}
              />
            </MarketDepthTradeProvider>
            <button type="button">Elsewhere</button>
          </>
        );
      }
      render(<Harness />);
      await user.tab();
      await user.tab();
      const disclosureAction = screen.getByRole("button", { name: "Collect" });
      expect(disclosureAction).toHaveFocus();
      await user.keyboard("{Enter}");
      expect(screen.getByText("Loading order details…")).toBeInTheDocument();
      if (movedAway) {
        await user.tab();
        expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
      }
      await act(async () => resolveDetails());
      const exactAction = screen.getByRole("button", { name: "Collect" });
      expect(exactAction).not.toBe(disclosureAction);
      expect(mockFetchExactOrder).not.toHaveBeenCalled();
      if (movedAway) {
        expect(screen.getByRole("button", { name: "Elsewhere" })).toHaveFocus();
      } else {
        expect(exactAction).toHaveFocus();
        await user.keyboard("{Enter}");
        await screen.findByRole("textbox", { name: "Quantity" });
        expect(mockFetchExactOrder).toHaveBeenCalledWith(
          HASH,
          MARKET_SEAPORT,
          ASSET_KEY,
          ApiMarketTradeOrderSideEnum.Listing,
          expect.any(AbortSignal)
        );
      }
    }
  );

  it("does not restore delayed action focus after a non-executable offer and a deliberate focus move", async () => {
    const user = userEvent.setup();
    const exact = offerRow(HASH, "offer");
    const content = (order?: ApiMarketOrder) => (
      <MarketDepthTradeProvider
        contract={MEMES_CONTRACT}
        tokenId="8"
        locale="en-US"
        onMarketChange={jest.fn()}
      >
        <MarketDepthLevelAction
          order={order}
          side="bid"
          locale="en-US"
          open
          panelId="offer-details"
          onClick={jest.fn()}
        />
        <button type="button">Elsewhere</button>
      </MarketDepthTradeProvider>
    );
    const view = render(content());
    await user.tab();
    expect(screen.getByRole("button", { name: "Sell" })).toHaveFocus();
    view.rerender(
      content({
        ...exact,
        scope: ApiMarketOrderScopeEnum.Trait,
        applicability: ApiMarketOrderApplicabilityEnum.CriteriaUnverified,
        token_id: null,
      })
    );
    expect(screen.queryByRole("button", { name: "Sell" })).toBeNull();
    await user.tab();
    const elsewhere = screen.getByRole("button", { name: "Elsewhere" });
    expect(elsewhere).toHaveFocus();
    view.rerender(content(exact));
    expect(screen.getByRole("button", { name: "Sell" })).toBeInTheDocument();
    expect(elsewhere).toHaveFocus();
    expect(mockFetchExactOrder).not.toHaveBeenCalled();
  });

  it("omits the action column and trading controls when purchasing is restricted", () => {
    mockHideNftPurchasing = true;
    renderLevel([depthOrder()]);
    expect(screen.queryByRole("columnheader", { name: "Action" })).toBeNull();
    expect(screen.queryByRole("button", { name: "Collect" })).toBeNull();
    fireEvent.click(screen.getByRole("button", { name: /^Listings at / }));
    expect(screen.getByText("Order information")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Collect" })).toBeNull();
    expect(mockFetchExactOrder).not.toHaveBeenCalled();
  });

  it("does not treat a mismatched advertised single-order count as an exact order", () => {
    renderLevel(
      [
        depthOrder(),
        depthOrder({ order_key: "second", order_id: SECOND_HASH }),
      ],
      1
    );
    fireEvent.click(screen.getByRole("button", { name: "Collect" }));
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Order details have changed"
    );
    expect(mockFetchExactOrder).not.toHaveBeenCalled();
  });

  it("keeps a single row action unique when its order information is expanded", () => {
    renderLevel([depthOrder()]);
    fireEvent.click(screen.getByRole("button", { name: /^Listings at / }));
    expect(screen.getAllByRole("button", { name: "Collect" })).toHaveLength(1);
    expect(screen.getByText("Order information")).toBeInTheDocument();
  });

  it("rebinds an exact listing, accepts a valid quantity, and checks it again before one batch review", async () => {
    renderAction(depthOrder());
    fireEvent.click(screen.getByRole("button", { name: "Collect" }));
    const quantity = await screen.findByRole("textbox", { name: "Quantity" });
    fireEvent.change(quantity, { target: { value: "2" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Review selected listings (1)" })
    );
    await screen.findByTestId("batch-review");

    expect(mockFetchExactOrder).toHaveBeenCalledTimes(2);
    expect(mockFetchExactOrder).toHaveBeenNthCalledWith(
      1,
      HASH,
      MARKET_SEAPORT,
      ASSET_KEY,
      ApiMarketTradeOrderSideEnum.Listing,
      expect.any(AbortSignal)
    );
    expect(mockBatch.mock.calls.at(-1)?.[0]).toMatchObject({
      items: [{ asset, order: executableOrder(), quantity: "2" }],
    });
  });

  it("associates an invalid quantity message until the value is corrected", async () => {
    renderAction(depthOrder());
    fireEvent.click(screen.getByRole("button", { name: "Collect" }));
    const quantity = await screen.findByRole("textbox", { name: "Quantity" });

    fireEvent.change(quantity, { target: { value: "0" } });
    const error = screen.getByRole("alert");
    expect(quantity).toHaveAttribute("aria-invalid", "true");
    expect(quantity).toHaveAttribute("aria-describedby", error.id);

    fireEvent.change(quantity, { target: { value: "2" } });
    expect(quantity).toHaveAttribute("aria-invalid", "false");
    expect(quantity).not.toHaveAttribute("aria-describedby");
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("never substitutes a changed exact response", async () => {
    mockFetchExactOrder.mockResolvedValue(
      executableOrder({ maker: "0x4444444444444444444444444444444444444444" })
    );
    renderAction(depthOrder());
    fireEvent.click(screen.getByRole("button", { name: "Collect" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "This order is no longer available as shown"
    );
    expect(screen.queryByRole("textbox", { name: "Quantity" })).toBeNull();
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it("keeps unverified trait offers unavailable without requesting a trade order", () => {
    renderAction(
      depthOrder({
        side: ApiMarketOrderSideEnum.Bid,
        scope: ApiMarketOrderScopeEnum.Trait,
        applicability: ApiMarketOrderApplicabilityEnum.CriteriaUnverified,
        token_id: null,
        currency: { address: MARKET_WETH, symbol: "WETH", decimals: 18 },
      })
    );
    expect(
      screen.getByText(
        "This offer’s eligibility for this NFT has not been verified."
      )
    ).toBeInTheDocument();
    expect(mockFetchExactOrder).not.toHaveBeenCalled();
  });

  it("offers the wallet switch action when the connected signer has no matching holding", async () => {
    mockFetchExactOrder.mockResolvedValue(
      executableOrder({
        side: ApiMarketTradeOrderSideEnum.Offer,
        currency: MARKET_WETH,
      })
    );
    mockFetchOwnership.mockResolvedValue({
      account: { profile_id: "profile-1" },
      requirements: [{ holdings: [] }],
    });
    renderAction(
      depthOrder({
        side: ApiMarketOrderSideEnum.Bid,
        currency: { address: MARKET_WETH, symbol: "WETH", decimals: 18 },
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Accept offer" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "Connect the wallet holding this NFT to accept this offer."
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Connect or switch wallet" })
    );
    expect(mockSeizeConnect).toHaveBeenCalledTimes(1);
    expect(mockTrade).not.toHaveBeenCalled();
  });

  it.each([false, true])("requires signer ownership and binds the page NFT when accepting a WETH offer (collection-wide: %s)", async (collectionWide) => {
    const offer = executableOrder({
      side: ApiMarketTradeOrderSideEnum.Offer,
      currency: MARKET_WETH,
      quantity: "10",
      available_quantity: "4",
      purchase_quantity: "1",
      total_wei: "1000",
      net_wei: "900",
      fees: [
        {
          recipient: "0x2222222222222222222222222222222222222222",
          amount_wei: "100",
        },
      ],
    });
    mockFetchExactOrder.mockResolvedValue(offer);
    mockFetchOwnership.mockResolvedValue({
      account: { profile_id: "profile-1" },
      requirements: [
        {
          holdings: [
            {
              asset_key: ASSET_KEY,
              wallet: mockConnection.address,
              quantity: "2",
            },
          ],
        },
      ],
    });
    renderAction(
      depthOrder({
        side: ApiMarketOrderSideEnum.Bid,
        currency: { address: MARKET_WETH, symbol: "WETH", decimals: 18 },
        ...(collectionWide ? { scope: ApiMarketOrderScopeEnum.Collection, applicability: ApiMarketOrderApplicabilityEnum.Collection, token_id: null } : {}),
      })
    );
    fireEvent.click(screen.getByRole("button", { name: "Accept offer" }));
    await screen.findByTestId("offer-review");

    expect(mockTrade.mock.calls.at(-1)?.[0]).toMatchObject({
      action: "accept",
      asset,
      initialOrder: offer,
      initialQuantity: "1",
      maximumOrderQuantity: "2",
      fixedOrder: true,
    });
  });

  it("keeps the later offer review when an older exact lookup resolves last", async () => {
    const first = offerRow(HASH, "depth-first");
    const second = offerRow(SECOND_HASH, "depth-second");
    const resolve = deferExactOrders();
    ownedAsset();
    renderOfferRows([first, second]);
    const actions = screen.getAllByRole("button", { name: "Accept offer" });

    fireEvent.click(actions[0]!);
    await waitFor(() => expect(mockFetchExactOrder).toHaveBeenCalledTimes(1));
    fireEvent.click(actions[1]!);
    await waitFor(() => expect(mockFetchExactOrder).toHaveBeenCalledTimes(2));
    expect(actions[0]).toBeEnabled();

    await act(async () => {
      resolve(
        SECOND_HASH,
        executableOrder({
          identity: {
            protocol_address: MARKET_SEAPORT,
            order_hash: SECOND_HASH,
          },
          side: ApiMarketTradeOrderSideEnum.Offer,
          currency: MARKET_WETH,
        })
      );
    });
    expect(await screen.findByTestId("offer-review")).toHaveAttribute(
      "data-order-hash",
      SECOND_HASH
    );

    await act(async () => {
      resolve(
        HASH,
        executableOrder({
          side: ApiMarketTradeOrderSideEnum.Offer,
          currency: MARKET_WETH,
        })
      );
      await Promise.resolve();
    });
    expect(screen.getByTestId("offer-review")).toHaveAttribute(
      "data-order-hash",
      SECOND_HASH
    );
    expect(
      mockTrade.mock.calls.some(
        ([props]) =>
          (props as { initialOrder: ApiMarketTradeOrder }).initialOrder.identity
            .order_hash === HASH
      )
    ).toBe(false);
  });

  it("does not reopen an older offer after the later review closes", async () => {
    const first = offerRow(HASH, "depth-first");
    const second = offerRow(SECOND_HASH, "depth-second");
    const resolve = deferExactOrders();
    ownedAsset();
    renderOfferRows([first, second]);
    const actions = screen.getAllByRole("button", { name: "Accept offer" });

    fireEvent.click(actions[0]!);
    await waitFor(() => expect(mockFetchExactOrder).toHaveBeenCalledTimes(1));
    fireEvent.click(actions[1]!);
    await waitFor(() => expect(mockFetchExactOrder).toHaveBeenCalledTimes(2));
    await act(async () => {
      resolve(
        SECOND_HASH,
        executableOrder({
          identity: {
            protocol_address: MARKET_SEAPORT,
            order_hash: SECOND_HASH,
          },
          side: ApiMarketTradeOrderSideEnum.Offer,
          currency: MARKET_WETH,
        })
      );
    });
    fireEvent.click(
      await screen.findByRole("button", { name: "Close offer review" })
    );
    expect(screen.queryByTestId("offer-review")).toBeNull();

    await act(async () => {
      resolve(
        HASH,
        executableOrder({
          side: ApiMarketTradeOrderSideEnum.Offer,
          currency: MARKET_WETH,
        })
      );
      await Promise.resolve();
    });
    expect(screen.queryByTestId("offer-review")).toBeNull();
  });

  it("does not publish a batch review after actor invalidation during its exact refresh", async () => {
    const row = depthOrder();
    const view = renderAction(row);
    fireEvent.click(screen.getByRole("button", { name: "Collect" }));
    await screen.findByRole("textbox", { name: "Quantity" });

    let resolveOrder!: (order: ApiMarketTradeOrder) => void;
    mockFetchExactOrder.mockReturnValueOnce(
      new Promise<ApiMarketTradeOrder>((resolve) => {
        resolveOrder = resolve;
      })
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Review selected listings (1)" })
    );
    expect(screen.getByRole("textbox", { name: "Quantity" })).toBeDisabled();

    mockAuth = {
      ...mockAuth,
      connectedProfile: { ...mockAuth.connectedProfile, id: "profile-2" },
    };
    view.rerender(
      <MarketDepthTradeProvider
        contract={MEMES_CONTRACT}
        tokenId="8"
        locale="en-US"
        onMarketChange={jest.fn()}
      >
        <MarketDepthOrderAction order={row} locale="en-US" />
      </MarketDepthTradeProvider>
    );
    resolveOrder(executableOrder());

    await waitFor(() =>
      expect(
        screen.queryByRole("button", { name: "Review selected listings (1)" })
      ).toBeNull()
    );
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it("discards an exact-order response after the active profile changes", async () => {
    let resolveOrder!: (order: ApiMarketTradeOrder) => void;
    mockFetchExactOrder.mockReturnValue(
      new Promise<ApiMarketTradeOrder>((resolve) => {
        resolveOrder = resolve;
      })
    );
    const view = renderAction(depthOrder());
    fireEvent.click(screen.getByRole("button", { name: "Collect" }));
    await screen.findByText("Checking the current order…");

    mockAuth = {
      ...mockAuth,
      connectedProfile: { ...mockAuth.connectedProfile, id: "profile-2" },
    };
    view.rerender(
      <MarketDepthTradeProvider
        contract={MEMES_CONTRACT}
        tokenId="8"
        locale="en-US"
        onMarketChange={jest.fn()}
      >
        <MarketDepthOrderAction order={depthOrder()} locale="en-US" />
      </MarketDepthTradeProvider>
    );
    resolveOrder(executableOrder());

    await waitFor(() =>
      expect(screen.queryByText("Checking the current order…")).toBeNull()
    );
    expect(screen.queryByRole("textbox", { name: "Quantity" })).toBeNull();
    expect(mockBatch).not.toHaveBeenCalled();
  });

  it("discards ownership evidence returned after the connected signer changes", async () => {
    const offer = executableOrder({
      side: ApiMarketTradeOrderSideEnum.Offer,
      currency: MARKET_WETH,
    });
    mockFetchExactOrder.mockResolvedValue(offer);
    let resolveOwnership!: (value: unknown) => void;
    mockFetchOwnership.mockReturnValue(
      new Promise((resolve) => {
        resolveOwnership = resolve;
      })
    );
    const row = depthOrder({
      side: ApiMarketOrderSideEnum.Bid,
      currency: { address: MARKET_WETH, symbol: "WETH", decimals: 18 },
    });
    const view = renderAction(row);
    fireEvent.click(screen.getByRole("button", { name: "Accept offer" }));
    await waitFor(() => expect(mockFetchOwnership).toHaveBeenCalledTimes(1));

    mockConnection = {
      address: "0x4444444444444444444444444444444444444444",
      seizeConnect: mockSeizeConnect,
    };
    view.rerender(
      <MarketDepthTradeProvider
        contract={MEMES_CONTRACT}
        tokenId="8"
        locale="en-US"
        onMarketChange={jest.fn()}
      >
        <MarketDepthOrderAction order={row} locale="en-US" />
      </MarketDepthTradeProvider>
    );
    resolveOwnership({
      account: { profile_id: "profile-1" },
      requirements: [
        {
          holdings: [
            {
              asset_key: ASSET_KEY,
              wallet: "0x3333333333333333333333333333333333333333",
              quantity: "3",
            },
          ],
        },
      ],
    });

    await waitFor(() =>
      expect(screen.queryByText("Checking the current order…")).toBeNull()
    );
    expect(mockTrade).not.toHaveBeenCalled();
  });
});
