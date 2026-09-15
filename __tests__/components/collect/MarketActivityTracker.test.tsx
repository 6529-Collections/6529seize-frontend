import MarketActivityTracker from "@/components/collect/MarketActivityTracker";
import {
  readPendingMarketPurchases,
  recordMarketActivity,
} from "@/components/collect/market-activity-store";
import { fetchRecoverableMarketOperation } from "@/components/collect/market-recovery";
import { fetchRecoverableMarketBatch } from "@/components/collect/market-batch-recovery";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import {
  ApiMarketOperationStateEnum as State,
  type ApiMarketOperation,
} from "@/generated/models/ApiMarketOperation";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";

let sequence = 0;
const mockAuth = {
  connectedProfile: { id: "" },
  isAuthenticated: true,
  activeProfileProxy: null as object | null,
};
let mockPathname = "/collect";
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("next/navigation", () => ({ usePathname: () => mockPathname }));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { MARKET_OPERATION: "market-operation" },
}));
jest.mock("@/components/collect/market-recovery", () => ({
  fetchRecoverableMarketOperation: jest.fn(),
}));
jest.mock("@/components/collect/market-batch-recovery", () => ({
  fetchRecoverableMarketBatch: jest.fn(),
}));
jest.mock("@/components/collect/useMarketSettlement", () => ({
  invalidateMarketSettlement: jest.fn(),
}));

function operation(
  state = State.Submitted,
  kind = ApiMarketKind.Buy
): ApiMarketOperation {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    profile_id: mockAuth.connectedProfile.id,
    kind,
    state,
    updated_at: 1000,
    asset_key: `1:0x${"1".repeat(40)}:1`,
    order_hash: `0x${"2".repeat(64)}`,
    quantity: "1",
    wallet: `0x${"3".repeat(40)}`,
    transaction_hash:
      state === State.Submitted ? `0x${"4".repeat(64)}` : undefined,
  } as ApiMarketOperation;
}
function setup(value: ApiMarketOperation, resolved = value) {
  recordMarketActivity(value);
  jest.mocked(fetchRecoverableMarketOperation).mockResolvedValue(resolved);
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  const tree = () => (
    <QueryClientProvider client={client}>
      <button>Page action</button>
      <MarketActivityTracker />
    </QueryClientProvider>
  );
  return { ...render(tree()), tree };
}
beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.connectedProfile = { id: `tracker-${++sequence}` };
  mockAuth.isAuthenticated = true;
  mockAuth.activeProfileProxy = null;
  mockPathname = "/collect";
});
afterEach(() => jest.useRealTimers());

it("reassures only known submission and recovers the exact existing operation", async () => {
  const value = operation();
  setup(value);
  expect(screen.getByText("Your transaction is processing")).toBeVisible();
  expect(
    screen.getByText(/You can leave this page\. Your transaction will continue/)
  ).toBeVisible();
  expect(screen.getByRole("link", { name: "View in Orders" })).toHaveAttribute(
    "href",
    `/collect/orders?operation=${value.id}&kind=BUY`
  );
  await waitFor(() =>
    expect(fetchRecoverableMarketOperation).toHaveBeenCalledWith(
      value.id,
      value.profile_id,
      expect.any(AbortSignal)
    )
  );
  expect(fetchRecoverableMarketBatch).not.toHaveBeenCalled();
});

it("caps background reads at 20 pending operations while retaining all activity and Orders access", async () => {
  const values = Array.from({ length: 25 }, (_, index) => ({
    ...operation(),
    id: `11111111-1111-4111-8111-${String(index).padStart(12, "0")}`,
    updated_at: 1000 + index,
  }));
  const byId = new Map(values.map((value) => [value.id, value]));
  for (const value of values) recordMarketActivity(value);
  jest
    .mocked(fetchRecoverableMarketOperation)
    .mockImplementation(async (id) => {
      const value = byId.get(id);
      if (!value) throw new Error("Unexpected operation lookup");
      return value;
    });
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity } },
  });
  render(
    <QueryClientProvider client={client}>
      <MarketActivityTracker />
    </QueryClientProvider>
  );
  await waitFor(() =>
    expect(fetchRecoverableMarketOperation).toHaveBeenCalledTimes(20)
  );
  expect(fetchRecoverableMarketBatch).not.toHaveBeenCalled();
  expect(client.getQueryCache().getAll()).toHaveLength(20);
  expect(
    new Set(
      jest.mocked(fetchRecoverableMarketOperation).mock.calls.map(([id]) => id)
    ).size
  ).toBe(20);
  expect(readPendingMarketPurchases(mockAuth.connectedProfile.id)).toHaveLength(
    25
  );
  expect(screen.getByRole("link", { name: "View in Orders" })).toBeVisible();
  expect(screen.getByRole("link", { name: "View in Orders" })).toHaveAttribute(
    "href",
    `/collect/orders?operation=${values.at(-1)!.id}&kind=BUY`
  );
});

