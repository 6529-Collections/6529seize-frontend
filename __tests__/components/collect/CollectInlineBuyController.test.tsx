import CollectTradeController from "@/components/collect/CollectTradeController";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const payer = "0x1111111111111111111111111111111111111111";
const seller = "0x2222222222222222222222222222222222222222";
const zero = "0x0000000000000000000000000000000000000000";
const seaport = "0x0000000000000068f116a894984e2db1123eb395";
const asset: ApiCollectAsset = {
  asset_key: "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:1",
  chain_id: 1,
  contract: "0x33fd426905f149f8376e227d0c9d3340aad17af1",
  token_id: "1",
  family: ApiCollectFamily.Memes,
  name: "Meme One",
  image_url: null,
  artist_ids: [],
  traits: [],
  season: 1,
  hodl_rate: 1,
  tdh_eligible: true,
};
const order: ApiMarketTradeOrder = {
  asset_key: asset.asset_key,
  maker: seller,
  identity: { protocol_address: seaport, order_hash: `0x${"a".repeat(64)}` },
  side: ApiMarketTradeOrderSideEnum.Listing,
  quantity: "1",
  currency: zero,
  total_wei: "100000000000000000",
  net_wei: "100000000000000000",
  fees: [],
  recipient: zero,
  start_time: "1",
  end_time: "9999999999",
};
const mockFetchOrders = jest.fn();
const mockPrepare = jest.fn();
const mockValidate = jest.fn();
const mockConfirm = jest.fn();
const mockSave = jest.fn();
const operation = {
  id: "operation",
  profile_id: "profile",
  revision: "r1",
  updated_at: 1,
  state: "REVIEW",
  quantity: "1",
  recipient: payer,
  nft_recipient: payer,
  currency: zero,
  total_wei: order.total_wei,
  fees: [],
  transaction: { gas_reserve_wei: "1000000000000000" },
} as unknown as ApiMarketOperation;
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: {
      id: "profile",
      primary_wallet: payer,
      wallets: [{ wallet: payer, display: "payer.eth", tdh: 1 }],
    },
    isAuthenticated: true,
    activeProfileProxy: null,
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: payer,
    canSignActiveWallet: true,
    isSafeWallet: false,
    seizeConnect: jest.fn(),
  }),
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: false }),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: {
    MARKET_ORDERS: "orders",
    MARKET_OPERATION: "operation",
    COLLECT_CAPABILITIES: "capabilities",
    MARKET_MY_OPERATIONS: "history",
  },
}));
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectCapabilities: async () => ({
    actions: [{ action: "BUY", enabled: true }],
  }),
}));
jest.mock("@/services/api/market-api", () => ({
  fetchMarketOrders: (...args: unknown[]) => mockFetchOrders(...args),
  prepareMarketOperation: (...args: unknown[]) => mockPrepare(...args),
}));
jest.mock("@/components/collect/market-operation-storage", () => ({
  readMarketIntent: () => null,
  saveMarketIntent: (...args: unknown[]) => mockSave(...args),
}));
jest.mock("@/components/collect/useMarketSettlement", () => ({
  useMarketSettlement: jest.fn(),
}));
jest.mock("@/components/collect/useMarketExecution", () => ({
  useMarketExecution: () => ({
    confirm: mockConfirm,
    recoverTransaction: jest.fn(),
    stage: null,
    message: undefined,
  }),
}));
jest.mock("@/components/collect/market-recovery", () => ({
  fetchRecoverableMarketOperation: async () => operation,
  marketOperationHasUnresolvedSend: () => false,
  marketOperationNeedsPolling: () => false,
}));
jest.mock("@/components/collect/market-validation", () => ({
  MARKET_SEAPORT: "0x0000000000000068f116a894984e2db1123eb395",
  MARKET_ZERO: "0x0000000000000000000000000000000000000000",
  MARKET_WETH: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2",
  validateMarketOperation: (...args: unknown[]) => mockValidate(...args),
}));
jest.mock("@/components/collect/CollectRecipientPicker", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/market.adapters", () => ({
  ...jest.requireActual("@/components/collect/market.adapters"),
  marketOperationStage: () => "review",
  marketOperationReview: () => ({
    id: "operation",
    revision: "r1",
    action: "buy",
    title: "Meme One",
    facts: [],
    technicalFacts: [],
    totalLabel: "0.1 ETH",
    totalDescription: "Purchase amount",
    warnings: [],
    expiresAt: null,
  }),
}));
function renderBuy() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <CollectTradeController
        asset={asset}
        action="buy"
        layout="inline-buy"
        presentation="contents"
        onClose={jest.fn()}
      />
    </QueryClientProvider>
  );
}
beforeEach(() => {
  jest.clearAllMocks();
  mockFetchOrders.mockResolvedValue({ orders: [order] });
  mockPrepare.mockResolvedValue(operation);
});
it("automatically selects the cheapest exact listing, refreshes it, validates, and waits for explicit wallet confirmation", async () => {
  mockFetchOrders.mockResolvedValue({
    orders: [
      {
        ...order,
        identity: { ...order.identity, order_hash: `0x${"b".repeat(64)}` },
        total_wei: "200000000000000000",
      },
      order,
    ],
  });
  renderBuy();
  const buy = await screen.findByRole("button", { name: "Buy 0.1 ETH" });
  await waitFor(() => expect(buy).toBeEnabled());
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  fireEvent.click(buy);
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
  const request = mockPrepare.mock.calls[0][0];
  expect(request).toEqual(
    expect.objectContaining({
      amount_wei: order.total_wei,
      asset_key: asset.asset_key,
      quantity: "1",
      recipient: payer,
      order: order.identity,
    })
  );
  expect(mockFetchOrders).toHaveBeenCalledTimes(2);
  await waitFor(() =>
    expect(mockValidate).toHaveBeenCalledWith(operation, request)
  );
  expect(mockSave).toHaveBeenCalledWith("profile", "operation", { request });
  expect(mockConfirm).not.toHaveBeenCalled();
  fireEvent.click(await screen.findByRole("button", { name: "Buy 0.1 ETH" }));
  await waitFor(() =>
    expect(mockConfirm).toHaveBeenCalledWith(operation, request)
  );
});
it("shows a changed price without preparing or substituting until the user accepts it", async () => {
  mockFetchOrders.mockResolvedValueOnce({ orders: [order] }).mockResolvedValue({
    orders: [{ ...order, total_wei: "200000000000000000" }],
  });
  renderBuy();
  const buy = await screen.findByRole("button", { name: "Buy 0.1 ETH" });
  await waitFor(() => expect(buy).toBeEnabled());
  fireEvent.click(buy);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This listing changed"
  );
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Buy 0.2 ETH" }));
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
  expect(mockPrepare.mock.calls[0][0]).toEqual(
    expect.objectContaining({
      amount_wei: "200000000000000000",
      order: order.identity,
    })
  );
});
it("does not silently switch to a different listing after the selected one disappears", async () => {
  mockFetchOrders.mockResolvedValueOnce({ orders: [order] }).mockResolvedValue({
    orders: [
      {
        ...order,
        identity: { ...order.identity, order_hash: `0x${"b".repeat(64)}` },
      },
    ],
  });
  renderBuy();
  const buy = await screen.findByRole("button", { name: "Buy 0.1 ETH" });
  await waitFor(() => expect(buy).toBeEnabled());
  fireEvent.click(buy);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This listing changed"
  );
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
});
it("reuses the same prepare key and exact request after a lost response", async () => {
  mockPrepare.mockRejectedValueOnce(new Error("response lost"));
  renderBuy();
  const buy = await screen.findByRole("button", { name: "Buy 0.1 ETH" });
  await waitFor(() => expect(buy).toBeEnabled());
  fireEvent.click(buy);
  await screen.findByRole("alert");
  fireEvent.click(screen.getByRole("button", { name: "Buy 0.1 ETH" }));
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(2));
  expect(mockPrepare.mock.calls[1]).toEqual(mockPrepare.mock.calls[0]);
  expect(mockConfirm).not.toHaveBeenCalled();
});

it("defaults an older full-lot listing to the whole quantity and hides unsupported partial editing", async () => {
  mockFetchOrders.mockResolvedValue({
    orders: [
      {
        ...order,
        quantity: "2",
        total_wei: "200000000000000000",
        net_wei: "200000000000000000",
      },
    ],
  });
  renderBuy();
  const buy = await screen.findByRole("button", { name: "Buy 0.2 ETH" });
  await waitFor(() => expect(buy).toBeEnabled());
  expect(screen.getByText("Quantity: 2")).toBeVisible();
  expect(
    screen.queryByRole("textbox", { name: "Quantity" })
  ).not.toBeInTheDocument();
  fireEvent.click(buy);
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
  expect(mockPrepare.mock.calls[0][0]).toEqual(
    expect.objectContaining({ quantity: "2", amount_wei: "200000000000000000" })
  );
});
