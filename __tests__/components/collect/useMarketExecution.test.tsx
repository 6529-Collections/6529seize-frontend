import { act, renderHook } from "@testing-library/react";
import { useMarketExecution } from "@/components/collect/useMarketExecution";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";

const walletAddress = "0x1111111111111111111111111111111111111111";
const hash = `0x${"a".repeat(64)}`;
const mockWallet = {
  getChainId: jest.fn(),
  getAddresses: jest.fn(),
  signTypedData: jest.fn(),
  sendTransaction: jest.fn(),
};
const mockClient = {
  getCode: jest.fn(),
  call: jest.fn(),
  estimateGas: jest.fn(),
  estimateFeesPerGas: jest.fn(),
  waitForTransactionReceipt: jest.fn(),
};
const mockCapabilities = jest.fn();
const mockFetch = jest.fn();
const mockSignature = jest.fn();
const mockSubmission = jest.fn();
const mockContinue = jest.fn();
const mockRead = jest.fn();
const mockValidate = jest.fn();
const mockSave = jest.fn();
const mockLock = jest.fn();
const mockAuth = {
  isAuthenticated: true,
  activeProfileProxy: null as object | null,
  connectedProfile: { id: "profile-one" },
};
const mockConnection = {
  canSignActiveWallet: true,
  isSafeWallet: false,
  address: walletAddress,
};
jest.mock("@/components/auth/Auth", () => ({ useAuth: () => mockAuth }));
jest.mock("@/components/auth/SeizeConnectContext", () => ({
  useSeizeConnectContext: () => mockConnection,
}));
jest.mock("@/hooks/useBrowserLocale", () => ({
  useBrowserLocale: () => "en-US",
}));
jest.mock("wagmi", () => ({
  useWalletClient: () => ({ data: mockWallet }),
  usePublicClient: () => mockClient,
}));
jest.mock("@/services/api/collect-api", () => ({
  fetchCollectCapabilities: (...args: unknown[]) => mockCapabilities(...args),
}));
jest.mock("@/services/api/market-api", () => ({
  fetchMarketOperation: (...args: unknown[]) => mockFetch(...args),
  continueMarketOperation: (...args: unknown[]) => mockContinue(...args),
  submitMarketSignature: (...args: unknown[]) => mockSignature(...args),
  submitMarketTransaction: (...args: unknown[]) => mockSubmission(...args),
}));
jest.mock("@/components/collect/market-operation-storage", () => ({
  readMarketIntent: (...args: unknown[]) => mockRead(...args),
  saveMarketIntent: (...args: unknown[]) => mockSave(...args),
}));
jest.mock("@/components/collect/market-operation-lock", () => ({
  withMarketOperationLock: (...args: unknown[]) => mockLock(...args),
}));
jest.mock("@/components/collect/market-validation", () => ({
  validateMarketOperation: (...args: unknown[]) => mockValidate(...args),
  validateMarketTransaction: jest.fn(),
  marketTypedData: () => ({
    domain: { chainId: 1 },
    types: {},
    primaryType: "OrderComponents",
    message: {},
  }),
}));

const expected = {
  profile_id: "profile-one",
  wallet: walletAddress,
  kind: "LIST",
} as ApiMarketPrepareRequest;
const operation = {
  id: "operation-1",
  profile_id: "profile-one",
  revision: "revision-1",
  state: "AWAITING_SIGNATURE",
  kind: "LIST",
  approval_transactions: [],
  order: { components: {} },
} as ApiMarketOperation;

beforeEach(() => {
  jest.clearAllMocks();
  mockAuth.isAuthenticated = true;
  mockAuth.activeProfileProxy = null;
  mockAuth.connectedProfile.id = "profile-one";
  mockConnection.canSignActiveWallet = true;
  mockConnection.isSafeWallet = false;
  mockConnection.address = walletAddress;
  mockCapabilities.mockResolvedValue({
    actions: [{ action: "LIST", enabled: true }],
  });
  mockFetch.mockResolvedValue(operation);
  mockRead.mockReturnValue(null);
  mockSave.mockReturnValue(true);
  mockLock.mockImplementation((_id: string, execute: () => Promise<void>) =>
    execute()
  );
  mockValidate.mockImplementation(() => undefined);
  mockWallet.getChainId.mockResolvedValue(1);
  mockWallet.getAddresses.mockResolvedValue([walletAddress]);
  mockWallet.signTypedData.mockResolvedValue("0x1234");
  mockClient.getCode.mockResolvedValue("0x");
  mockSignature.mockResolvedValue({ ...operation, state: "LIVE" });
  mockClient.call.mockResolvedValue({});
  mockClient.estimateGas.mockResolvedValue(80n);
  mockClient.estimateFeesPerGas.mockResolvedValue({
    maxFeePerGas: 2n,
    maxPriorityFeePerGas: 1n,
  });
  mockWallet.sendTransaction.mockResolvedValue(hash);
});

