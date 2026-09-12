import CollectTradeController from "@/components/collect/CollectTradeController";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import type CollectBatchController from "@/components/collect/CollectBatchController";
import type { ComponentProps } from "react";

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
const mockBatch = jest.fn();
const mockSeizeConnect = jest.fn();
const mockProfile = {
  id: "profile",
  primary_wallet: payer,
  wallets: [{ wallet: payer, display: "payer.eth", tdh: 1 }],
};
const mockAuth: {
  connectedProfile: typeof mockProfile | null;
  isAuthenticated: boolean;
  activeProfileProxy: object | null;
} = {
  connectedProfile: mockProfile,
  isAuthenticated: true,
  activeProfileProxy: null,
};
const mockConnection: {
  address: string | undefined;
  canSignActiveWallet: boolean;
  isSafeWallet: boolean;
  seizeConnect: jest.Mock;
} = {
  address: payer,
  canSignActiveWallet: true,
  isSafeWallet: false,
  seizeConnect: mockSeizeConnect,
};
jest.mock("@/components/collect/CollectBatchController", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectBatchController>) => {
    mockBatch(props);
    return <button onClick={props.onClose}>Close split</button>;
  },
}));
const operation = {
  id: "operation",
  profile_id: "profile",
  revision: "r1",
  updated_at: 1,
  state: "REVIEW",
  kind: "BUY",
  wallet: payer,
  asset_key: asset.asset_key,
  net_wei: order.net_wei,
  approval_transactions: [],
  recipient_in_profile: true,
  expires_at: Date.now() + 60_000,
  quantity: "1",
  recipient: payer,
  nft_recipient: payer,
  currency: zero,
  total_wei: order.total_wei,
  fees: [],
  transaction: { gas_reserve_wei: "1000000000000000" },
} as unknown as ApiMarketOperation;
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAuth,
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockConnection,
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
    expiresAt: Date.now() + 60_000,
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
  mockAuth.connectedProfile = mockProfile;
  mockAuth.isAuthenticated = true;
  mockAuth.activeProfileProxy = null;
  mockConnection.address = payer;
  mockConnection.canSignActiveWallet = true;
  mockFetchOrders.mockResolvedValue({ orders: [order] });
  mockPrepare.mockResolvedValue(operation);
});

function setGuestSession() {
  mockAuth.connectedProfile = null;
  mockAuth.isAuthenticated = false;
  mockConnection.address = undefined;
  mockConnection.canSignActiveWallet = false;
}

it("shows an observed listing to a guest after loading without preparing or connecting", async () => {
  let resolveOrders!: (value: { orders: ApiMarketTradeOrder[] }) => void;
  mockFetchOrders.mockReturnValueOnce(
    new Promise<{ orders: ApiMarketTradeOrder[] }>((resolve) => {
      resolveOrders = resolve;
    })
  );
  setGuestSession();
  renderBuy();

  expect(await screen.findByRole("status")).toHaveTextContent(
    "Loading listings"
  );
  expect(await screen.findByRole("button", { name: "Collect" })).toBeDisabled();
  await act(async () => {
    resolveOrders({ orders: [order] });
  });

  const buy = await screen.findByRole("button", { name: "Collect 0.1 ETH" });
  expect(buy).toBeDisabled();
  expect(screen.getByRole("button", { name: "Connect wallet" })).toBeEnabled();
  fireEvent.submit(buy.closest("form")!);
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
  expect(mockSeizeConnect).not.toHaveBeenCalled();
});

it("keeps a guest order error visible and offers refresh without preparing", async () => {
  mockFetchOrders.mockRejectedValueOnce(new Error("orders unavailable"));
  setGuestSession();
  renderBuy();

  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "Orders could not be loaded"
    )
  );
  expect(screen.getByRole("button", { name: "Refresh orders" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Collect" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Connect wallet" })).toBeEnabled();
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
  expect(mockSeizeConnect).not.toHaveBeenCalled();
});

