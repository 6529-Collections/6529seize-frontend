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
import type CollectRecipientPicker from "@/components/collect/CollectRecipientPicker";
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
    actions: ["BUY", "ACCEPT"].map((action) => ({ action, enabled: true })),
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
    clearMessage: jest.fn(),
    stage: null,
    message: undefined,
    ready: true,
    readinessReason: undefined,
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
  default: (props: ComponentProps<typeof CollectRecipientPicker>) => (
    <output aria-label="Draft recipient">{props.value}</output>
  ),
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
function renderBuy(
  props: Partial<ComponentProps<typeof CollectTradeController>> = {}
) {
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
        {...props}
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

it.each(["accept", "buy"] as const)(
  "recovers a failed standard %s preparation without replacing the order or discarding the draft",
  async (action) => {
    const destination = "0x3333333333333333333333333333333333333333";
    mockAuth.connectedProfile = {
      ...mockProfile,
      wallets: [
        ...mockProfile.wallets,
        { wallet: destination, display: "delivery.eth", tdh: 1 },
      ],
    };
    const requestRecipient = action === "buy" ? destination : payer;
    const first = {
      ...order,
      quantity: "3",
      total_wei: "300000000000000000",
      net_wei: "300000000000000000",
      side:
        action === "accept"
          ? ApiMarketTradeOrderSideEnum.Offer
          : ApiMarketTradeOrderSideEnum.Listing,
      currency:
        action === "accept"
          ? "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"
          : zero,
    };
    const second = {
      ...first,
      identity: { ...first.identity, order_hash: `0x${"b".repeat(64)}` },
    };
    mockFetchOrders
      .mockResolvedValueOnce({ orders: [first] })
      .mockResolvedValue({ orders: [second] });
    mockPrepare
      .mockRejectedValueOnce(
        Object.assign(new Error("Order changed"), { status: 409 })
      )
      .mockReturnValue(new Promise(() => undefined));
    render(
      <QueryClientProvider
        client={
          new QueryClient({ defaultOptions: { queries: { retry: false } } })
        }
      >
        <CollectTradeController
          asset={asset}
          action={action}
          initialRecipient={destination}
          presentation="contents"
          onClose={jest.fn()}
        />
      </QueryClientProvider>
    );
    fireEvent.click(await screen.findByRole("radio"));
    const quantity = screen.getByRole("textbox", { name: "Quantity" });
    fireEvent.change(quantity, { target: { value: "2" } });
    const prepare = screen.getByRole("button", { name: "Review exact terms" });
    await waitFor(() => expect(prepare).toBeEnabled());
    expect(
      screen.queryByRole("button", { name: "Try again" })
    ).not.toBeInTheDocument();
    fireEvent.click(prepare);
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The current trade terms could not be verified"
    );
    expect(
      screen.queryByText("Orders could not be loaded. Please try again.")
    ).not.toBeInTheDocument();
    expect(mockFetchOrders).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("radio")).toBeChecked();
    expect(mockPrepare.mock.calls[0]![0]).toEqual(
      expect.objectContaining({
        order: first.identity,
        quantity: "2",
        recipient: requestRecipient,
      })
    );

    fireEvent.click(screen.getByRole("button", { name: "Try again" }));
    await waitFor(() => expect(mockFetchOrders).toHaveBeenCalledTimes(2));
    await waitFor(() =>
      expect(screen.getByRole("radio")).toHaveAttribute(
        "value",
        second.identity.order_hash
      )
    );
    expect(screen.getByRole("radio")).not.toBeChecked();
    expect(quantity).toHaveValue("2");
    if (action === "buy")
      expect(screen.getByLabelText("Draft recipient")).toHaveTextContent(
        destination
      );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Try again" })
    ).not.toBeInTheDocument();
    expect(prepare).toBeDisabled();
    expect(mockPrepare).toHaveBeenCalledTimes(1);
    expect(mockSave).not.toHaveBeenCalled();
    expect(mockConfirm).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole("radio"));
    expect(quantity).toHaveValue("1");
    fireEvent.click(prepare);
    await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(2));
    expect(mockPrepare.mock.calls[1]![0]).toEqual(
      expect.objectContaining({
        order: second.identity,
        quantity: "1",
        recipient: requestRecipient,
        amount_wei: "100000000000000000",
      })
    );
    expect(mockConfirm).not.toHaveBeenCalled();
  }
);

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
  expect(
    screen.queryByRole("button", { name: "Collect" })
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Draft recipient")).not.toBeInTheDocument();
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

it("keeps a guest order error visible and offers retry without preparing", async () => {
  mockFetchOrders.mockRejectedValueOnce(new Error("orders unavailable"));
  setGuestSession();
  renderBuy();

  await waitFor(() =>
    expect(screen.getByRole("alert")).toHaveTextContent(
      "Orders could not be loaded"
    )
  );
  expect(screen.getByRole("button", { name: "Try again" })).toBeEnabled();
  expect(
    screen.queryByRole("button", { name: "Collect" })
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Draft recipient")).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Connect wallet" })).toBeEnabled();
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
  expect(mockSeizeConnect).not.toHaveBeenCalled();
});