it("requires durable recovery storage before opening the wallet", async () => {
  mockSave.mockReturnValue(false);
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});
it("blocks a second tab before opening the wallet", async () => {
  mockLock.mockRejectedValue(new Error("LOCKED"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockFetch).not.toHaveBeenCalled();
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("moves an already-approved new order into signature review before signing", async () => {
  const review = { ...operation, state: "REVIEW" } as ApiMarketOperation;
  mockFetch.mockResolvedValue(review);
  mockContinue.mockResolvedValue(operation);
  const onOperation = jest.fn();
  const { result } = renderHook(() => useMarketExecution(onOperation));
  await act(() => result.current.confirm(review, expected));
  expect(mockContinue).toHaveBeenCalledWith(operation.id);
  expect(onOperation).toHaveBeenCalledWith(operation);
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("clears a mined reverted approval so a later review can recover", async () => {
  mockRead.mockReturnValue({ request: expected, approvalHash: hash });
  mockClient.waitForTransactionReceipt.mockResolvedValue({
    status: "reverted",
  });
  mockContinue.mockResolvedValue(operation);
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockSave).toHaveBeenCalledWith(expected.profile_id, operation.id, {
    request: expected,
  });
  expect(mockContinue).toHaveBeenCalledWith(operation.id);
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});

it("never opens a wallet prompt when the server capability is disabled", async () => {
  mockCapabilities.mockResolvedValue({
    actions: [{ action: "LIST", enabled: false }],
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});
it("requires review again when the prepared revision changes", async () => {
  const changed = { ...operation, revision: "revision-2" };
  mockFetch.mockResolvedValue(changed);
  const onOperation = jest.fn();
  const { result } = renderHook(() => useMarketExecution(onOperation));
  await act(() => result.current.confirm(operation, expected));
  expect(onOperation).toHaveBeenCalledWith(changed);
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("never signs in profile proxy mode", async () => {
  mockAuth.activeProfileProxy = {};
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockCapabilities).not.toHaveBeenCalled();
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("rejects contract-wallet execution before requesting a signature", async () => {
  mockClient.getCode.mockResolvedValue("0x1234");
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("rejects another chain before requesting a signature", async () => {
  mockWallet.getChainId.mockResolvedValue(8453);
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("checks the payload before the wallet is invoked", async () => {
  mockValidate.mockImplementation(() => {
    throw new Error("MISMATCH");
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("publishes only the exact signature returned for the reviewed operation", async () => {
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockSignature).toHaveBeenCalledWith("operation-1", {
    signature: "0x1234",
  });
  expect(mockWallet.signTypedData).toHaveBeenCalledTimes(1);
});
it("retries attachment of an already-sent hash without sending a new transaction", async () => {
  mockRead.mockReturnValue({ request: expected, transactionHash: hash });
  mockSubmission.mockResolvedValue({ ...operation, state: "SUBMITTED" });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockSubmission).toHaveBeenCalledWith(operation.id, {
    transaction_hash: hash,
  });
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});

function buyReview() {
  const buyExpected = { ...expected, kind: "BUY" } as ApiMarketPrepareRequest;
  const buyOperation = {
    ...operation,
    kind: "BUY",
    state: "REVIEW",
    transaction: {
      chain_id: 1,
      sender: walletAddress,
      to: walletAddress,
      value: "1000",
      data: "0x",
      purpose: "FULFILL",
      gas_limit: "100",
      max_fee_per_gas: "2",
      gas_reserve_wei: "200",
    },
  } as ApiMarketOperation;
  mockCapabilities.mockResolvedValue({
    actions: [{ action: "BUY", enabled: true }],
  });
  mockFetch.mockResolvedValue(buyOperation);
  mockContinue.mockResolvedValue(buyOperation);
  mockSubmission.mockResolvedValue({ ...buyOperation, state: "SUBMITTED" });
  return { buyExpected, buyOperation };
}
it("checks paused rule continuation before opening a purchase wallet prompt", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockContinue.mockRejectedValue(new Error("RULE_PAUSED"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});
it("requires a new review when refreshed gas terms change", async () => {
  const { buyExpected, buyOperation } = buyReview();
  const changed = {
    ...buyOperation,
    transaction: { ...buyOperation.transaction, gas_limit: "200" },
  };
  mockContinue.mockResolvedValue(changed);
  const onOperation = jest.fn();
  const { result } = renderHook(() => useMarketExecution(onOperation));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(onOperation).toHaveBeenCalledWith(changed);
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});
it("sends the reviewed gas ceilings without silently increasing them", async () => {
  const { buyExpected, buyOperation } = buyReview();
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).toHaveBeenCalledWith(
    expect.objectContaining({
      gas: 100n,
      maxFeePerGas: 2n,
      maxPriorityFeePerGas: 1n,
    })
  );
  expect(mockSave).toHaveBeenCalledWith(expected.profile_id, operation.id, {
    request: buyExpected,
    transactionHash: hash,
  });
});
it("never sends when simulation exceeds the reviewed gas limit", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockClient.estimateGas.mockResolvedValue(101n);
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});
