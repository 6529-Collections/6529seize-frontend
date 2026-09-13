import CollectBatchController from "@/components/collect/CollectBatchController";
import type CollectBatchReviewForm from "@/components/collect/CollectBatchReviewForm";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiCollectAsset } from "@/generated/models/ApiCollectAsset";
import type { ApiMarketTradeOrder } from "@/generated/models/ApiMarketTradeOrder";
import type { ComponentProps, ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";
import { batchFixture, NOW, PAYER } from "./market-batch.fixture";
import { createMarketSendAttempt } from "@/components/collect/market-send-attempt";
import {
  ApiMarketBatchSendAttemptPurposeEnum,
  ApiMarketBatchSendAttemptStatusEnum,
} from "@/generated/models/ApiMarketBatchSendAttempt";

import * as recipientHooks from "@/components/collect/useCollectBatchRecipientUpdate";
import { validateMarketBatchOperation } from "@/components/collect/market-batch-validation";

let mockFixture = batchFixture();
let mockNative = false;
let mockAddress = PAYER;
let mockProfile: ApiIdentity;
const mockPrepare = jest.fn(),
  mockConfirm = jest.fn();
const mockReviewForm = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: mockProfile,
    isAuthenticated: true,
    activeProfileProxy: null,
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
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: {
    COLLECT_CAPABILITIES: "capabilities",
    MARKET_OPERATION: "operation",
    MARKET_MY_OPERATIONS: "history",
  },
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@/hooks/useCapacitor", () => ({
  __esModule: true,
  default: () => ({ isCapacitor: mockNative }),
}));
jest.mock("@/components/collect/CollectCheckoutScreen", () => ({
  __esModule: true,
  default: ({ children }: { children: ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
}));
jest.mock("@/components/collect/CollectBatchReviewForm", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectBatchReviewForm>) => {
    mockReviewForm(props);
    return (
      <div>
        <input
          aria-label="Delivery draft"
          defaultValue="unchanged destination"
        />
        <button
          disabled={props.loading || Boolean(props.disabledReason)}
          onClick={() => props.onPrepare({ items: [] })}
        >
          Check selected purchases
        </button>
        {props.error && <p role="alert">{props.error}</p>}
        {props.disabledReason && <p role="status">{props.disabledReason}</p>}
      </div>
    );
  },
}));
jest.mock("@/components/collect/CollectAssetMedia", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/collect-batch-request", () => ({
  buildCollectBatchRequest: () => mockFixture.request,
}));
jest.mock("@/components/collect/useMarketSettlement", () => ({
  useMarketSettlement: jest.fn(),
}));
jest.mock("@/components/collect/useMarketBatchExecution", () => ({
  useMarketBatchExecution: () => ({
    ready: true,
    busy: false,
    confirm: mockConfirm,
    clearMessage: jest.fn(),
    recoverTransaction: jest.fn(),
  }),
}));
jest.mock("@/components/collect/market-operation-lock", () => ({
  withMarketOperationLock: (_id: string, callback: () => Promise<unknown>) =>
    callback(),
}));
jest.mock("@/services/api/market-batch-api", () => ({
  fetchMarketBatchCapabilities: async () => ({
    available: true,
    max_orders: 128,
    max_allocations: 256,
  }),
  fetchMarketBatch: async () => mockFixture.operation,
  prepareMarketBatch: (...args: unknown[]) => mockPrepare(...args),
  continueMarketBatch: async () => mockFixture.operation,
}));

let serial = 0;
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockNative = false;
  mockAddress = PAYER;
  jest.spyOn(Date, "now").mockReturnValue(NOW);
  mockFixture = batchFixture();
  mockFixture.request.profile_id = `profile-${++serial}`;
  mockFixture.operation.profile_id = mockFixture.request.profile_id;
  mockProfile = {
    id: mockFixture.request.profile_id,
    primary_wallet: PAYER,
    wallets: [{ wallet: PAYER }],
  } as ApiIdentity;
  mockPrepare.mockResolvedValue(mockFixture.operation);
});
afterEach(() => jest.restoreAllMocks());