it("keeps a guest empty order state visible and offers refresh without preparing", async () => {
  mockFetchOrders.mockResolvedValueOnce({ orders: [] });
  setGuestSession();
  renderBuy();

  await waitFor(() =>
    expect(screen.getByRole("status")).toHaveTextContent(
      "No NFTs are currently available to collect."
    )
  );
  expect(screen.getByRole("button", { name: "Refresh orders" })).toBeEnabled();
  expect(screen.getByRole("button", { name: "Collect" })).toBeDisabled();
  expect(screen.getByRole("button", { name: "Connect wallet" })).toBeEnabled();
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
  expect(mockSeizeConnect).not.toHaveBeenCalled();
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
  const buy = await screen.findByRole("button", { name: "Collect 0.1 ETH" });
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
  fireEvent.click(
    await screen.findByRole("button", { name: "Continue to wallet" })
  );
  await waitFor(() =>
    expect(mockConfirm).toHaveBeenCalledWith(operation, request)
  );
});
it("shows a changed price without preparing or substituting until the user accepts it", async () => {
  mockFetchOrders.mockResolvedValueOnce({ orders: [order] }).mockResolvedValue({
    orders: [{ ...order, total_wei: "200000000000000000" }],
  });
  renderBuy();
  const buy = await screen.findByRole("button", { name: "Collect 0.1 ETH" });
  await waitFor(() => expect(buy).toBeEnabled());
  fireEvent.click(buy);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This listing changed"
  );
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Collect 0.2 ETH" }));
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
  const buy = await screen.findByRole("button", { name: "Collect 0.1 ETH" });
  await waitFor(() => expect(buy).toBeEnabled());
  fireEvent.click(buy);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This listing changed"
  );
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
});
it("reuses the same prepare key and exact request after a lost response", async () => {
  mockPrepare.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  renderBuy();
  const buy = await screen.findByRole("button", { name: "Collect 0.1 ETH" });
  await waitFor(() => expect(buy).toBeEnabled());
  fireEvent.click(buy);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "The trading service could not be reached"
  );
  fireEvent.click(screen.getByRole("button", { name: "Collect 0.1 ETH" }));
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(2));
  expect(mockPrepare.mock.calls[1]).toEqual(mockPrepare.mock.calls[0]);
  expect(mockConfirm).not.toHaveBeenCalled();
});

it.each([
  [401, "Reconnect the paying or signing wallet"],
  [503, "could not verify this trade right now"],
])("shows safe preparation recovery for HTTP %s", async (status, message) => {
  mockPrepare.mockRejectedValueOnce(
    Object.assign(new Error("private provider details"), {
      status,
      response: { body: { message: "private provider details" } },
    })
  );
  renderBuy();
  const buy = await screen.findByRole("button", { name: "Collect 0.1 ETH" });
  await waitFor(() => expect(buy).toBeEnabled());
  fireEvent.click(buy);
  const alert = await screen.findByRole("alert");
  expect(alert).toHaveTextContent(message);
  expect(alert).not.toHaveTextContent("private provider details");
  expect(mockSave).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
});

it("distinguishes a rejected response from a network failure without opening the wallet", async () => {
  mockValidate.mockImplementationOnce(() => {
    throw new Error("MARKET_REVIEW_MISMATCH");
  });
  renderBuy();
  const buy = await screen.findByRole("button", { name: "Collect 0.1 ETH" });
  await waitFor(() => expect(buy).toBeEnabled());
  fireEvent.click(buy);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "This payload did not match your reviewed trade"
  );
  expect(mockSave).not.toHaveBeenCalled();
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
  const buy = await screen.findByRole("button", { name: "Collect 0.2 ETH" });
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
it("routes an explicit edition split to one batch with the exact selected lot and initial destination", async () => {
  const lot = {
    ...order,
    quantity: "2",
    total_wei: "200000000000000000",
    net_wei: "200000000000000000",
  };
  mockFetchOrders.mockResolvedValue({ orders: [lot] });
  renderBuy();
  const split = await screen.findByRole("button", { name: "Split delivery" });
  await waitFor(() => expect(split).toBeEnabled());
  fireEvent.click(split);
  const props = mockBatch.mock.calls.at(-1)![0] as ComponentProps<
    typeof CollectBatchController
  >;
  expect(props.items).toEqual([{ asset, order: lot, quantity: "2" }]);
  expect(props.initialRecipient).toBe(payer);
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
});
