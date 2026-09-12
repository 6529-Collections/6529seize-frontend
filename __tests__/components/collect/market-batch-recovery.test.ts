import {
  fetchRecoverableMarketBatch,
  batchNeedsPolling,
} from "@/components/collect/market-batch-recovery";
import {
  fetchMarketBatch,
  rejectMarketBatchAttempt,
  submitMarketBatchTransaction,
} from "@/services/api/market-batch-api";
import {
  saveMarketBatch,
  readMarketBatch,
} from "@/components/collect/market-batch-storage";
import { createMarketSendAttempt } from "@/components/collect/market-send-attempt";
import {
  ApiMarketBatchSendAttemptPurposeEnum,
  ApiMarketBatchSendAttemptStatusEnum as Status,
} from "@/generated/models/ApiMarketBatchSendAttempt";
import { batchFixture } from "./market-batch.fixture";
import { ApiMarketBatchOperationStateEnum } from "@/generated/models/ApiMarketBatchOperation";
const mockLock = jest.fn();
jest.mock("@/components/collect/market-operation-lock", () => ({
  withMarketOperationLock: (...args: unknown[]) => mockLock(...args),
}));
jest.mock("@/services/api/market-batch-api", () => ({
  fetchMarketBatch: jest.fn(),
  rejectMarketBatchAttempt: jest.fn(),
  submitMarketBatchTransaction: jest.fn(),
}));
const fetch = jest.mocked(fetchMarketBatch),
  reject = jest.mocked(rejectMarketBatchAttempt),
  submit = jest.mocked(submitMarketBatchTransaction);
let serial = 0;
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  mockLock.mockImplementation((_id: string, run: () => Promise<unknown>) =>
    run()
  );
});
function setup() {
  const f = batchFixture();
  f.operation.id = `recover-${++serial}`;
  const attempt = createMarketSendAttempt(f.operation.transaction!, 12, "1");
  f.operation.send_attempt = {
    attempt_id: attempt.id,
    purpose: ApiMarketBatchSendAttemptPurposeEnum.Transaction,
    status: Status.Active,
    transaction_digest: attempt.digest,
    snapshot_block: 12,
    transaction: f.operation.transaction!,
    transaction_hash: null,
  };
  saveMarketBatch("profile", f.operation.id, {
    request: f.request,
    sendAttempt: attempt,
  });
  fetch.mockResolvedValue(f.operation);
  reject.mockResolvedValue({
    ...f.operation,
    send_attempt: { ...f.operation.send_attempt, status: Status.Rejected },
  });
  return { ...f, attempt };
}
it("clears a proven never-requested journal only under the operation lock", async () => {
  const f = setup();
  await fetchRecoverableMarketBatch(f.operation.id, "profile");
  expect(mockLock).toHaveBeenCalledTimes(1);
  expect(reject).toHaveBeenCalledWith(f.operation.id, {
    attempt_id: f.attempt.id,
    reason: "WALLET_NOT_REQUESTED",
    expected_revision: "1",
  });
  expect(
    readMarketBatch("profile", f.operation.id)?.sendAttempt
  ).toBeUndefined();
});
it("retires a terminal verified journal instead of accumulating completed purchases in the active selection index", async () => {
  const f = setup();
  f.operation.state = ApiMarketBatchOperationStateEnum.Confirmed;
  f.operation.send_attempt!.status = Status.Resolved;
  await fetchRecoverableMarketBatch(f.operation.id, "profile");
  expect(readMarketBatch("profile", f.operation.id)).toBeNull();
  expect(
    localStorage.getItem(`6529-market-batch:profile:${f.operation.id}`)
  ).toBeNull();
  expect(reject).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
});
it("rechecks durable wallet intent after the lock is acquired", async () => {
  const f = setup();
  mockLock.mockImplementation(
    async (_id: string, run: () => Promise<unknown>) => {
      localStorage.setItem(
        `6529-market-batch:profile:${f.operation.id}`,
        JSON.stringify({
          request: f.request,
          sendAttempt: { ...f.attempt, walletRequested: true },
        })
      );
      return run();
    }
  );
  expect(await fetchRecoverableMarketBatch(f.operation.id, "profile")).toBe(
    f.operation
  );
  expect(reject).not.toHaveBeenCalled();
  expect(submit).not.toHaveBeenCalled();
});
it("keeps a requested/unknown attempt unresolved for wallet hash recovery", async () => {
  const f = setup();
  saveMarketBatch("profile", f.operation.id, {
    request: f.request,
    sendAttempt: { ...f.attempt, walletRequested: true },
  });
  await fetchRecoverableMarketBatch(f.operation.id, "profile");
  expect(reject).not.toHaveBeenCalled();
  expect(batchNeedsPolling(f.operation)).toBe(true);
});
it("does not cross profile ownership or bypass an unavailable lock", async () => {
  const f = setup();
  await expect(
    fetchRecoverableMarketBatch(f.operation.id, "other")
  ).rejects.toThrow("MARKET_PROFILE_CHANGED");
  expect(reject).not.toHaveBeenCalled();
  mockLock.mockRejectedValue(new Error("busy"));
  expect(await fetchRecoverableMarketBatch(f.operation.id, "profile")).toBe(
    f.operation
  );
  expect(reject).not.toHaveBeenCalled();
});