it.each([true, false])(
  "only requests a manual hash when the active batch lacks one (known=%s)",
  async (known) => {
    const transaction = mockFixture.operation.transaction!;
    const attempt = createMarketSendAttempt(
      transaction,
      mockFixture.operation.block_number,
      mockFixture.operation.revision
    );
    mockFixture.operation.state = ApiMarketBatchOperationStateEnum.Unknown;
    mockFixture.operation.send_attempt = {
      attempt_id: attempt.id,
      purpose: ApiMarketBatchSendAttemptPurposeEnum.Transaction,
      transaction_digest: attempt.digest,
      snapshot_block: attempt.snapshotBlock,
      transaction,
      status: ApiMarketBatchSendAttemptStatusEnum.Active,
      transaction_hash: known ? `0x${"a".repeat(64)}` : null,
    };
    mount(true);
    const input = screen.queryByRole("textbox", {
      name: "Transaction hash from your wallet",
    });
    if (known) expect(input).not.toBeInTheDocument();
    else expect(input).toBeInTheDocument();
    expect(mockConfirm).not.toHaveBeenCalled();
  }
);

function mount(initialOperation = false, onEmpty = jest.fn()) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const items = mockFixture.request.items.map((item) => ({
    asset: {
      asset_key: item.asset_key,
      name: "Selected artwork",
      image_url: null,
    } as ApiCollectAsset,
    order: { identity: item.order } as ApiMarketTradeOrder,
    quantity: item.quantity,
  }));
  const content = () => (
    <QueryClientProvider client={client}>
      <CollectBatchController
        items={items}
        onClose={jest.fn()}
        onEmpty={onEmpty}
        {...(initialOperation
          ? { initialOperation: mockFixture.operation }
          : {})}
      />
    </QueryClientProvider>
  );
  const rendered = render(content());
  return { ...rendered, rerenderScope: () => rendered.rerender(content()) };
}

it("explains a failed connection and retries the exact batch without signing", async () => {
  mockPrepare.mockRejectedValueOnce(new TypeError("Failed to fetch"));
  mount();
  const prepare = screen.getByRole("button", {
    name: "Check selected purchases",
  });
  await waitFor(() => expect(prepare).toBeEnabled());
  fireEvent.click(prepare);
  expect(await screen.findByRole("alert")).toHaveTextContent(
    "The trading service could not be reached"
  );
  expect(mockConfirm).not.toHaveBeenCalled();
  await waitFor(() => expect(prepare).toBeEnabled());
  fireEvent.click(prepare);
  await screen.findByRole("button", { name: "Continue in wallet" });
  expect(mockPrepare).toHaveBeenCalledTimes(2);
  expect(mockPrepare.mock.calls[1]).toEqual(mockPrepare.mock.calls[0]);
  expect(mockConfirm).not.toHaveBeenCalled();
});

