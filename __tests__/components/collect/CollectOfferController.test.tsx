import CollectTradeController from "@/components/collect/CollectTradeController";
import type CollectTradeForm from "@/components/collect/CollectTradeForm";
import type CollectTradeSheet from "@/components/collect/CollectTradeSheet";
import type { CollectTradeDraft } from "@/components/collect/collect.types";
import { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { ApiMarketOperationStateEnum } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import { act, render, waitFor } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";

const payer = "0x1111111111111111111111111111111111111111";
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

const mockPrepare = jest.fn();
const mockConfirm = jest.fn();
const mockSave = jest.fn();
const mockValidate = jest.fn();
const mockValidatePublished = jest.fn();
let mockProfileId = "profile-one";
let mockLatestForm: ComponentProps<typeof CollectTradeForm> | null = null;
let mockLatestSheet: ComponentProps<typeof CollectTradeSheet> | null = null;

function profile(): ApiIdentity {
  return {
    id: mockProfileId,
    primary_wallet: payer,
    display: mockProfileId,
    wallets: [{ wallet: payer, display: "payer.eth", tdh: 1 }],
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
jest.mock("@tanstack/react-query", () => ({
  useQuery: ({ queryKey }: { queryKey: readonly unknown[] }) => ({
    data:
      queryKey[0] === "capabilities"
        ? {
            actions: ["BUY", "LIST", "OFFER", "ACCEPT", "CANCEL"].map(
              (action) => ({ action, enabled: true })
            ),
          }
        : undefined,
    dataUpdatedAt: Date.now(),
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@/services/api/market-api", () => ({
  continueMarketOperation: jest.fn(),
  fetchMarketOrders: jest.fn(),
  prepareMarketOperation: (...args: unknown[]) => mockPrepare(...args),
}));
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectCapabilities: jest.fn(),
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
jest.mock("@/components/collect/market-operation-storage", () => ({
  readMarketIntent: () => null,
  saveMarketIntent: (...args: unknown[]) => mockSave(...args),
}));
jest.mock("@/components/collect/market-recovery", () => ({
  fetchRecoverableMarketOperation: jest.fn(),
  marketOperationHasUnresolvedSend: () => false,
  marketOperationNeedsPolling: () => false,
}));
jest.mock("@/components/collect/market-validation", () => {
  const actual = jest.requireActual("@/components/collect/market-validation");
  return {
    ...actual,
    validateMarketOperation: (...args: unknown[]) => mockValidate(...args),
    validatePublishedMarketOffer: (...args: unknown[]) =>
      mockValidatePublished(...args),
  };
});
jest.mock("@/components/collect/market.adapters", () => ({
  marketAmount: jest.fn(),
  marketOperationStage: () => "review",
  marketOperationReview: (operation: ApiMarketOperation) => ({
    id: operation.id,
    revision: operation.revision,
    action: operation.kind.toLowerCase(),
    title: "Review",
    facts: [],
    technicalFacts: [],
    totalLabel: "1 WETH",
    totalDescription: "Offer amount",
    warnings: [],
    expiresAt: null,
  }),
}));
jest.mock("@/components/collect/CollectTradeForm", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectTradeForm>) => {
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
jest.mock("@/components/collect/CollectOrderPicker", () => ({
  CollectOrderBook: () => null,
}));
jest.mock("@/components/collect/CollectInlineBuyForm", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectBatchController", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectTransactionRecovery", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: () => null,
}));

function preparedOperation(
  request: ApiMarketPrepareRequest,
  id = `operation-${request.profile_id}`
): ApiMarketOperation {
  return {
    id,
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
    net_wei: request.amount_wei,
    fees: [],
    approval_transactions: [],
    expires_at: request.expires_at ?? 0,
    updated_at: 1,
    potential_liability_wei: "0",
  };
}

function controller(
  props: Partial<ComponentProps<typeof CollectTradeController>> = {}
) {
  return (
    <CollectTradeController
      asset={asset}
      action="offer"
      onClose={jest.fn()}
      {...props}
    />
  );
}

function changeDraft(value: Partial<CollectTradeDraft>) {
  act(() => {
    mockLatestForm!.onChange({ ...mockLatestForm!.draft, ...value });
  });
}

function prepareDraft() {
  act(() => {
    mockLatestForm!.onPrepare(mockLatestForm!.draft);
  });
}

beforeEach(() => {
  jest.clearAllMocks();
  mockProfileId = "profile-one";
  mockLatestForm = null;
  mockLatestSheet = null;
  jest.spyOn(Date, "now").mockReturnValue(1_800_000_000_000);
  mockConfirm.mockResolvedValue(undefined);
  mockSave.mockReturnValue(true);
  mockValidate.mockImplementation(() => undefined);
  mockValidatePublished.mockImplementation(() => {
    throw new Error("NOT_PUBLISHED");
  });
  mockPrepare.mockImplementation((request: ApiMarketPrepareRequest) =>
    Promise.resolve(preparedOperation(request))
  );
});

afterEach(() => {
  jest.restoreAllMocks();
});

it("seeds offers from supplied price and expiry while preserving defaults", () => {
  const { unmount } = render(
    controller({
      initialQuantity: "2",
      initialUnitPriceEth: "0.6",
      initialExpiryHours: "24",
    })
  );
  expect(mockLatestForm?.draft).toEqual(
    expect.objectContaining({
      quantity: "2",
      unitPriceEth: "0.6",
      expiryHours: "24",
    })
  );
  unmount();

  render(controller());
  expect(mockLatestForm?.draft).toEqual(
    expect.objectContaining({ unitPriceEth: "", expiryHours: "168" })
  );
});

it("does not apply offer-only price and expiry seeds to another action", () => {
  render(
    controller({
      action: "list",
      initialUnitPriceEth: "0.6",
      initialExpiryHours: "24",
    })
  );
  expect(mockLatestForm?.draft).toEqual(
    expect.objectContaining({ unitPriceEth: "", expiryHours: "168" })
  );
});

it("rejects a full-quantity offer above its cap without lowering it", async () => {
  render(controller({ maximumOfferAmountWei: "1000000000000000000" }));
  changeDraft({ quantity: "2", unitPriceEth: "0.6" });
  prepareDraft();
  await waitFor(() => expect(mockLatestForm?.error).toBeDefined());
  expect(mockPrepare).not.toHaveBeenCalled();
});

it("accepts the exact full-quantity offer cap", async () => {
  render(controller({ maximumOfferAmountWei: "1000000000000000000" }));
  changeDraft({ quantity: "2", unitPriceEth: "0.5" });
  prepareDraft();
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
  expect(mockPrepare.mock.calls[0][0]).toEqual(
    expect.objectContaining({
      kind: "OFFER",
      quantity: "2",
      amount_wei: "1000000000000000000",
    })
  );
});

it.each(["0", "not-a-limit"])(
  "rejects a zero or invalid offer cap: %s",
  async (maximumOfferAmountWei) => {
    render(controller({ maximumOfferAmountWei }));
    changeDraft({ unitPriceEth: "0.5" });
    prepareDraft();
    await waitFor(() => expect(mockLatestForm?.error).toBeDefined());
    expect(mockPrepare).not.toHaveBeenCalled();
  }
);

it("discards a late prepare response after a profile switch and starts a fresh intent", async () => {
  let resolveFirst!: (operation: ApiMarketOperation) => void;
  const first = new Promise<ApiMarketOperation>((resolve) => {
    resolveFirst = resolve;
  });
  mockPrepare
    .mockReturnValueOnce(first)
    .mockImplementation((request: ApiMarketPrepareRequest) =>
      Promise.resolve(preparedOperation(request))
    );
  const view = render(
    controller({ initialUnitPriceEth: "0.5", initialExpiryHours: "24" })
  );
  prepareDraft();
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
  const firstRequest = mockPrepare.mock.calls[0][0] as ApiMarketPrepareRequest;
  const firstKey = mockPrepare.mock.calls[0][1];

  mockProfileId = "profile-two";
  view.rerender(
    controller({ initialUnitPriceEth: "0.5", initialExpiryHours: "24" })
  );
  await act(async () => {
    resolveFirst(preparedOperation(firstRequest));
    await first;
  });
  expect(mockSave).not.toHaveBeenCalled();

  prepareDraft();
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(2));
  const secondRequest = mockPrepare.mock.calls[1][0] as ApiMarketPrepareRequest;
  expect(secondRequest.profile_id).toBe("profile-two");
  expect(secondRequest.wallet).toBe(firstRequest.wallet);
  expect(mockPrepare.mock.calls[1][1]).not.toBe(firstKey);
  await waitFor(() =>
    expect(mockSave).toHaveBeenCalledWith(
      "profile-two",
      "operation-profile-two",
      { request: secondRequest }
    )
  );
});

it("retries an unchanged prepare with the exact request, expiry, and key", async () => {
  mockPrepare
    .mockRejectedValueOnce(new Error("response lost"))
    .mockImplementation((request: ApiMarketPrepareRequest) =>
      Promise.resolve(preparedOperation(request))
    );
  render(controller({ initialUnitPriceEth: "0.5", initialExpiryHours: "24" }));
  prepareDraft();
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
  const firstRequest = mockPrepare.mock.calls[0][0] as ApiMarketPrepareRequest;
  const firstKey = mockPrepare.mock.calls[0][1];
  await waitFor(() => expect(mockLatestForm?.error).toBeDefined());

  jest.spyOn(Date, "now").mockReturnValue(1_800_003_600_000);
  prepareDraft();
  await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(2));
  expect(mockPrepare.mock.calls[1][0]).toEqual(firstRequest);
  expect(mockPrepare.mock.calls[1][0].expires_at).toBe(firstRequest.expires_at);
  expect(mockPrepare.mock.calls[1][1]).toBe(firstKey);
});

it("passes a live intent guard to offer confirmation", async () => {
  render(controller({ initialUnitPriceEth: "0.5" }));
  prepareDraft();
  await waitFor(() => expect(mockLatestSheet?.review).not.toBeNull());
  const review = mockLatestSheet!.review!;
  await act(async () => {
    await mockLatestSheet!.onConfirm(review.id, review.revision);
  });
  expect(mockConfirm).toHaveBeenCalledTimes(1);
  expect(mockConfirm.mock.calls[0]).toHaveLength(3);
  const guard = mockConfirm.mock.calls[0][2] as () => void;
  expect(guard).not.toThrow();

  changeDraft({ unitPriceEth: "0.7" });
  expect(guard).toThrow("MARKET_CONNECTION_CHANGED");
});

it("keeps non-offer confirmation on the two-argument execution contract", async () => {
  render(controller({ action: "list", initialQuantity: "1" }));
  changeDraft({ unitPriceEth: "0.5" });
  prepareDraft();
  await waitFor(() => expect(mockLatestSheet?.review).not.toBeNull());
  const review = mockLatestSheet!.review!;
  await act(async () => {
    await mockLatestSheet!.onConfirm(review.id, review.revision);
  });
  expect(mockConfirm).toHaveBeenCalledTimes(1);
  expect(mockConfirm.mock.calls[0]).toHaveLength(2);
});