it.each([State.Unknown, State.Publishing, State.CancelPending])(
  "never calls %s a submitted transaction",
  (state) => {
    setup(operation(state));
    expect(screen.getByText("Checking transaction progress")).toBeVisible();
    expect(
      screen.getByText(/No new transaction will be sent automatically/)
    ).toBeVisible();
    expect(
      screen.queryByText(/Your transaction will continue/)
    ).not.toBeInTheDocument();
  }
);

it.each([
  [State.Confirmed, ApiMarketKind.Buy, "Your purchase is confirmed"],
  [State.Confirmed, ApiMarketKind.Accept, "Your sale is confirmed"],
  [State.Live, ApiMarketKind.List, "Your listing is live"],
  [State.Live, ApiMarketKind.Offer, "Your offer is live"],
  [State.Cancelled, ApiMarketKind.Cancel, "Order cancelled"],
  [State.Expired, ApiMarketKind.List, "This order has expired"],
  [State.Failed, ApiMarketKind.Buy, "Your transaction did not complete"],
])("announces the actual %s %s outcome", async (state, kind, title) => {
  const value = operation(State.Submitted, kind);
  setup(value, { ...value, state, updated_at: 2000 });
  screen.getByRole("button", { name: "Page action" }).focus();
  await waitFor(() => expect(screen.getByText(title)).toBeVisible());
  expect(
    screen.queryByText("Your activity is confirmed")
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Page action" })).toHaveFocus();
});

it("hides private activity on profile switch, sign-out, proxy mode and Orders", async () => {
  const value = operation();
  const { rerender, tree } = setup(value);
  await waitFor(() =>
    expect(fetchRecoverableMarketOperation).toHaveBeenCalledTimes(1)
  );
  mockAuth.connectedProfile = { id: "another-profile" };
  rerender(tree());
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  mockAuth.connectedProfile = { id: value.profile_id };
  mockAuth.isAuthenticated = false;
  rerender(tree());
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  mockAuth.isAuthenticated = true;
  mockAuth.activeProfileProxy = {};
  rerender(tree());
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
  mockAuth.activeProfileProxy = null;
  mockPathname = "/collect/orders";
  rerender(tree());
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

it("does not replay a completion notification when switching away from a profile and back", async () => {
  const value = operation();
  const { rerender, tree } = setup(value, {
    ...value,
    state: State.Confirmed,
    updated_at: 2000,
  });
  await waitFor(() =>
    expect(screen.getByText("Your purchase is confirmed")).toBeVisible()
  );
  fireEvent.focus(screen.getByRole("link", { name: "View in Orders" }));
  mockAuth.connectedProfile = { id: "another-profile" };
  rerender(tree());
  mockAuth.connectedProfile = { id: value.profile_id };
  rerender(tree());
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});

it("keeps completion available while its link has keyboard focus", async () => {
  const value = operation();
  setup(value, { ...value, state: State.Confirmed, updated_at: 2000 });
  await waitFor(() =>
    expect(screen.getByText("Your purchase is confirmed")).toBeVisible()
  );
  const link = screen.getByRole("link", { name: "View in Orders" });
  fireEvent.focus(link);
  jest.useFakeTimers();
  await act(async () => {
    jest.advanceTimersByTime(11_000);
  });
  expect(link).toBeVisible();
  fireEvent.blur(link, {
    relatedTarget: screen.getByRole("button", { name: "Page action" }),
  });
  await act(async () => {
    jest.advanceTimersByTime(10_000);
  });
  expect(screen.queryByRole("complementary")).not.toBeInTheDocument();
});
