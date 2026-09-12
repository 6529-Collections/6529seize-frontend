import CollectOrdersClient from "@/components/collect/CollectOrdersClient";
import type CollectOrdersView from "@/components/collect/CollectOrdersView";
import type CollectBatchController from "@/components/collect/CollectBatchController";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ComponentProps } from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { batchFixture, PAYER } from "./market-batch.fixture";
const batch = batchFixture().operation;
const single = { id: "single", kind: "BUY" } as ApiMarketOperation;
const mockBatch = jest.fn(),
  mockSingle = jest.fn();
jest.mock("@/components/auth/Auth", () => ({
  useAuth: () => ({
    connectedProfile: { id: "profile", primary_wallet: PAYER, wallets: [] },
    isAuthenticated: true,
  }),
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
  useInfiniteQuery: () => ({
    data: { pages: [{ operations: [batch, single] }] },
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
  default: (props: unknown) => {
    mockSingle(props);
    return null;
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
