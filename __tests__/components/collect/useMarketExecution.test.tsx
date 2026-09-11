import { act, renderHook } from "@testing-library/react";
import { useMarketExecution } from "@/components/collect/useMarketExecution";
import {
  ApiMarketOperationStateEnum,
  type ApiMarketOperation,
} from "@/generated/models/ApiMarketOperation";
import { ApiMarketKind } from "@/generated/models/ApiMarketKind";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import type { ApiMarketSendAttemptRequest } from "@/generated/models/ApiMarketSendAttemptRequest";
import { createMarketSendAttempt } from "@/components/collect/market-send-attempt";

const walletAddress = "0x1111111111111111111111111111111111111111";
const hash = `0x${"a".repeat(64)}`;
const mockWallet = {
  getChainId: jest.fn(),
  getAddresses: jest.fn(),
  signTypedData: jest.fn(),
  sendTransaction: jest.fn(),
};
const mockClient = {
  getChainId: jest.fn(),
  getTransaction: jest.fn(),
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
const mockBegin = jest.fn();
const mockReject = jest.fn();
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
  beginMarketTransactionAttempt: (...args: unknown[]) => mockBegin(...args),
  rejectMarketTransactionAttempt: (...args: unknown[]) => mockReject(...args),
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
const operation: ApiMarketOperation = {
  id: "operation-1",
  profile_id: "profile-one",
  revision: "revision-1",
  state: ApiMarketOperationStateEnum.AwaitingSignature,
  kind: ApiMarketKind.List,
  wallet: walletAddress,
  recipient: walletAddress,
  recipient_in_profile: true,
  asset_key: "1:0x33fd426905f149f8376e227d0c9d3340aad17af1:1",
  quantity: "1",
  currency: "0x0000000000000000000000000000000000000000",
  total_wei: "1000",
  net_wei: "1000",
  fees: [],
  approval_transactions: [],
  order: {
    protocol_address: "0x0000000000000068f116a894984e2db1123eb395",
    order_hash: hash,
    digest: hash,
    components: {
      offerer: walletAddress,
      zone: "0x0000000000000000000000000000000000000000",
      offer: [],
      consideration: [],
      order_type: 0,
      start_time: "1",
      end_time: "2",
      zone_hash: `0x${"0".repeat(64)}`,
      salt: "0",
      conduit_key: `0x${"0".repeat(64)}`,
      counter: "0",
    },
  },
  expires_at: 2,
  updated_at: 1,
  potential_liability_wei: "0",
};
let persisted: Record<string, unknown> | null = null;

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
  persisted = null;
  mockRead.mockImplementation(() => persisted);
  mockSave.mockImplementation(
    (_profile: string, _id: string, value: Record<string, unknown>) => {
      persisted = value;
      return true;
    }
  );
  mockLock.mockImplementation((_id: string, execute: () => Promise<void>) =>
    execute()
  );
  mockValidate.mockImplementation(() => undefined);
  mockWallet.getChainId.mockResolvedValue(1);
  mockWallet.getAddresses.mockResolvedValue([walletAddress]);
  mockWallet.signTypedData.mockResolvedValue("0x1234");
  mockClient.getCode.mockResolvedValue("0x");
  mockClient.getChainId.mockResolvedValue(1);
  mockSignature.mockResolvedValue({ ...operation, state: "LIVE" });
  mockClient.call.mockResolvedValue({});
  mockClient.estimateGas.mockResolvedValue(80n);
  mockClient.estimateFeesPerGas.mockResolvedValue({
    maxFeePerGas: 2n,
    maxPriorityFeePerGas: 1n,
  });
  mockWallet.sendTransaction.mockResolvedValue(hash);
  mockReject.mockReset();
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
it("clears a mined reverted legacy approval without advancing the operation", async () => {
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
  expect(mockContinue).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("continues a successful legacy approval without requesting another wallet transaction", async () => {
  mockRead.mockReturnValue({ request: expected, approvalHash: hash });
  mockClient.waitForTransactionReceipt.mockResolvedValue({ status: "success" });
  mockContinue.mockResolvedValue(operation);
  const onOperation = jest.fn();
  const { result } = renderHook(() => useMarketExecution(onOperation));
  await act(() => result.current.confirm(operation, expected));
  expect(mockContinue).toHaveBeenCalledWith(operation.id);
  expect(onOperation).toHaveBeenCalledWith(operation);
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
});
it("retains a legacy approval hash when its receipt is unavailable", async () => {
  mockRead.mockReturnValue({ request: expected, approvalHash: hash });
  mockClient.waitForTransactionReceipt.mockRejectedValue(
    new Error("RPC unavailable")
  );
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(operation, expected));
  expect(mockSave).not.toHaveBeenCalled();
  expect(mockContinue).not.toHaveBeenCalled();
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
    block_number: 100,
    wallet: walletAddress,
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
  mockBegin.mockImplementation(
    (_id: string, body: ApiMarketSendAttemptRequest) => ({
      ...buyOperation,
      state: "UNKNOWN",
      send_attempt: {
        attempt_id: body.attempt_id,
        purpose: body.purpose,
        transaction_digest: body.transaction_digest,
        snapshot_block: buyOperation.block_number,
        transaction:
          buyOperation.approval_transactions[0] ?? buyOperation.transaction,
        status: "ACTIVE",
        transaction_hash: null,
      },
    })
  );
  mockReject.mockImplementation(
    (_id: string, body: { attempt_id: string }) => ({
      ...buyOperation,
      send_attempt: { attempt_id: body.attempt_id, status: "REJECTED" },
    })
  );
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
  expect(mockSave).toHaveBeenCalledWith(
    expected.profile_id,
    operation.id,
    expect.objectContaining({
      request: buyExpected,
      transactionHash: hash,
    })
  );
});
it("never sends when simulation exceeds the reviewed gas limit", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockClient.estimateGas.mockResolvedValue(101n);
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});

it("journals the attempt before the wallet and blocks retry after a lost broadcast response", async () => {
  const { buyExpected, buyOperation } = buyReview();
  let markerAtWallet: unknown;
  let beginCountAtWallet = 0;
  mockWallet.sendTransaction.mockImplementation(async () => {
    markerAtWallet = persisted;
    beginCountAtWallet = mockBegin.mock.calls.length;
    throw new Error("RPC response lost after broadcast");
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(markerAtWallet).toEqual(
    expect.objectContaining({
      sendAttempt: expect.objectContaining({ walletRequested: true }),
    })
  );
  expect(beginCountAtWallet).toBe(1);
  expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
  expect(mockReject).not.toHaveBeenCalled();
  expect(persisted).toHaveProperty("sendAttempt.walletRequested", true);
});

it("journals approval hashes on the server without clearing the fence after one confirmation", async () => {
  const { buyExpected, buyOperation } = buyReview();
  buyOperation.approval_transactions = [
    {
      ...buyOperation.transaction!,
      value: "0",
      purpose: "APPROVE_CURRENCY",
    },
  ] as ApiMarketOperation["approval_transactions"];
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockSubmission).toHaveBeenCalledWith(buyOperation.id, {
    transaction_hash: hash,
  });
  expect(persisted).toHaveProperty("approvalHash", hash);
  expect(persisted).toHaveProperty("sendAttempt.purpose", "APPROVAL");
  expect(mockClient.waitForTransactionReceipt).not.toHaveBeenCalled();
});

it("retains an ambiguous approval send and never requests its approval again", async () => {
  const { buyExpected, buyOperation } = buyReview();
  buyOperation.approval_transactions = [
    {
      ...buyOperation.transaction!,
      value: "0",
      purpose: "APPROVE_CURRENCY",
    },
  ] as ApiMarketOperation["approval_transactions"];
  mockWallet.sendTransaction.mockRejectedValue(
    new Error("RPC response lost after approval broadcast")
  );
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
  expect(mockReject).not.toHaveBeenCalled();
  expect(persisted).toHaveProperty("sendAttempt.purpose", "APPROVAL");
});

it("blocks a fresh browser from an active server attempt even with no local intent", async () => {
  const { buyExpected, buyOperation } = buyReview();
  const active = activeAttempt(buyOperation);
  mockRead.mockReturnValue(null);
  mockFetch.mockResolvedValue(active);
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(active, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockBegin).not.toHaveBeenCalled();
});

it("clears only an explicitly rejected wallet request after server acknowledgement", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockWallet.sendTransaction.mockRejectedValue({ cause: { code: 4001 } });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockReject).toHaveBeenCalledWith(buyOperation.id, {
    attempt_id: expect.any(String),
    reason: "USER_REJECTED",
  });
  expect(persisted).toEqual({ request: buyExpected });
});