it.each([
  [ApiCollectFamily.Memes, "0x33fd426905f149f8376e227d0c9d3340aad17af1"],
  [ApiCollectFamily.Memelab, "0x4db52a61dc491e15a2f78f5ac001c14ffe3568cb"],
  [ApiCollectFamily.Gradients, "0x0c58ef43ff3032005e472cb5709f8908acb00205"],
  [ApiCollectFamily.Pebbles, "0x45882f9bc325e14fbb298a1df930c43a874b83ae"],
] as const)(
  "shows one useful unlisted artwork state for %s without purchase controls",
  async (family, contract) => {
    mockFetchOrders.mockResolvedValueOnce({ orders: [] });
    setGuestSession();
    const offer = jest.fn();
    renderBuy({
      asset: { ...asset, family, contract, asset_key: `1:${contract}:1` },
      secondaryActions: <button onClick={offer}>Make an offer</button>,
    });

    await waitFor(() =>
      expect(screen.getByRole("status")).toHaveTextContent(
        "This artwork is not currently listed."
      )
    );
    expect(
      screen.queryByRole("button", { name: /refresh|try again/i })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Collect" })
    ).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Draft recipient")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("textbox", { name: "Quantity" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Make an offer" }));
    expect(offer).toHaveBeenCalledTimes(1);
    expect(
      screen.getByRole("button", { name: "Connect wallet" })
    ).toBeEnabled();
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockConfirm).not.toHaveBeenCalled();
    expect(mockSeizeConnect).not.toHaveBeenCalled();
  }
);

it("quietly discovers a new listing from an empty market without preparing", async () => {
  jest.useFakeTimers();
  try {
    mockFetchOrders.mockResolvedValueOnce({ orders: [] });
    setGuestSession();
    renderBuy();
    await screen.findByText("This artwork is not currently listed.");
    await act(async () => jest.advanceTimersByTimeAsync(60_000));
    expect(
      await screen.findByRole("button", { name: "Collect 0.1 ETH" })
    ).toBeDisabled();
    expect(mockFetchOrders).toHaveBeenCalledTimes(2);
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockConfirm).not.toHaveBeenCalled();
  } finally {
    jest.useRealTimers();
  }
});

it("does not call an own-wallet listing unlisted or show a purchase that cannot be made", async () => {
  mockFetchOrders.mockResolvedValueOnce({
    orders: [{ ...order, maker: payer }],
  });
  const list = jest.fn();
  renderBuy({ secondaryActions: <button onClick={list}>List</button> });
  await screen.findByText("No matching listing is available to collect here.");
  expect(
    screen.queryByText("This artwork is not currently listed.")
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: /^Collect/ })
  ).not.toBeInTheDocument();
  expect(screen.queryByLabelText("Draft recipient")).not.toBeInTheDocument();
  fireEvent.click(screen.getByRole("button", { name: "List" }));
  expect(list).toHaveBeenCalledTimes(1);
  expect(mockPrepare).not.toHaveBeenCalled();
});

