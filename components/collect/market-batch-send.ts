import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import { ApiMarketBatchSendAttemptStatusEnum as Status } from "@/generated/models/ApiMarketBatchSendAttempt";
import { ApiMarketSendAttemptRequestPurposeEnum } from "@/generated/models/ApiMarketSendAttemptRequest";
import { ApiMarketSendAttemptRejectionReasonEnum } from "@/generated/models/ApiMarketSendAttemptRejection";
import {
  beginMarketBatchAttempt,
  rejectMarketBatchAttempt,
} from "@/services/api/market-batch-api";
import { isHex, type Hex } from "viem";
import {
  createMarketSendAttempt,
  isMarketSendRejected,
  type MarketSendAttempt,
} from "./market-send-attempt";
import { readMarketBatch, saveMarketBatch } from "./market-batch-storage";
import {
  validateMarketBatchOperation,
  marketBatchReviewTerms,
  marketBatchLiteral,
} from "./market-batch-validation";

export function batchSendAttempt(
  operation: ApiMarketBatchOperation
): MarketSendAttempt | undefined {
  const saved = readMarketBatch(
    operation.profile_id,
    operation.id
  )?.sendAttempt;
  const server = operation.send_attempt;
  if (server?.status === Status.Active) {
    if (!marketBatchLiteral(server.purpose, "TRANSACTION"))
      throw new Error("MARKET_REVIEW_MISMATCH");
    return {
      id: server.attempt_id,
      purpose: "TRANSACTION",
      digest: server.transaction_digest,
      snapshotBlock: server.snapshot_block,
      walletRequested: true,
      expectedRevision:
        saved?.id === server.attempt_id ? saved.expectedRevision : "",
      ...(saved?.id === server.attempt_id && saved.rejectionReason
        ? { rejectionReason: saved.rejectionReason }
        : {}),
    };
  }
  if (server && server.attempt_id === saved?.id) return undefined;
  return saved;
}
export function clearResolvedBatchSend(
  operation: ApiMarketBatchOperation
): void {
  const saved = readMarketBatch(operation.profile_id, operation.id),
    server = operation.send_attempt;
  if (
    !saved?.sendAttempt ||
    !server ||
    server.status === Status.Active ||
    server.attempt_id !== saved.sendAttempt.id
  )
    return;
  saveMarketBatch(operation.profile_id, operation.id, {
    request: saved.request,
    ...(saved.transactionHash
      ? { transactionHash: saved.transactionHash }
      : {}),
  });
}
export async function rejectUnsentBatchAttempt(
  operation: ApiMarketBatchOperation,
  expected: ApiMarketBatchPrepareRequest,
  attempt: MarketSendAttempt,
  reason: "USER_REJECTED" | "WALLET_NOT_REQUESTED"
) {
  saveMarketBatch(expected.profile_id, operation.id, {
    request: expected,
    sendAttempt: { ...attempt, rejectionReason: reason },
  });
  const result = await rejectMarketBatchAttempt(operation.id, {
    attempt_id: attempt.id,
    reason:
      reason === "USER_REJECTED"
        ? ApiMarketSendAttemptRejectionReasonEnum.UserRejected
        : ApiMarketSendAttemptRejectionReasonEnum.WalletNotRequested,
    ...(reason === "WALLET_NOT_REQUESTED"
      ? { expected_revision: attempt.expectedRevision }
      : {}),
  });
  if (
    result.id !== operation.id ||
    result.profile_id !== expected.profile_id ||
    result.wallet.toLowerCase() !== expected.wallet.toLowerCase() ||
    result.send_attempt?.attempt_id !== attempt.id ||
    result.send_attempt.status !== Status.Rejected
  )
    throw new Error("MARKET_BROADCAST_UNKNOWN");
  saveMarketBatch(expected.profile_id, operation.id, { request: expected });
  return result;
}

/** Both durable journals must acknowledge the exact transaction before the wallet request. */
export async function sendReviewedMarketBatch(options: {
  readonly operation: ApiMarketBatchOperation;
  readonly expected: ApiMarketBatchPrepareRequest;
  readonly profileWallets: readonly string[];
  readonly assertConnection: () => void;
  readonly send: () => Promise<Hex>;
  readonly onOperation: (operation: ApiMarketBatchOperation) => void;
}) {
  const {
    operation,
    expected,
    profileWallets,
    assertConnection,
    send,
    onOperation,
  } = options;
  validateMarketBatchOperation(operation, expected, profileWallets);
  const transaction = operation.transaction;
  if (!transaction) throw new Error("MARKET_REVIEW_MISMATCH");
  let attempt = createMarketSendAttempt(
    transaction,
    operation.block_number,
    operation.revision
  );
  let walletRequested = false;
  if (
    !saveMarketBatch(expected.profile_id, operation.id, {
      request: expected,
      sendAttempt: attempt,
    })
  )
    throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
  try {
    const armed = await beginMarketBatchAttempt(operation.id, {
      expected_revision: operation.revision,
      attempt_id: attempt.id,
      purpose: ApiMarketSendAttemptRequestPurposeEnum.Transaction,
      transaction_digest: attempt.digest,
    });
    const server = armed.send_attempt;
    if (
      armed.id !== operation.id ||
      server?.status !== Status.Active ||
      server.attempt_id !== attempt.id ||
      !marketBatchLiteral(server.purpose, "TRANSACTION") ||
      server.transaction_digest !== attempt.digest ||
      server.snapshot_block !== attempt.snapshotBlock ||
      createMarketSendAttempt(server.transaction, server.snapshot_block)
        .digest !== attempt.digest ||
      marketBatchReviewTerms(armed) !== marketBatchReviewTerms(operation)
    )
      throw new Error("MARKET_REVIEW_MISMATCH");
    validateMarketBatchOperation(armed, expected, profileWallets);
    if (
      !armed.transaction ||
      createMarketSendAttempt(armed.transaction, armed.block_number).digest !==
        attempt.digest
    )
      throw new Error("MARKET_REVIEW_MISMATCH");
    assertConnection();
    attempt = { ...attempt, walletRequested: true };
    if (
      !saveMarketBatch(expected.profile_id, operation.id, {
        request: expected,
        sendAttempt: attempt,
      })
    )
      throw new Error("MARKET_RECOVERY_STORAGE_UNAVAILABLE");
    onOperation(armed);
    walletRequested = true;
    const hash = await send();
    if (!isHex(hash, { strict: true }) || hash.length !== 66)
      throw new Error("MARKET_BROADCAST_UNKNOWN");
    saveMarketBatch(expected.profile_id, operation.id, {
      request: expected,
      sendAttempt: attempt,
      transactionHash: hash,
    });
    return { hash, attempt };
  } catch (error) {
    if (!walletRequested || isMarketSendRejected(error)) {
      try {
        onOperation(
          await rejectUnsentBatchAttempt(
            operation,
            expected,
            attempt,
            walletRequested ? "USER_REJECTED" : "WALLET_NOT_REQUESTED"
          )
        );
      } catch {
        throw new Error("MARKET_BROADCAST_UNKNOWN");
      }
      throw error;
    }
    throw new Error("MARKET_BROADCAST_UNKNOWN");
  }
}