it("keeps a rejected attempt pending when its server acknowledgement is lost", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockWallet.sendTransaction.mockRejectedValue({ code: 4001 });
  mockReject.mockRejectedValue(new Error("offline"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).toHaveBeenCalledTimes(1);
  expect(persisted).toHaveProperty(
    "sendAttempt.rejectionReason",
    "USER_REJECTED"
  );
});

it("never requests the wallet if the server attempt acknowledgement is lost", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockBegin.mockRejectedValueOnce(new Error("offline"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockReject).toHaveBeenCalledWith(buyOperation.id, {
    attempt_id: expect.any(String),
    reason: "WALLET_NOT_REQUESTED",
    expected_revision: buyOperation.revision,
  });
  expect(mockBegin).toHaveBeenCalledTimes(1);
  expect(persisted).toEqual({ request: buyExpected });
});

it("clears a never-persisted begin only after the server tombstones its original revision", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockBegin.mockRejectedValue(new Error("stale revision"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockReject).toHaveBeenCalledWith(buyOperation.id, {
    attempt_id: expect.any(String),
    reason: "WALLET_NOT_REQUESTED",
    expected_revision: buyOperation.revision,
  });
  expect(persisted).toEqual({ request: buyExpected });
});

it("does not clear a never-requested attempt while another server attempt is active", async () => {
  const { buyExpected, buyOperation } = buyReview();
  mockBegin.mockRejectedValue(new Error("stale revision"));
  mockReject.mockRejectedValue(new Error("Another attempt is ACTIVE"));
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(persisted).toHaveProperty(
    "sendAttempt.rejectionReason",
    "WALLET_NOT_REQUESTED"
  );
});

