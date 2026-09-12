import {
  sendReviewedMarketBatch,
  batchSendAttempt,
} from "@/components/collect/market-batch-send";
import {
  readMarketBatch,
  saveMarketBatch,
} from "@/components/collect/market-batch-storage";
import {
  beginMarketBatchAttempt,
  rejectMarketBatchAttempt,
} from "@/services/api/market-batch-api";
import { ApiMarketSendAttemptStatusEnum as Status } from "@/generated/models/ApiMarketSendAttempt";
import { ApiMarketSendAttemptPurposeEnum } from "@/generated/models/ApiMarketSendAttempt";
import { batchFixture, PAYER, NOW } from "./market-batch.fixture";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import type { Hex } from "viem";

jest.mock("@/services/api/market-batch-api", () => ({
  beginMarketBatchAttempt: jest.fn(),
  rejectMarketBatchAttempt: jest.fn(),
}));
const begin = jest.mocked(beginMarketBatchAttempt),
  reject = jest.mocked(rejectMarketBatchAttempt);
const HASH: Hex = `0x${"a".repeat(64)}`;
let serial = 0;
beforeEach(() => {
  jest.clearAllMocks();
  localStorage.clear();
  jest.spyOn(Date, "now").mockReturnValue(NOW);
});
afterEach(() => jest.restoreAllMocks());
function setup() {
  const f = batchFixture();
  f.operation.id = `batch-${++serial}`;
  let latest = f.operation;
  begin.mockImplementation(async (_id, body) => {
    const armed: ApiMarketBatchOperation = {
      ...f.operation,
      send_attempt: {
        attempt_id: body.attempt_id,
        purpose: ApiMarketSendAttemptPurposeEnum.Transaction,
        status: Status.Active,
        transaction_digest: body.transaction_digest,
        snapshot_block: f.operation.block_number!,
        transaction: f.operation.transaction!,
        transaction_hash: null,
      },
    };
    return armed;
  });
  reject.mockImplementation(async (_id, body) => ({
    ...latest,
    send_attempt: {
      attempt_id: body.attempt_id,
      purpose: ApiMarketSendAttemptPurposeEnum.Transaction,
      status: Status.Rejected,
      transaction_digest: "0".repeat(64),
      snapshot_block: 12,
      transaction: f.operation.transaction!,
      transaction_hash: null,
    },
  }));
  const send = jest.fn<Promise<Hex>, []>().mockResolvedValue(HASH);
  const options = {
    operation: f.operation,
    expected: f.request,
    profileWallets: [PAYER],
    assertConnection: jest.fn(),
    send,
    onOperation: (operation: ApiMarketBatchOperation) => {
      latest = operation;
    },
  };
  return { ...f, options, send, latest: () => latest };
}
it("durably records both journals and the exact payload before requesting the wallet once", async () => {
  const f = setup();
  f.send.mockImplementation(async () => {
    expect(begin).toHaveBeenCalledTimes(1);
    const saved = readMarketBatch("profile", f.operation.id);
    expect(saved?.sendAttempt?.walletRequested).toBe(true);
    expect(saved?.sendAttempt?.purpose).toBe("TRANSACTION");
    expect(
      localStorage.getItem(`6529-market-batch:profile:${f.operation.id}`)
    ).toContain("walletRequested");
    return HASH;
  });
  expect((await sendReviewedMarketBatch(f.options)).hash).toBe(HASH);
  expect(f.send).toHaveBeenCalledTimes(1);
  expect(readMarketBatch("profile", f.operation.id)?.transactionHash).toBe(
    HASH
  );
});
it("does not open the wallet without durable local storage", async () => {
  const f = setup();
  jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
    throw new Error("denied");
  });
  await expect(sendReviewedMarketBatch(f.options)).rejects.toThrow(
    "MARKET_RECOVERY_STORAGE_UNAVAILABLE"
  );
  expect(begin).not.toHaveBeenCalled();
  expect(f.send).not.toHaveBeenCalled();
});
it("retains an unresolved send after a wallet timeout and never marks it rejected", async () => {
  const f = setup();
  f.send.mockRejectedValue(new Error("timeout"));
  await expect(sendReviewedMarketBatch(f.options)).rejects.toThrow(
    "MARKET_BROADCAST_UNKNOWN"
  );
  expect(reject).not.toHaveBeenCalled();
  expect(batchSendAttempt(f.latest())?.walletRequested).toBe(true);
});
it("only explicit user rejection clears a requested wallet attempt", async () => {
  const f = setup();
  f.send.mockRejectedValue({ code: 4001 });
  await expect(sendReviewedMarketBatch(f.options)).rejects.toEqual({
    code: 4001,
  });
  expect(reject).toHaveBeenCalledWith(
    f.operation.id,
    expect.objectContaining({ reason: "USER_REJECTED" })
  );
  expect(
    readMarketBatch("profile", f.operation.id)?.sendAttempt
  ).toBeUndefined();
});
it("rejects mismatched armed calldata before the wallet even when economics match", async () => {
  const f = setup();
  const original = begin.getMockImplementation()!;
  begin.mockImplementation(async (id, body) => {
    const armed = await original(id, body);
    return {
      ...armed,
      transaction: {
        ...armed.transaction!,
        data: `${armed.transaction!.data}00`,
      },
    };
  });
  await expect(sendReviewedMarketBatch(f.options)).rejects.toThrow(
    "MARKET_REVIEW_MISMATCH"
  );
  expect(f.send).not.toHaveBeenCalled();
  expect(reject).toHaveBeenCalledWith(
    f.operation.id,
    expect.objectContaining({
      reason: "WALLET_NOT_REQUESTED",
      expected_revision: "1",
    })
  );
});
it("retains a wallet hash in memory when storage fails after the wallet opens", async () => {
  const f = setup();
  f.send.mockImplementation(async () => {
    jest.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("full");
    });
    return HASH;
  });
  await sendReviewedMarketBatch(f.options);
  expect(readMarketBatch("profile", f.operation.id)?.transactionHash).toBe(
    HASH
  );
});
it("treats failed server rejection acknowledgement as unresolved", async () => {
  const f = setup();
  f.send.mockRejectedValue({ code: 4001 });
  reject.mockRejectedValue(new Error("lost response"));
  await expect(sendReviewedMarketBatch(f.options)).rejects.toThrow(
    "MARKET_BROADCAST_UNKNOWN"
  );
  expect(batchSendAttempt(f.latest())?.rejectionReason).toBe("USER_REJECTED");
});
it("does not clear another profile's attempt on an unexpected rejection response", async () => {
  const f = setup();
  f.send.mockRejectedValue({ code: 4001 });
  reject.mockResolvedValue({ ...f.operation, profile_id: "other" });
  await expect(sendReviewedMarketBatch(f.options)).rejects.toThrow(
    "MARKET_BROADCAST_UNKNOWN"
  );
});
it("storage separates profile scopes and rejects malformed serialized requests", () => {
  const f = setup();
  saveMarketBatch("profile", f.operation.id, { request: f.request });
  expect(readMarketBatch("other", f.operation.id)).toBeNull();
  localStorage.setItem(
    "6529-market-batch:profile:tampered",
    JSON.stringify({ request: { ...f.request, amount_wei: "1" } })
  );
  expect(readMarketBatch("profile", "tampered")).toBeNull();
});
