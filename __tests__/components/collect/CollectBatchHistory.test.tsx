import CollectOrdersClient from "@/components/collect/CollectOrdersClient";
import type CollectOrdersView from "@/components/collect/CollectOrdersView";
import type CollectBatchController from "@/components/collect/CollectBatchController";
import type CollectTradeController from "@/components/collect/CollectTradeController";
import { fetchRecoverableMarketOperation } from "@/components/collect/market-recovery";
import { fetchRecoverableMarketBatch } from "@/components/collect/market-batch-recovery";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { batchFixture, PAYER } from "./market-batch.fixture";
const batch = batchFixture().operation;
const single = {
  id: "single",
  kind: "BUY",
  state: "REVIEW",
  profile_id: "profile",
} as ApiMarketOperation;
const mockBatch = jest.fn(),
  mockSingle = jest.fn();
let mockReceipt: unknown;
const mockAuth = {
  connectedProfile: { id: "profile", primary_wallet: PAYER, wallets: [] },
  isAuthenticated: true,
  activeProfileProxy: null as object | null,
};
interface ReceiptQuery {
  queryKey: unknown[];
  enabled?: boolean;
  queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
}
const mockQueries: ReceiptQuery[] = [];
let mockHistory = [batch, single];
beforeEach(() => {
  jest.clearAllMocks();
  mockReceipt = undefined;
  mockQueries.length = 0;
  mockAuth.connectedProfile.id = "profile";
  mockAuth.isAuthenticated = true;
  mockAuth.activeProfileProxy = null;
  mockHistory = [batch, single];
});
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => mockAuth,
}));
jest.mock("@/components/collect/market-recovery", () => ({
  fetchRecoverableMarketOperation: jest.fn(),
}));
jest.mock("@/components/collect/market-batch-recovery", () => ({
  fetchRecoverableMarketBatch: jest.fn(),
}));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({ seizeConnect: jest.fn() }),
}));
jest.mock("@/components/react-query-wrapper/ReactQueryWrapper", () => ({
  QueryKey: { MARKET_MY_OPERATIONS: "history" },
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: (query: ReceiptQuery) => {
    mockQueries.push(query);
    return {
      data: query.queryKey.includes("live-receipts") ? undefined : mockReceipt,
    };
  },
  useInfiniteQuery: () => ({
    data: { pages: [{ operations: mockHistory }] },
    isPending: false,
    isError: false,
  }),
}));
jest.mock("@/components/collect/CollectOrdersView", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectOrdersView>) => (
    <div>
      {props.orders.map((order) => (
        <div key={order.id}>
          <button onClick={() => props.onInspect(order.id)}>
            Inspect {order.id}
          </button>
          <button onClick={() => props.onCancel(order.id)}>
            Cancel {order.id}
          </button>
          <output>{String(order.cancellable)}</output>
        </div>
      ))}
    </div>
  ),
}));
jest.mock("@/components/collect/CollectBatchController", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectBatchController>) => {
    mockBatch(props);
    return <button onClick={props.onClose}>Close recovered batch</button>;
  },
}));
jest.mock("@/components/collect/CollectTradeController", () => ({
  __esModule: true,
  default: (props: ComponentProps<typeof CollectTradeController>) => {
    mockSingle(props);
    return <button onClick={props.onClose}>Close recovered single</button>;
  },
}));
jest.mock("@/components/collect/CollectRulesPanel", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/market.adapters", () => ({
  marketAmount: (value: string) => value,
  marketOperationView: (operation: ApiMarketOperation) => ({
    id: operation.id,
    cancellable: false,
  }),
}));

it("opens the complete batch as a recovery operation, never a fabricated first leg or cancellable order", () => {
  render(<CollectOrdersClient />);
  fireEvent.click(screen.getByRole("button", { name: `Cancel ${batch.id}` }));
  expect(mockBatch).not.toHaveBeenCalled();
  expect(mockSingle).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: `Inspect ${batch.id}` }));
  expect(mockBatch).toHaveBeenLastCalledWith(
    expect.objectContaining({ initialOperation: batch, items: [] })
  );
  expect(mockSingle).not.toHaveBeenCalled();
  fireEvent.click(
    screen.getByRole("button", { name: "Close recovered batch" })
  );
  fireEvent.click(screen.getByRole("button", { name: "Inspect single" }));
  expect(mockSingle).toHaveBeenLastCalledWith(
    expect.objectContaining({ initialOperation: single, action: "buy" })
  );
});

