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

let mockFixture = batchFixture();
let mockNative = false;
let mockAddress = PAYER;
let mockProfile: ApiIdentity;
const mockPrepare = jest.fn(),
  mockConfirm = jest.fn();
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
jest.mock("@/components/collect/CollectTradeSheet", () => ({
  CollectTradeDialog: ({ children }: { children: ReactNode }) => (
    <div role="dialog">{children}</div>
  ),
}));
jest.mock("@/components/collect/CollectBatchReviewForm", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectBatchReviewForm>) => (
    <div>
      <input aria-label="Delivery draft" defaultValue="unchanged destination" />
      <button
        disabled={props.loading || Boolean(props.disabledReason)}
        onClick={() => props.onPrepare({ items: [] })}
      >
        Check selected purchases
      </button>
      {props.error && <p role="alert">{props.error}</p>}
      {props.disabledReason && <p role="status">{props.disabledReason}</p>}
    </div>
  ),
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
    busy: false,
    confirm: mockConfirm,
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
function mount(initialOperation = false) {
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
  await screen.findByRole("button", { name: /^Collect / });
  expect(mockPrepare).toHaveBeenCalledTimes(2);
  expect(mockPrepare.mock.calls[1]).toEqual(mockPrepare.mock.calls[0]);
  expect(mockConfirm).not.toHaveBeenCalled();
});

it("prepares once, focuses review without signing, and preserves the edited destination when returning to the draft", async () => {
  mount();
  const draft = screen.getByLabelText("Delivery draft");
  fireEvent.change(draft, { target: { value: "selected fren" } });
  const prepare = screen.getByRole("button", {
    name: "Check selected purchases",
  });
  await waitFor(() => expect(prepare).toBeEnabled());
  fireEvent.click(prepare);
  const buy = await screen.findByRole("button", { name: /^Collect / });
  expect(mockPrepare).toHaveBeenCalledTimes(1);
  expect(mockConfirm).not.toHaveBeenCalled();
  expect(screen.getByRole("heading", { level: 2 })).toHaveFocus();
  await waitFor(() => expect(buy).toBeEnabled());
  fireEvent.click(buy);
  expect(mockConfirm).toHaveBeenCalledWith(
    mockFixture.operation,
    mockFixture.request
  );
  fireEvent.click(screen.getByRole("button", { name: "Edit purchase" }));
  await waitFor(() =>
    expect(screen.getByLabelText("Delivery draft")).toBeVisible()
  );
  expect(screen.getByLabelText("Delivery draft")).toBe(draft);
  expect(draft).toHaveValue("selected fren");
});
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
      screen.queryByRole("button", { name: /^Collect / })
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
  expect(screen.getByRole("button", { name: /^Collect / })).toBeDisabled();
  expect(mockPrepare).not.toHaveBeenCalled();
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
      screen.queryByRole("button", { name: /^Collect / })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Check selected purchases" })
    ).toBeVisible();
    expect(mockConfirm).not.toHaveBeenCalled();
  }
);
