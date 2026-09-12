import CollectTradeController from "@/components/collect/CollectTradeController";
import type CollectTradeControllerForm from "@/components/collect/CollectTradeControllerForm";
import type CollectTradeSheet from "@/components/collect/CollectTradeSheet";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import { ApiMarketOperationStateEnum } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import {
  ApiMarketTradeOrderSideEnum,
  type ApiMarketTradeOrder,
} from "@/generated/models/ApiMarketTradeOrder";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";

const seller = "0x1111111111111111111111111111111111111111";
const bidder = "0x2222222222222222222222222222222222222222";
const otherWallet = "0x3333333333333333333333333333333333333333";
const weth = "0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2";
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
  season: 1,
  traits: [],
  hodl_rate: 1,
  tdh_eligible: true,
};
const order: ApiMarketTradeOrder = {
  asset_key: asset.asset_key,
  maker: bidder,
  identity: { protocol_address: seaport, order_hash: `0x${"a".repeat(64)}` },
  side: ApiMarketTradeOrderSideEnum.Offer,
  quantity: "10",
  purchase_quantity: "1",
  quantity_step: "1",
  available_quantity: "4",
  currency: weth,
  total_wei: "1000",
  net_wei: "900",
  fees: [{ recipient: otherWallet, amount_wei: "100" }],
  recipient: seller,
  start_time: "1",
  end_time: "9999999999",
};

const mockFetchOrders = jest.fn();
const mockFetchExact = jest.fn();
const mockPrepare = jest.fn();
const mockSave = jest.fn();
const mockValidate = jest.fn();
const mockConfirm = jest.fn();
let mockProfileId = "profile-one";
let mockAddress = seller;
let mockLatestForm: ComponentProps<typeof CollectTradeControllerForm> | null =
  null;
let mockLatestSheet: ComponentProps<typeof CollectTradeSheet> | null = null;

function profile(): ApiIdentity {
  return {
    id: mockProfileId,
    primary_wallet: seller,
    display: mockProfileId,
    wallets: [
      { wallet: seller, display: "seller.eth", tdh: 1 },
      { wallet: otherWallet, display: "other.eth", tdh: 0 },
    ],
  } as ApiIdentity;
}

jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: profile(),
    activeProfileProxy: null,
    isAuthenticated: true,
  }),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: mockAddress,
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
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectCapabilities: async () => ({
    actions: [{ action: "ACCEPT", enabled: true }],
  }),
}));
jest.mock("@/services/api/market-api", () => ({
  continueMarketOperation: jest.fn(),
  fetchExactMarketOrder: (...args: unknown[]) => mockFetchExact(...args),
  fetchMarketOrders: (...args: unknown[]) => mockFetchOrders(...args),
  prepareMarketOperation: (...args: unknown[]) => mockPrepare(...args),
}));
jest.mock("@/components/collect/market-operation-storage", () => ({
  readMarketIntent: () => null,
  saveMarketIntent: (...args: unknown[]) => mockSave(...args),
}));
jest.mock("@/components/collect/market-recovery", () => ({
  fetchRecoverableMarketOperation: jest.fn(),
  marketOperationHasUnresolvedSend: () => false,
  marketOperationNeedsPolling: () => false,
}));
jest.mock("@/components/collect/useMarketExecution", () => ({
  useMarketExecution: () => ({
    confirm: mockConfirm,
    recoverTransaction: jest.fn(),
    stage: null,
    message: undefined,
  }),
}));
jest.mock("@/components/collect/useMarketSettlement", () => ({
  useMarketSettlement: jest.fn(),
}));
jest.mock("@/components/collect/market-validation", () => {
  const actual = jest.requireActual("@/components/collect/market-validation");
  return {
    ...actual,
    validateMarketOperation: (...args: unknown[]) => mockValidate(...args),
  };
});
jest.mock("@/components/collect/market.adapters", () => ({
  marketAmount: jest.fn(),
  marketOperationStage: () => "review",
  marketOperationReview: (operation: ApiMarketOperation) => ({
    id: operation.id,
    revision: operation.revision,
    action: "accept",
    title: "Review",
    facts: [],
    technicalFacts: [],
    totalLabel: "0 WETH",
    totalDescription: "Sale proceeds",
    warnings: [],
    expiresAt: null,
  }),
}));
jest.mock("@/components/collect/CollectTradeControllerForm", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectTradeControllerForm>) => {
    mockLatestForm = props;
    return <output aria-label="draft">{JSON.stringify(props.draft)}</output>;
  },
}));
jest.mock("@/components/collect/CollectTradeSheet", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectTradeSheet>) => {
    mockLatestSheet = props;
    return <section>{props.form as ReactNode}</section>;
  },
}));
jest.mock("@/components/collect/CollectBatchController", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectTransactionRecovery", () => ({
  __esModule: true,
  default: () => null,
}));