it("rechecks the active wallet after the server attempt acknowledgement", async () => {
  const { buyExpected, buyOperation } = buyReview();
  const implementation = mockBegin.getMockImplementation()!;
  mockBegin.mockImplementation((...args: unknown[]) => {
    mockConnection.address = "0x2222222222222222222222222222222222222222";
    return implementation(...args);
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.confirm(buyOperation, buyExpected));
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockReject).toHaveBeenCalledWith(buyOperation.id, {
    attempt_id: expect.any(String),
    reason: "WALLET_NOT_REQUESTED",
    expected_revision: buyOperation.revision,
  });
});

function activeAttempt(review: ApiMarketOperation): ApiMarketOperation {
  const attempt = createMarketSendAttempt(
    review.transaction!,
    review.block_number
  );
  return {
    ...review,
    state: "UNKNOWN",
    send_attempt: {
      attempt_id: attempt.id,
      purpose: attempt.purpose,
      status: "ACTIVE",
      transaction_digest: attempt.digest,
      snapshot_block: attempt.snapshotBlock,
      transaction: review.transaction!,
      transaction_hash: null,
    },
  } as ApiMarketOperation;
}

function recoveryFixture() {
  const { buyOperation } = buyReview();
  const active = activeAttempt(buyOperation);
  mockRead.mockReturnValue(null);
  mockFetch.mockResolvedValue(active);
  mockClient.getTransaction.mockResolvedValue({
    hash,
    chainId: 1,
    from: walletAddress,
    to: walletAddress,
    value: 1000n,
    input: "0x",
    blockNumber: 101n,
  });
  return active;
}

it("recovers the exact transaction without a local request or active trading capability", async () => {
  const active = recoveryFixture();
  mockAuth.connectedProfile.id = "new-profile";
  mockCapabilities.mockResolvedValue({ actions: [] });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.recoverTransaction(active, hash));
  expect(mockSubmission).toHaveBeenCalledWith(active.id, {
    transaction_hash: hash,
  });
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
  expect(mockWallet.signTypedData).not.toHaveBeenCalled();
  expect(mockCapabilities).not.toHaveBeenCalled();
});

it("journals an exact pending recovery hash while leaving settlement to the server", async () => {
  const active = recoveryFixture();
  mockClient.getTransaction.mockResolvedValue({
    hash,
    chainId: 1,
    from: walletAddress,
    to: walletAddress,
    value: 1000n,
    input: "0x",
    blockNumber: null,
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.recoverTransaction(active, hash));
  expect(mockSubmission).toHaveBeenCalledWith(active.id, {
    transaction_hash: hash,
  });
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});

it.each([
  { value: 1001n },
  { input: "0x1234" },
  { from: "0x2222222222222222222222222222222222222222" },
  { to: "0x2222222222222222222222222222222222222222" },
  { chainId: 8453 },
  { chainId: undefined },
  { blockNumber: 100n },
])("rejects a substituted recovery transaction %s", async (change) => {
  const active = recoveryFixture();
  mockClient.getTransaction.mockResolvedValue({
    hash,
    chainId: 1,
    from: walletAddress,
    to: walletAddress,
    value: 1000n,
    input: "0x",
    blockNumber: 101n,
    ...change,
  });
  const { result } = renderHook(() => useMarketExecution(jest.fn()));
  await act(() => result.current.recoverTransaction(active, hash));
  expect(mockSubmission).not.toHaveBeenCalled();
  expect(mockWallet.sendTransaction).not.toHaveBeenCalled();
});