it("opens an exact batch receipt link once without reopening it after Close", () => {
  mockReceipt = { ...batch, profile_id: "profile" };
  const { rerender } = render(
    <CollectOrdersClient initialOperationId={batch.id} initialBatch />
  );
  expect(mockBatch).toHaveBeenLastCalledWith(
    expect.objectContaining({ initialOperation: mockReceipt })
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Close recovered batch" })
  );
  rerender(<CollectOrdersClient initialOperationId={batch.id} initialBatch />);
  expect(
    screen.queryByRole("button", { name: "Close recovered batch" })
  ).not.toBeInTheDocument();
});

it("does not open a receipt belonging to another profile", () => {
  mockReceipt = { ...batch, profile_id: "different-profile" };
  render(<CollectOrdersClient initialOperationId={batch.id} initialBatch />);
  expect(mockBatch).not.toHaveBeenCalled();
});

it.each(["sign-out", "proxy", "profile switch"])(
  "closes a selected receipt on %s and never exposes cached cross-profile history",
  (change) => {
    const { rerender } = render(<CollectOrdersClient />);
    fireEvent.click(screen.getByRole("button", { name: "Inspect single" }));
    expect(
      screen.getByRole("button", { name: "Close recovered single" })
    ).toBeVisible();
    if (change === "sign-out") mockAuth.isAuthenticated = false;
    if (change === "proxy") mockAuth.activeProfileProxy = {};
    if (change === "profile switch")
      mockAuth.connectedProfile.id = "different-profile";
    rerender(<CollectOrdersClient />);
    expect(
      screen.queryByRole("button", { name: "Close recovered single" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Inspect single" })
    ).not.toBeInTheDocument();
  }
);

it("does not open a cached receipt while signed out or using a proxy", () => {
  mockReceipt = batch;
  mockAuth.isAuthenticated = false;
  const { rerender } = render(
    <CollectOrdersClient initialOperationId={batch.id} initialBatch />
  );
  expect(mockBatch).not.toHaveBeenCalled();
  expect(mockQueries.every((query) => query.enabled === false)).toBe(true);
  mockAuth.isAuthenticated = true;
  mockAuth.activeProfileProxy = {};
  rerender(<CollectOrdersClient initialOperationId={batch.id} initialBatch />);
  expect(mockBatch).not.toHaveBeenCalled();
});

it("filters an unexpected profile out of returned history", () => {
  mockHistory = [
    { ...batch, id: "foreign", profile_id: "different-profile" },
    single,
  ];
  render(<CollectOrdersClient />);
  expect(
    screen.queryByRole("button", { name: "Inspect foreign" })
  ).not.toBeInTheDocument();
  expect(screen.getByRole("button", { name: "Inspect single" })).toBeVisible();
});

it.each([true, false])(
  "reopens the exact existing operation using the batch=%s recovery endpoint",
  async (initialBatch) => {
    render(
      <CollectOrdersClient
        initialOperationId={batch.id}
        initialBatch={initialBatch}
      />
    );
    const query = mockQueries.find(
      (value) => !value.queryKey.includes("live-receipts")
    )!;
    const signal = new AbortController().signal;
    await query.queryFn({ signal });
    const fetch = initialBatch
      ? fetchRecoverableMarketBatch
      : fetchRecoverableMarketOperation;
    const other = initialBatch
      ? fetchRecoverableMarketOperation
      : fetchRecoverableMarketBatch;
    expect(fetch).toHaveBeenCalledWith(batch.id, "profile", signal);
    expect(other).not.toHaveBeenCalled();
    expect(mockSingle).not.toHaveBeenCalled();
    expect(mockBatch).not.toHaveBeenCalled();
  }
);
