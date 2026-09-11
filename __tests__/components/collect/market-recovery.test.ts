import {
  fetchRecoverableMarketOperation,
  marketOperationHasUnresolvedSend,
} from "@/components/collect/market-recovery";
import { createMarketSendAttempt } from "@/components/collect/market-send-attempt";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import type { ApiMarketTransaction } from "@/generated/models/ApiMarketTransaction";
import { ApiMarketTransactionPurposeEnum } from "@/generated/models/ApiMarketTransaction";

const mockFetch = jest.fn();
const mockSubmit = jest.fn();
const mockBegin = jest.fn();
const mockReject = jest.fn();
const mockRead = jest.fn();
const mockPersisted = jest.fn();
const mockSave = jest.fn();
const mockLock = jest.fn();
jest.mock("@/services/api/market-api", () => ({
  fetchMarketOperation: (...args: unknown[]) => mockFetch(...args),
  submitMarketTransaction: (...args: unknown[]) => mockSubmit(...args),
  beginMarketTransactionAttempt: (...args: unknown[]) => mockBegin(...args),
  rejectMarketTransactionAttempt: (...args: unknown[]) => mockReject(...args),
}));
jest.mock("@/components/collect/market-operation-storage", () => ({
  readMarketIntent: (...args: unknown[]) => mockRead(...args),
  readPersistedMarketIntent: (...args: unknown[]) => mockPersisted(...args),
  saveMarketIntent: (...args: unknown[]) => mockSave(...args),
}));
jest.mock("@/components/collect/market-operation-lock", () => ({
  withMarketOperationLock: (...args: unknown[]) => mockLock(...args),
}));

const wallet = "0x1111111111111111111111111111111111111111";
const hash = `0x${"a".repeat(64)}`;
const request = {
  profile_id: "original-profile",
  wallet,
} as ApiMarketPrepareRequest;
const transaction: ApiMarketTransaction = {
  chain_id: 1,
  sender: wallet,
  to: wallet,
  value: "0",
  data: "0x1234",
  purpose: ApiMarketTransactionPurposeEnum.ApproveNft,
};
const attempt = createMarketSendAttempt(transaction, 100, "original-revision");
function active(): ApiMarketOperation {
  return {
    id: "operation",
    profile_id: request.profile_id,
    wallet,
    revision: "armed-revision",
    state: "UNKNOWN",
    send_attempt: {
      attempt_id: attempt.id,
      purpose: "APPROVAL",
      status: "ACTIVE",
      transaction_digest: attempt.digest,
      transaction,
      snapshot_block: 100,
      transaction_hash: null,
    },
  } as ApiMarketOperation;
}
beforeEach(() => {
  jest.clearAllMocks();
  mockRead.mockReturnValue(null);
  mockPersisted.mockReturnValue(null);
  mockSave.mockReturnValue(true);
  mockLock.mockImplementation((_id: string, execute: () => Promise<void>) =>
    execute()
  );
});

it("blocks a server-recorded attempt without any browser storage", () => {
  expect(marketOperationHasUnresolvedSend(active())).toBe(true);
});

it("rejects a fetched operation with a different original profile before local recovery actions", async () => {
  const operation = active();
  mockFetch.mockResolvedValue({
    ...operation,
    profile_id: "another-original-profile",
  });
  await expect(
    fetchRecoverableMarketOperation(operation.id, request.profile_id)
  ).rejects.toThrow("MARKET_PROFILE_CHANGED");
  expect(mockSave).not.toHaveBeenCalled();
  expect(mockSubmit).not.toHaveBeenCalled();
  expect(mockReject).not.toHaveBeenCalled();
});

it("retries only a known approval hash and leaves the unresolved server attempt fenced", async () => {
  const operation = active();
  mockFetch.mockResolvedValue(operation);
  mockRead.mockReturnValue({
    request,
    sendAttempt: attempt,
    approvalHash: hash,
  });
  mockSubmit.mockResolvedValue({
    ...operation,
    send_attempt: { ...operation.send_attempt, transaction_hash: hash },
  });
  const result = await fetchRecoverableMarketOperation(
    operation.id,
    request.profile_id
  );
  expect(mockSubmit).toHaveBeenCalledWith(operation.id, {
    transaction_hash: hash,
  });
  expect(result.send_attempt?.status).toBe("ACTIVE");
  expect(mockBegin).not.toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
});

it("does not repeatedly submit an already-journaled approval hash", async () => {
  const operation = active();
  operation.send_attempt!.transaction_hash = hash;
  mockFetch.mockResolvedValue(operation);
  mockRead.mockReturnValue({
    request,
    sendAttempt: attempt,
    approvalHash: hash,
  });
  await fetchRecoverableMarketOperation(operation.id, request.profile_id);
  expect(mockSubmit).not.toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
});

