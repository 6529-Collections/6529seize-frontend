import CollectTradeController from "@/components/collect/CollectTradeController";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { CollectTradeReview } from "@/components/collect/collect.types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const mockRecover = jest.fn();
const mockConfirm = jest.fn();
const mockAuth = {
  connectedProfile: {
    id: "new-profile",
    primary_wallet: "0x1111111111111111111111111111111111111111",
  },
  activeProfileProxy: null as object | null,
  isAuthenticated: true,
};
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: mockAuth.connectedProfile.primary_wallet,
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
  QueryKey: {},
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: () => ({
    data: undefined,
    isPending: false,
    isError: false,
    refetch: jest.fn(),
  }),
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@/components/collect/useMarketExecution", () => ({
  useMarketExecution: () => ({
    confirm: mockConfirm,
    recoverTransaction: mockRecover,
    stage: null,
    message: undefined,
  }),
}));
jest.mock("@/components/collect/useMarketSettlement", () => ({
  useMarketSettlement: jest.fn(),
}));
jest.mock("@/components/collect/market-operation-storage", () => ({
  readMarketIntent: () => null,
}));
jest.mock("@/components/collect/market-recovery", () => ({
  marketOperationHasUnresolvedSend: (operation: ApiMarketOperation) =>
    operation.send_attempt?.status === "ACTIVE",
  marketOperationNeedsPolling: () => false,
}));
jest.mock("@/components/collect/collect-trade.helpers", () => ({
  marketConnectionReason: () => "collect.trade.unavailable",
}));
jest.mock("@/components/collect/market.adapters", () => ({
  marketOperationStage: () => "review",
  marketOperationReview: (): CollectTradeReview => ({
    id: "operation",
    revision: "revision",
    action: "buy",
    title: "Reviewed artwork",
    facts: [],
    technicalFacts: [],
    totalLabel: "1 ETH",
    totalDescription: "Purchase amount",
    warnings: [],
    expiresAt: null,
    disabledReason: "Trading is unavailable",
  }),
}));
jest.mock("@/components/collect/CollectTradeForm", () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock("@/components/collect/CollectOrderPicker", () => ({
  CollectOrderBook: () => null,
}));
jest.mock("@/components/mobile-wrapper-dialog/MobileWrapperDialog", () => ({
  __esModule: true,
  default: ({ children, title }: { children: ReactNode; title: string }) => (
    <div role="dialog" aria-label={title}>
      {children}
    </div>
  ),
}));

const operation = {
  id: "operation",
  profile_id: "original-profile",
  revision: "revision",
  state: "REVIEW",
  send_attempt: { status: "ACTIVE" },
} as ApiMarketOperation;
beforeEach(() => {
  jest.clearAllMocks();
  mockRecover.mockResolvedValue(undefined);
  mockAuth.isAuthenticated = true;
  mockAuth.activeProfileProxy = null;
});
it("offers hash recovery with no local intent after profile migration and disabled trading", async () => {
  render(
    <CollectTradeController
      action="buy"
      initialOperation={operation}
      onClose={jest.fn()}
    />
  );
  expect(screen.getByRole("status")).toHaveTextContent("Checking the outcome");
  expect(
    screen.queryByRole("button", { name: "Continue to wallet" })
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("button", { name: "Refresh review" })
  ).not.toBeInTheDocument();
  const hash = `0x${"c".repeat(64)}`;
  fireEvent.change(
    screen.getByRole("textbox", { name: "Transaction hash from your wallet" }),
    { target: { value: hash } }
  );
  fireEvent.click(
    screen.getByRole("button", { name: "Check this transaction" })
  );
  await waitFor(() =>
    expect(mockRecover).toHaveBeenCalledWith(operation, hash)
  );
  expect(mockConfirm).not.toHaveBeenCalled();
});
it.each(["unauthenticated", "proxy"])(
  "disables the recovery callback for an %s session",
  (mode) => {
    mockAuth.isAuthenticated = mode !== "unauthenticated";
    mockAuth.activeProfileProxy = mode === "proxy" ? {} : null;
    render(
      <CollectTradeController
        action="buy"
        initialOperation={operation}
        onClose={jest.fn()}
      />
    );
    expect(
      screen.getByRole("button", { name: "Check this transaction" })
    ).toBeDisabled();
    expect(mockRecover).not.toHaveBeenCalled();
  }
);
