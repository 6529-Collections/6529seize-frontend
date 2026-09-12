import CollectTradeController from "@/components/collect/CollectTradeController";
import { CollectTradeDialog } from "@/components/collect/CollectTradeSheet";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type {
  CollectTradeDraft,
  CollectTradeReview,
} from "@/components/collect/collect.types";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactNode } from "react";

const mockRecover = jest.fn();
const mockConfirm = jest.fn();
const mockFetchRecover = jest.fn();
interface RecoveryQuery {
  queryKey: readonly unknown[];
  queryFn: (context: { signal: AbortSignal }) => Promise<unknown>;
  enabled?: boolean;
}
const mockQueries: RecoveryQuery[] = [];
let mockPayingWallet = "0x1111111111111111111111111111111111111111";
const mockAuth = {
  connectedProfile: {
    id: "new-profile",
    primary_wallet: "0x1111111111111111111111111111111111111111",
    wallets: [
      { wallet: "0x1111111111111111111111111111111111111111" },
      { wallet: "0x2222222222222222222222222222222222222222" },
    ],
  },
  activeProfileProxy: null as object | null,
  isAuthenticated: true,
};
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => ({
    address: mockPayingWallet,
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
  QueryKey: { MARKET_OPERATION: "market-operation" },
}));
jest.mock("@tanstack/react-query", () => ({
  useQuery: (query: RecoveryQuery) => {
    mockQueries.push(query);
    return {
      data: undefined,
      isPending: false,
      isError: false,
      refetch: jest.fn(),
    };
  },
  useQueryClient: () => ({ invalidateQueries: jest.fn() }),
}));
jest.mock("@/components/collect/useMarketExecution", () => ({
  useMarketExecution: () => ({
    confirm: mockConfirm,
    recoverTransaction: mockRecover,
    clearMessage: jest.fn(),
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
  fetchRecoverableMarketOperation: (...args: unknown[]) =>
    mockFetchRecover(...args),
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
  default: ({ draft }: { draft: CollectTradeDraft }) => (
    <output aria-label="Trade recipient">{draft.recipient}</output>
  ),
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
  mockQueries.length = 0;
  mockRecover.mockResolvedValue(undefined);
  mockAuth.isAuthenticated = true;
  mockAuth.activeProfileProxy = null;
  mockPayingWallet = mockAuth.connectedProfile.primary_wallet;
});
it("keeps recovery bound to the original operation after the funding wallet changes profiles", async () => {
  render(
    <CollectTradeController
      action="buy"
      initialOperation={operation}
      onClose={jest.fn()}
    />
  );
  const query = mockQueries.find(
    (item) => item.queryKey[0] === "market-operation"
  );
  expect(query?.enabled).toBe(true);
  const signal = new AbortController().signal;
  await query!.queryFn({ signal });
  expect(mockFetchRecover).toHaveBeenCalledWith(
    operation.id,
    "original-profile",
    signal
  );
  expect(mockConfirm).not.toHaveBeenCalled();
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

it("defaults a new purchase to the confirmed paying wallet", () => {
  mockPayingWallet = "0x2222222222222222222222222222222222222222";
  render(<CollectTradeController action="buy" onClose={jest.fn()} />);
  expect(screen.getByLabelText("Trade recipient")).toHaveTextContent(
    mockPayingWallet
  );
});

it("keeps an explicitly selected plan recipient instead of the paying wallet", () => {
  mockPayingWallet = "0x2222222222222222222222222222222222222222";
  render(
    <CollectTradeController
      action="buy"
      initialRecipient="0x3333333333333333333333333333333333333333"
      onClose={jest.fn()}
    />
  );
  expect(screen.getByLabelText("Trade recipient")).toHaveTextContent(
    "0x3333333333333333333333333333333333333333"
  );
});

it("keeps embedded recovery in the existing dialog without creating a second modal", async () => {
  render(
    <CollectTradeDialog open title="Meme card" onClose={jest.fn()}>
      <CollectTradeController
        action="buy"
        initialOperation={operation}
        presentation="contents"
        onClose={jest.fn()}
      />
    </CollectTradeDialog>
  );
  expect(screen.getAllByRole("dialog")).toHaveLength(1);
  expect(screen.getByRole("dialog", { name: "Meme card" })).toContainElement(
    screen.getByRole("status")
  );
  expect(screen.getByRole("status")).toHaveTextContent("Checking the outcome");
  expect(
    screen.queryByRole("button", { name: "Continue to wallet" })
  ).not.toBeInTheDocument();
  const hash = `0x${"d".repeat(64)}`;
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