it("clears approval recovery only when the server has resolved the recorded attempt", async () => {
  const operation = active();
  operation.send_attempt!.status = "RESOLVED" as NonNullable<
    ApiMarketOperation["send_attempt"]
  >["status"];
  mockFetch.mockResolvedValue(operation);
  mockRead.mockReturnValue({
    request,
    sendAttempt: attempt,
    approvalHash: hash,
  });
  expect(marketOperationHasUnresolvedSend(operation)).toBe(false);
  await fetchRecoverableMarketOperation(operation.id, request.profile_id);
  expect(mockSave).toHaveBeenCalledWith(request.profile_id, operation.id, {
    request,
  });
  expect(mockSubmit).not.toHaveBeenCalled();
  expect(mockBegin).not.toHaveBeenCalled();
});

it.each(["missing", "different", "active"] as const)(
  "retains the local approval fence when its matching server resolution is %s",
  async (resolution) => {
    const operation = active();
    operation.send_attempt!.transaction_hash = hash;
    if (resolution === "missing") delete operation.send_attempt;
    if (resolution === "different")
      operation.send_attempt!.attempt_id = "different-attempt";
    mockFetch.mockResolvedValue(operation);
    mockRead.mockReturnValue({
      request,
      sendAttempt: attempt,
      approvalHash: hash,
    });
    mockSubmit.mockResolvedValue(operation);
    await fetchRecoverableMarketOperation(operation.id, request.profile_id);
    expect(mockSave).not.toHaveBeenCalled();
    expect(marketOperationHasUnresolvedSend(operation)).toBe(true);
    expect(mockBegin).not.toHaveBeenCalled();
  }
);

it.each(["USER_REJECTED", "WALLET_NOT_REQUESTED"] as const)(
  "recovers a lost positive %s acknowledgement without any new wallet request",
  async (reason) => {
    const operation = active();
    mockFetch.mockResolvedValue(operation);
    mockRead.mockReturnValue({
      request,
      sendAttempt: { ...attempt, rejectionReason: reason },
    });
    const rejected = {
      ...operation,
      send_attempt: { ...operation.send_attempt, status: "REJECTED" },
    };
    mockReject.mockResolvedValue(rejected);
    expect(
      await fetchRecoverableMarketOperation(operation.id, request.profile_id)
    ).toEqual(rejected);
    expect(mockReject).toHaveBeenCalledWith(operation.id, {
      attempt_id: attempt.id,
      reason,
      ...(reason === "WALLET_NOT_REQUESTED"
        ? { expected_revision: attempt.expectedRevision }
        : {}),
    });
    expect(mockSave).toHaveBeenLastCalledWith(
      request.profile_id,
      operation.id,
      { request }
    );
    expect(mockSubmit).not.toHaveBeenCalled();
    expect(mockBegin).not.toHaveBeenCalled();
  }
);

it("recovers a reload before the wallet request using a persisted false marker under the operation lock", async () => {
  const operation = active();
  mockFetch.mockResolvedValue(operation);
  mockRead.mockReturnValue({ request, sendAttempt: attempt });
  mockPersisted.mockReturnValue({ request, sendAttempt: attempt });
  mockReject.mockResolvedValue({
    ...operation,
    send_attempt: { ...operation.send_attempt, status: "REJECTED" },
  });
  await fetchRecoverableMarketOperation(operation.id, request.profile_id);
  expect(mockLock).toHaveBeenCalledWith(operation.id, expect.any(Function));
  expect(mockReject).toHaveBeenCalledWith(operation.id, {
    attempt_id: attempt.id,
    reason: "WALLET_NOT_REQUESTED",
    expected_revision: attempt.expectedRevision,
  });
});

it("does not abandon another tab's pending begin while that tab owns the operation lock", async () => {
  const operation = active();
  mockFetch.mockResolvedValue(operation);
  mockRead.mockReturnValue({ request, sendAttempt: attempt });
  mockPersisted.mockReturnValue({ request, sendAttempt: attempt });
  mockLock.mockRejectedValue(new Error("MARKET_EXECUTION_ALREADY_ACTIVE"));
  await fetchRecoverableMarketOperation(operation.id, request.profile_id);
  expect(mockReject).not.toHaveBeenCalled();
});

it("never infers a non-send from an in-memory false marker when durable storage says the wallet was requested", async () => {
  const operation = active();
  mockFetch.mockResolvedValue(operation);
  mockRead.mockReturnValue({ request, sendAttempt: attempt });
  mockPersisted.mockReturnValue({
    request,
    sendAttempt: { ...attempt, walletRequested: true },
  });
  await fetchRecoverableMarketOperation(operation.id, request.profile_id);
  expect(mockReject).not.toHaveBeenCalled();
  expect(mockSave).not.toHaveBeenCalled();
});