it("uses the fetched book time to keep quantity editable without pricing or preparing a later-starting alternative", async () => {
  const mountedAt = Date.now();
  const fetchedAt = mountedAt + 2000;
  const now = jest.spyOn(Date, "now").mockReturnValue(mountedAt);
  const editions = {
    ...order,
    start_time: String(Math.floor(fetchedAt / 1000)),
    available_quantity: "3",
    purchase_quantity: "1",
    quantity_step: "1",
  };
  let resolve!: (value: { orders: ApiMarketTradeOrder[] }) => void;
  mockFetchOrders.mockReturnValue(
    new Promise((complete) => {
      resolve = complete;
    })
  );
  try {
    renderBuy({ initialQuantity: "4" });
    now.mockReturnValue(fetchedAt);
    await act(async () => {
      resolve({ orders: [editions] });
    });
    await screen.findByText(
      "No matching listing is available to collect here."
    );
    const quantity = screen.getByRole("textbox", { name: "Quantity" });
    expect(quantity).toHaveValue("4");
    expect(screen.getByRole("button", { name: "Collect" })).toBeDisabled();
    expect(mockPrepare).not.toHaveBeenCalled();
    fireEvent.change(quantity, { target: { value: "2" } });
    expect(
      await screen.findByRole("button", { name: "Collect 0.2 ETH" })
    ).toBeEnabled();
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockConfirm).not.toHaveBeenCalled();
  } finally {
    now.mockRestore();
  }
});

it("recovers an edited two-copy choice after its listing disappears, preserving quantity and recipient", async () => {
  jest.useFakeTimers();
  try {
    const editions = {
      ...order,
      available_quantity: "3",
      purchase_quantity: "1",
      quantity_step: "1",
    };
    mockFetchOrders
      .mockResolvedValueOnce({ orders: [editions] })
      .mockResolvedValueOnce({ orders: [] })
      .mockResolvedValue({ orders: [editions] });
    renderBuy();
    await screen.findByRole("button", { name: "Collect 0.1 ETH" });
    fireEvent.change(screen.getByRole("textbox", { name: "Quantity" }), {
      target: { value: "2" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Collect 0.2 ETH" }));
    await screen.findByText("This artwork is not currently listed.");
    expect(mockPrepare).not.toHaveBeenCalled();
    await act(async () => jest.advanceTimersByTimeAsync(60_000));
    const collect = await screen.findByRole("button", {
      name: "Collect 0.2 ETH",
    });
    expect(screen.getByRole("textbox", { name: "Quantity" })).toHaveValue("2");
    fireEvent.click(collect);
    await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
    expect(mockPrepare.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        quantity: "2",
        recipient: payer,
        amount_wei: "200000000000000000",
        order: order.identity,
      })
    );
  } finally {
    jest.useRealTimers();
  }
});

it("does not replace the exact price while preparation is pending, even when an older background read resolves", async () => {
  jest.useFakeTimers();
  try {
    let finishBrowsing!: (value: { orders: ApiMarketTradeOrder[] }) => void;
    mockFetchOrders
      .mockResolvedValueOnce({ orders: [order] })
      .mockReturnValueOnce(
        new Promise((resolve) => {
          finishBrowsing = resolve;
        })
      )
      .mockResolvedValue({ orders: [order] });
    mockPrepare.mockReturnValue(new Promise(() => undefined));
    renderBuy();
    const collect = await screen.findByRole("button", {
      name: "Collect 0.1 ETH",
    });
    await waitFor(() => expect(collect).toBeEnabled());
    await act(async () => jest.advanceTimersByTimeAsync(60_000));
    expect(mockFetchOrders).toHaveBeenCalledTimes(2);
    fireEvent.click(collect);
    await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
    await act(async () => {
      finishBrowsing({
        orders: [{ ...order, total_wei: "900000000000000000" }],
      });
    });
    expect(
      screen.queryByRole("button", { name: "Collect 0.9 ETH" })
    ).not.toBeInTheDocument();
    await act(async () => jest.advanceTimersByTimeAsync(120_000));
    expect(mockFetchOrders).toHaveBeenCalledTimes(3);
    expect(mockPrepare.mock.calls[0][0]).toEqual(
      expect.objectContaining({
        order: order.identity,
        amount_wei: order.total_wei,
        recipient: payer,
      })
    );
  } finally {
    jest.useRealTimers();
  }
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
    await screen.findByRole("button", { name: "Continue in wallet" })
  );
  await waitFor(() =>
    expect(mockConfirm).toHaveBeenCalledWith(
      operation,
      request,
      expect.any(Function)
    )
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
    "The transaction details did not match your reviewed trade."
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
