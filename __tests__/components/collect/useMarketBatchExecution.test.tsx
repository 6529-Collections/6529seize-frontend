import { act, renderHook, waitFor } from "@testing-library/react";
import { useMarketBatchExecution } from "@/components/collect/useMarketBatchExecution";
import { confirmMarketBatch } from "@/components/collect/market-batch-execution";
import { batchFixture, PAYER } from "./market-batch.fixture";
import { t } from "@/i18n/messages";

const mockAuth = {
  isAuthenticated: true,
  activeProfileProxy: null,
  connectedProfile: { id: "profile", primary_wallet: PAYER },
};
const mockConnection = {
  address: PAYER,
  canSignActiveWallet: true,
  isSafeWallet: false,
};
const mockWallet = { account: { address: PAYER }, chain: { id: 1 } };
let mockWalletValue: typeof mockWallet | undefined = mockWallet;
const mockAccount = {
  address: PAYER,
  chainId: 1,
  connector: { uid: "injected-one" },
};
const mockClient = {};
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockConnection,
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("wagmi", () => ({
  useAccount: () => mockAccount,
  useWalletClient: () => ({ data: mockWalletValue }),
  usePublicClient: () => mockClient,
}));
jest.mock("@/components/collect/market-batch-execution", () => ({
  confirmMarketBatch: jest.fn(),
  recoverMarketBatch: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  mockWalletValue = mockWallet;
  mockAccount.connector = { uid: "injected-one" };
  mockAuth.connectedProfile.id = "profile";
  jest.mocked(confirmMarketBatch).mockImplementation(async (options) => {
    options.assertConnection();
    return "COMPLETE";
  });
});

it("exposes readiness and never replays a click made before the wallet exists", async () => {
  const { operation, request } = batchFixture();
  mockWalletValue = undefined;
  const { result, rerender } = renderHook(() =>
    useMarketBatchExecution(jest.fn())
  );
  expect(result.current.ready).toBe(false);
  await act(() => result.current.confirm(operation, request));
  expect(result.current.message).toMatch(/wallet.*ready/i);
  expect(confirmMarketBatch).not.toHaveBeenCalled();
  mockWalletValue = mockWallet;
  rerender();
  expect(result.current.ready).toBe(true);
  expect(confirmMarketBatch).not.toHaveBeenCalled();
  await act(() => result.current.confirm(operation, request));
  expect(confirmMarketBatch).toHaveBeenCalledTimes(1);
});

it.each(["equivalent", "connector ABA", "profile ABA", "unmount"])(
  "preserves semantic scope through asynchronous checking: %s",
  async (change) => {
    const { operation, request } = batchFixture();
    let finish!: () => void;
    const pending = new Promise<void>((resolve) => {
      finish = resolve;
    });
    const openedWallet = jest.fn();
    jest.mocked(confirmMarketBatch).mockImplementation(async (options) => {
      options.assertConnection();
      await pending;
      options.assertConnection();
      openedWallet();
      return "COMPLETE";
    });
    const { result, rerender, unmount } = renderHook(() =>
      useMarketBatchExecution(jest.fn())
    );
    let confirmation!: Promise<void>;
    act(() => {
      confirmation = result.current.confirm(operation, request);
    });
    await waitFor(() => expect(confirmMarketBatch).toHaveBeenCalled());
    if (change === "equivalent") mockWalletValue = { ...mockWallet };
    if (change === "connector ABA") mockAccount.connector = { uid: "other" };
    if (change === "profile ABA") mockAuth.connectedProfile.id = "other";
    rerender();
    mockAccount.connector = { uid: "injected-one" };
    mockAuth.connectedProfile.id = "profile";
    rerender();
    if (change === "unmount") unmount();
    await act(async () => {
      finish();
      await confirmation;
    });
    expect(openedWallet).toHaveBeenCalledTimes(change === "equivalent" ? 1 : 0);
  }
);

it("reports wallet and known-hash submission phases without releasing the busy guard", async () => {
  const { operation, request } = batchFixture();
  let finish!: () => void;
  const pending = new Promise<void>((resolve) => {
    finish = resolve;
  });
  const hash = `0x${"a".repeat(64)}` as const;
  jest.mocked(confirmMarketBatch).mockImplementation(async (options) => {
    options.onStage?.("wallet");
    await pending;
    options.onKnownHash?.(hash);
    options.onStage?.("reconciling");
    return "COMPLETE";
  });
  const { result } = renderHook(() => useMarketBatchExecution(jest.fn()));
  let confirmation!: Promise<void>;
  act(() => {
    confirmation = result.current.confirm(operation, request);
  });
  await waitFor(() => expect(result.current.stage).toBe("wallet"));
  expect(result.current.busy).toBe(true);
  await act(() => result.current.confirm(operation, request));
  expect(confirmMarketBatch).toHaveBeenCalledTimes(1);
  await act(async () => {
    finish();
    await confirmation;
  });
  expect(result.current.knownTransaction).toEqual({
    operationId: operation.id,
    hash,
  });
  expect(result.current.busy).toBe(false);
});

it.each([
  ["preparing", "collect.trade.preflightFailed"],
  ["reconciling", "collect.trade.recoveryFailed"],
] as const)(
  "reports a failure during %s without blaming the wallet",
  async (stage, key) => {
    const { operation, request } = batchFixture();
    jest.mocked(confirmMarketBatch).mockImplementation(async (options) => {
      options.onStage?.(stage);
      throw new Error("private RPC failure");
    });
    const { result } = renderHook(() => useMarketBatchExecution(jest.fn()));
    await act(() => result.current.confirm(operation, request));
    expect(result.current.message).toBe(t("en-US", key));
    expect(result.current.busy).toBe(false);
  }
);

it.each(["dismiss", "next action", "unrelated error"])(
  "clears the previous review notice on %s",
  async (action) => {
    const { operation, request } = batchFixture();
    const fresh = {
      ...operation,
      transaction: { ...operation.transaction!, gas_limit: "700000" },
    };
    jest.mocked(confirmMarketBatch).mockImplementationOnce(async (options) => {
      options.onReviewChange?.("gas", operation, fresh);
      return "UPDATED_REVIEW";
    });
    const { result } = renderHook(() => useMarketBatchExecution(jest.fn()));
    await act(() => result.current.confirm(operation, request));
    expect(result.current.reviewChangeNotice?.details).toHaveLength(1);
    expect(result.current.message).toBe(
      t("en-US", "collect.trade.networkFeeUpdated")
    );
    if (action === "dismiss") act(() => result.current.clearMessage());
    else {
      if (action === "unrelated error")
        jest
          .mocked(confirmMarketBatch)
          .mockRejectedValueOnce(new Error("RPC unavailable"));
      await act(() => result.current.confirm(operation, request));
    }
    expect(result.current.reviewChangeNotice).toBeUndefined();
    expect(result.current.message).toBe(
      action === "unrelated error"
        ? t("en-US", "collect.trade.preflightFailed")
        : undefined
    );
  }
);