function operationFor(request: ApiMarketPrepareRequest): ApiMarketOperation {
  return {
    id: "operation",
    revision: "revision-one",
    state: ApiMarketOperationStateEnum.Review,
    profile_id: request.profile_id,
    kind: request.kind,
    wallet: request.wallet,
    recipient: request.recipient,
    recipient_in_profile: true,
    asset_key: request.asset_key,
    quantity: request.quantity,
    currency: request.currency,
    total_wei: request.amount_wei,
    net_wei: "360",
    fees: [{ recipient: otherWallet, amount_wei: "40" }],
    approval_transactions: [],
    expires_at: 1_900_000_000_000,
    updated_at: 1,
    potential_liability_wei: "0",
  };
}

function renderController(
  props: Partial<ComponentProps<typeof CollectTradeController>> = {}
) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <CollectTradeController
        asset={asset}
        action="accept"
        initialOrder={order}
        initialQuantity="4"
        fixedOrder
        onClose={jest.fn()}
        {...props}
      />
    </QueryClientProvider>
  );
}

function prepareDraft() {
  act(() => {
    mockLatestForm!.onPrepare(mockLatestForm!.draft);
  });
}

async function waitUntilReady() {
  await waitFor(() => {
    expect(mockLatestForm).not.toBeNull();
    expect(mockLatestForm!.disabledReason).toBeUndefined();
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockProfileId = "profile-one";
  mockAddress = seller;
  mockLatestForm = null;
  mockLatestSheet = null;
  jest.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);
  mockFetchExact.mockResolvedValue(order);
  mockPrepare.mockImplementation((request: ApiMarketPrepareRequest) =>
    Promise.resolve(operationFor(request))
  );
  mockSave.mockReturnValue(true);
  mockValidate.mockImplementation(() => undefined);
  mockConfirm.mockResolvedValue(undefined);
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("uses the exact offer without discovery and binds available quantity, quote, and seller proceeds", async () => {
  renderController();

  await waitUntilReady();

  expect(mockLatestForm?.fixedOrder).toBe(true);
  expect(mockLatestForm?.draft.quantity).toBe("4");
  expect(mockLatestForm?.selectedOrder).toEqual(order);
  expect(mockFetchOrders).not.toHaveBeenCalled();

  prepareDraft();

  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
  expect(mockFetchExact).toHaveBeenCalledWith(
    order.identity.order_hash,
    order.identity.protocol_address,
    asset.asset_key,
    "OFFER",
    expect.any(AbortSignal)
  );
  expect(mockFetchExact.mock.invocationCallOrder[0]).toBeLessThan(
    mockPrepare.mock.invocationCallOrder[0]!
  );
  const request = mockPrepare.mock.calls[0]![0] as ApiMarketPrepareRequest;
  expect(request).toEqual(
    expect.objectContaining({
      profile_id: "profile-one",
      wallet: seller,
      recipient: seller,
      asset_key: asset.asset_key,
      kind: "ACCEPT",
      quantity: "4",
      currency: weth,
      amount_wei: "400",
      order: order.identity,
    })
  );
  await waitFor(() => expect(mockSave).toHaveBeenCalledTimes(1));
  expect(mockValidate).toHaveBeenCalledWith(expect.any(Object), request);
  expect(mockLatestSheet?.review).not.toBeNull();
});

it("does not prepare when the exact offer changed", async () => {
  mockFetchExact.mockResolvedValueOnce({ ...order, total_wei: "1001" });
  renderController();

  await waitUntilReady();

  prepareDraft();

  await waitFor(() => expect(mockFetchExact).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(mockLatestForm?.error).toBeDefined());
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
});

it("does not prepare after the actor changes while exact refresh is pending", async () => {
  let resolveExact!: (value: ApiMarketTradeOrder) => void;
  mockFetchExact.mockReturnValueOnce(
    new Promise<ApiMarketTradeOrder>((resolve) => {
      resolveExact = resolve;
    })
  );
  const view = renderController();
  await waitUntilReady();
  prepareDraft();
  await waitFor(() => expect(mockFetchExact).toHaveBeenCalledTimes(1));

  mockProfileId = "profile-two";
  view.rerender(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <CollectTradeController
        asset={asset}
        action="accept"
        initialOrder={order}
        initialQuantity="4"
        fixedOrder
        onClose={jest.fn()}
      />
    </QueryClientProvider>
  );
  await act(async () => resolveExact(order));

  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
});

it("does not prepare after unmount while exact refresh is pending", async () => {
  let resolveExact!: (value: ApiMarketTradeOrder) => void;
  mockFetchExact.mockReturnValueOnce(
    new Promise<ApiMarketTradeOrder>((resolve) => {
      resolveExact = resolve;
    })
  );
  const view = renderController();
  await waitUntilReady();
  prepareDraft();
  await waitFor(() => expect(mockFetchExact).toHaveBeenCalledTimes(1));

  view.unmount();
  await act(async () => resolveExact(order));

  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
});

it("does not save or show review after unmount while prepare is pending", async () => {
  let resolvePrepare!: (value: ApiMarketOperation) => void;
  mockPrepare.mockImplementationOnce(
    () =>
      new Promise<ApiMarketOperation>((resolve) => {
        resolvePrepare = resolve;
      })
  );
  const view = renderController();
  await waitUntilReady();
  prepareDraft();
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
  const request = mockPrepare.mock.calls[0]![0] as ApiMarketPrepareRequest;

  view.unmount();
  await act(async () => resolvePrepare(operationFor(request)));

  expect(mockSave).not.toHaveBeenCalled();
  expect(mockValidate).not.toHaveBeenCalled();
});

it("permits an exact one-copy acceptance under a one-copy cap", async () => {
  const cappedOrder = {
    ...order,
    available_quantity: "3",
  };
  mockFetchExact.mockResolvedValue(cappedOrder);
  renderController({
    initialOrder: cappedOrder,
    initialQuantity: "1",
    maximumOrderQuantity: "1",
  });

  await waitUntilReady();
  expect(mockLatestForm?.maximumOrderQuantity).toBe("1");
  prepareDraft();

  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
  expect(mockPrepare.mock.calls[0]![0]).toEqual(
    expect.objectContaining({ quantity: "1", amount_wei: "100" })
  );
});

it("rejects a quantity above the fixed acceptance cap before prepare", async () => {
  const cappedOrder = {
    ...order,
    available_quantity: "3",
  };
  mockFetchExact.mockResolvedValue(cappedOrder);
  renderController({
    initialOrder: cappedOrder,
    initialQuantity: "1",
    maximumOrderQuantity: "1",
  });
  await waitUntilReady();

  act(() => {
    mockLatestForm!.onChange({ ...mockLatestForm!.draft, quantity: "2" });
  });
  await waitFor(() => expect(mockLatestForm?.draft.quantity).toBe("2"));
  prepareDraft();

  await waitFor(() => expect(mockFetchExact).toHaveBeenCalledTimes(1));
  await waitFor(() => expect(mockLatestForm?.error).toBeDefined());
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
});