it("prepares once and supports direct review editing without restarting the purchase", async () => {
  mount();
  const draft = screen.getByLabelText("Delivery draft");
  fireEvent.change(draft, { target: { value: "selected fren" } });
  const prepare = screen.getByRole("button", {
    name: "Check selected purchases",
  });
  await waitFor(() => expect(prepare).toBeEnabled());
  fireEvent.click(prepare);
  const buy = await screen.findByRole("button", {
    name: "Continue in wallet",
  });
  expect(mockPrepare).toHaveBeenCalledTimes(1);
  expect(mockConfirm).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
  await waitFor(() => expect(buy).toBeEnabled());
  fireEvent.click(buy);
  expect(mockConfirm).toHaveBeenCalledWith(
    mockFixture.operation,
    mockFixture.request,
    expect.any(Function)
  );
  expect(
    screen.queryByRole("button", { name: "Edit purchase" })
  ).not.toBeInTheDocument();
  expect(
    screen.getAllByRole("button", {
      name: "Remove Selected artwork from this purchase",
    })
  ).toHaveLength(2);
  expect(screen.getByRole("button", { name: /Change all to/ })).toBeEnabled();
  expect(screen.getByLabelText("Delivery draft")).toBe(draft);
  expect(draft).toHaveValue("selected fren");
});
it.each([0, NOW - 1])(
  "continues a saved review with deadline %s through fresh revalidation without a manual refresh step",
  async (expiresAt) => {
    mockFixture.operation.expires_at = expiresAt;
    localStorage.setItem(
      `6529-market-batch:${mockFixture.request.profile_id}:${mockFixture.operation.id}`,
      JSON.stringify({ request: mockFixture.request })
    );
    mount(true);
    await waitFor(() =>
      expect(
        screen.getByRole("button", {
          name: "Continue in wallet",
        })
      ).toBeEnabled()
    );
    expect(mockConfirm).not.toHaveBeenCalled();
    expect(
      screen.queryByRole("button", { name: /refresh|retry/i })
    ).not.toBeInTheDocument();
    expect(screen.queryByText(/expired/i)).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Continue in wallet" }));
    expect(mockConfirm).toHaveBeenCalledTimes(1);
    expect(mockConfirm).toHaveBeenCalledWith(
      mockFixture.operation,
      mockFixture.request,
      expect.any(Function)
    );
  }
);
it.each([
  ApiMarketBatchOperationStateEnum.Unknown,
  ApiMarketBatchOperationStateEnum.Submitted,
])(
  "reopens %s from persisted selection after controller and query cache are discarded",
  async (state) => {
    mockFixture.operation.state = state;
    localStorage.setItem(
      `6529-market-batch:${mockFixture.request.profile_id}:${mockFixture.operation.id}`,
      JSON.stringify({ request: mockFixture.request })
    );
    const first = mount();
    await screen.findByRole("heading", { level: 2 });
    expect(
      screen.queryByRole("button", { name: "Continue in wallet" })
    ).not.toBeInTheDocument();
    first.unmount();
    mount();
    await screen.findByRole("heading", { level: 2 });
    expect(
      screen.queryByRole("button", { name: "Check selected purchases" })
    ).not.toBeInTheDocument();
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockConfirm).not.toHaveBeenCalled();
  }
);
it("cannot open a new empty edit form for a recovered operation", async () => {
  mount(true);
  expect(
    screen.queryByRole("button", { name: "Edit purchase" })
  ).not.toBeInTheDocument();
  expect(
    screen.getByRole("button", { name: "Continue in wallet" })
  ).toBeDisabled();
  expect(mockPrepare).not.toHaveBeenCalled();
});
it("shows a verified wallet name only for its exact address and removes it when the profile changes", async () => {
  mockProfile = {
    ...mockProfile,
    display: "Not a name for every wallet",
    wallets: [{ wallet: PAYER, display: "paying.wallet.eth", tdh: 0 }],
  };
  const view = mount(true);
  screen.getAllByText("paying.wallet.eth").forEach((name) => {
    expect(name).toBeVisible();
  });
  expect(
    screen.queryByText("Not a name for every wallet")
  ).not.toBeInTheDocument();
  mockProfile = { ...mockProfile, id: "another-profile" };
  view.rerenderScope();
  expect(screen.queryByText("paying.wallet.eth")).not.toBeInTheDocument();
  expect(mockConfirm).not.toHaveBeenCalled();
});
it("preserves the native purchasing gate before preparation", async () => {
  mockNative = true;
  mount();
  await waitFor(() =>
    expect(
      screen.getByRole("button", { name: "Check selected purchases" })
    ).toBeDisabled()
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Check selected purchases" })
  );
  expect(mockPrepare).not.toHaveBeenCalled();
});
it.each(["profile", "paying wallet"])(
  "discards a late preparation result when the %s changes in a still-mounted parent",
  async (scope) => {
    const prior = mockFixture.operation;
    let finish!: (value: typeof prior) => void;
    mockPrepare.mockReturnValue(
      new Promise<typeof prior>((resolve) => {
        finish = resolve;
      })
    );
    const view = mount();
    const button = screen.getByRole("button", {
      name: "Check selected purchases",
    });
    await waitFor(() => expect(button).toBeEnabled());
    fireEvent.click(button);
    await waitFor(() => expect(mockPrepare).toHaveBeenCalledTimes(1));
    if (scope === "profile")
      mockProfile = { ...mockProfile, id: "new-profile" };
    else mockAddress = "0x9999999999999999999999999999999999999999";
    view.rerenderScope();
    await act(async () => {
      finish(prior);
    });
    expect(
      screen.queryByRole("button", { name: "Continue in wallet" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Check selected purchases" })
    ).toBeVisible();
    expect(mockConfirm).not.toHaveBeenCalled();
  }
);

it("does not reopen a retained review after the guarded final-item removal callback", async () => {
  jest
    .spyOn(recipientHooks, "useCollectBatchRecipientUpdate")
    .mockImplementation((options) => ({
      canEdit: true,
      pending: false,
      assertIdle: jest.fn(),
      update: jest.fn(),
      updateAll: jest.fn(),
      remove: async () => {
        options.onEmpty?.();
        return true;
      },
    }));
  const onEmpty = jest.fn();
  localStorage.setItem(
    `6529-market-batch:${mockFixture.request.profile_id}:${mockFixture.operation.id}`,
    JSON.stringify({ request: mockFixture.request })
  );
  const view = mount(true, onEmpty);
  await waitFor(() =>
    expect(
      screen.getAllByRole("button", {
        name: "Remove Selected artwork from this purchase",
      })[0]
    ).toBeEnabled()
  );
  fireEvent.click(
    screen.getAllByRole("button", {
      name: "Remove Selected artwork from this purchase",
    })[0]!
  );
  await waitFor(() => expect(onEmpty).toHaveBeenCalledTimes(1));
  view.rerenderScope();
  expect(
    screen.queryByRole("button", { name: "Continue in wallet" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", {
      name: "Remove Selected artwork from this purchase",
    })
  ).not.toBeInTheDocument();
  expect(mockConfirm).not.toHaveBeenCalled();
  expect(mockPrepare).not.toHaveBeenCalled();
});

function resumeSecondSelectedOrder() {
  const items = mockFixture.request.items.map((item, index) => ({
    asset: {
      asset_key: item.asset_key,
      name: `Artwork ${index === 0 ? "A" : "B"}`,
      image_url: null,
    } as ApiCollectAsset,
    order: { identity: item.order } as ApiMarketTradeOrder,
    quantity: item.quantity,
  }));
  const selected = mockFixture.request.items[1]!;
  mockFixture.request.items = [selected];
  mockFixture.request.amount_wei = selected.amount_wei;
  mockFixture.operation.items = [mockFixture.operation.items[1]!];
  mockFixture.operation.total_wei = selected.amount_wei;
  mockFixture.operation.potential_liability_wei = selected.amount_wei;
  mockFixture.orders.splice(0, 1);
  const mirror = mockFixture.orders[1]!;
  mirror.parameters.offer[0]!.startAmount = BigInt(selected.amount_wei);
  mirror.parameters.offer[0]!.endAmount = BigInt(selected.amount_wei);
  mirror.parameters.consideration.splice(0, 1);
  mirror.parameters.totalOriginalConsiderationItems = 2n;
  const links = [
    [0, 0, 1, 0],
    [0, 0, 1, 1],
    [1, 0, 0, 0],
    [1, 0, 0, 1],
  ];
  mockFixture.fulfillments.splice(
    0,
    mockFixture.fulfillments.length,
    ...links.map((link) => ({
      offerComponents: [
        { orderIndex: BigInt(link[0]!), itemIndex: BigInt(link[1]!) },
      ],
      considerationComponents: [
        { orderIndex: BigInt(link[2]!), itemIndex: BigInt(link[3]!) },
      ],
    }))
  );
  mockFixture.reencode();
  mockFixture.operation.transaction!.value = selected.amount_wei;
  validateMarketBatchOperation(mockFixture.operation, mockFixture.request, [
    PAYER,
  ]);
  localStorage.setItem(
    `6529-market-batch:${mockFixture.request.profile_id}:${mockFixture.operation.id}`,
    JSON.stringify({ request: mockFixture.request })
  );
  return items;
}

it("adopts only original B when resuming its unsigned review from an A+B selection, without remounting or repeating publication", async () => {
  const items = resumeSecondSelectedOrder();
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  const onItemsChange = jest.fn();
  const content = () => (
    <QueryClientProvider client={client}>
      <CollectBatchController
        items={items}
        onClose={jest.fn()}
        onItemsChange={onItemsChange}
      />
    </QueryClientProvider>
  );
  const view = render(content());
  const draft = screen.getByLabelText("Delivery draft");
  fireEvent.change(draft, { target: { value: "retained delivery" } });
  const confirm = await screen.findByRole("button", {
    name: "Continue in wallet",
  });
  await waitFor(() => expect(onItemsChange).toHaveBeenCalledTimes(1));
  expect(onItemsChange.mock.calls[0]![0]).toEqual([items[1]]);
  expect(onItemsChange.mock.calls[0]![0][0]).toBe(items[1]);
  expect(mockReviewForm.mock.lastCall![0].items).toEqual([items[1]]);
  view.rerender(content());
  await act(async () => {
    await client.invalidateQueries({ queryKey: ["operation"] });
  });
  expect(onItemsChange).toHaveBeenCalledTimes(1);
  expect(screen.getByRole("button", { name: "Continue in wallet" })).toBe(
    confirm
  );
  expect(screen.getByLabelText("Delivery draft")).toBe(draft);
  expect(draft).toHaveValue("retained delivery");
  expect(mockPrepare).not.toHaveBeenCalled();
  expect(mockConfirm).not.toHaveBeenCalled();
});

it.each(["invalid terms", "pending", "known hash", "active attempt"])(
  "does not shrink selection for a resumed review with %s",
  async (reason) => {
    const items = resumeSecondSelectedOrder();
    if (reason === "invalid terms") mockFixture.operation.total_wei = "41";
    if (reason === "pending")
      mockFixture.operation.state = ApiMarketBatchOperationStateEnum.Unknown;
    if (reason === "known hash")
      mockFixture.operation.transaction_hash = `0x${"a".repeat(64)}`;
    if (reason === "active attempt") {
      const transaction = mockFixture.operation.transaction!;
      const attempt = createMarketSendAttempt(
        transaction,
        mockFixture.operation.block_number,
        mockFixture.operation.revision
      );
      mockFixture.operation.send_attempt = {
        attempt_id: attempt.id,
        purpose: ApiMarketBatchSendAttemptPurposeEnum.Transaction,
        transaction_digest: attempt.digest,
        snapshot_block: attempt.snapshotBlock,
        transaction,
        status: ApiMarketBatchSendAttemptStatusEnum.Active,
        transaction_hash: null,
      };
    }
    const onItemsChange = jest.fn();
    const client = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: 0 } },
    });
    render(
      <QueryClientProvider client={client}>
        <CollectBatchController
          items={items}
          onClose={jest.fn()}
          onItemsChange={onItemsChange}
        />
      </QueryClientProvider>
    );
    await screen.findByRole("heading", { level: 2 });
    await act(async () => {
      await client.invalidateQueries({ queryKey: ["operation"] });
    });
    expect(onItemsChange).not.toHaveBeenCalled();
    expect(mockReviewForm.mock.lastCall![0].items).toBe(items);
    expect(mockPrepare).not.toHaveBeenCalled();
    expect(mockConfirm).not.toHaveBeenCalled();
    if (reason === "pending")
      expect(
        screen.queryByRole("button", { name: "Continue in wallet" })
      ).not.toBeInTheDocument();
    if (reason === "active attempt")
      expect(
        screen.getByRole("textbox", {
          name: "Transaction hash from your wallet",
        })
      ).toBeInTheDocument();
  }
);
