import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import {
  fetchMarketOperation,
  submitMarketTransaction,
} from "@/services/api/market-api";
import {
  readMarketIntent,
  readPersistedMarketIntent,
} from "./market-operation-storage";
import { withMarketOperationLock } from "./market-operation-lock";
import {
  clearResolvedMarketSend,
  marketOperationSendAttempt,
  rejectUnsentMarketAttempt,
} from "./market-send-recovery";

export function marketOperationHasUnresolvedSend(
  operation: ApiMarketOperation
): boolean {
  return marketOperationSendAttempt(operation) !== undefined;
}

export function marketOperationNeedsPolling(
  operation: ApiMarketOperation
): boolean {
  if (marketOperationHasUnresolvedSend(operation)) return true;
  if (
    ["PUBLISHING", "SUBMITTED", "MINED", "UNKNOWN", "CANCEL_PENDING"].includes(
      operation.state
    )
  )
    return true;
  const saved = readMarketIntent(operation.profile_id, operation.id);
  return (
    Boolean(saved?.transactionHash) &&
    !["LIVE", "CONFIRMED", "CANCELLED", "FAILED"].includes(operation.state)
  );
}
export async function fetchRecoverableMarketOperation(
  operationId: string,
  profileId: string,
  signal?: AbortSignal
): Promise<ApiMarketOperation> {
  const operation = await fetchMarketOperation(operationId, signal);
  if (operation.profile_id !== profileId)
    throw new Error("MARKET_PROFILE_CHANGED");
  clearResolvedMarketSend(operation);
  const saved = readMarketIntent(profileId, operationId);
  const attempt = marketOperationSendAttempt(operation);
  const durable = readPersistedMarketIntent(
    profileId,
    operationId
  )?.sendAttempt;
  const neverRequested =
    durable?.id === attempt?.id && durable?.walletRequested === false;
  const rejectionReason =
    attempt?.rejectionReason ??
    (neverRequested ? "WALLET_NOT_REQUESTED" : undefined);
  if (attempt && rejectionReason && saved) {
    try {
      let recovered = operation;
      await withMarketOperationLock(operationId, async () => {
        // Re-read under the same lock held across begin + wallet send. Another
        // tab may have advanced from false to true while this poll was queued.
        const latest = readPersistedMarketIntent(
          profileId,
          operationId
        )?.sendAttempt;
        if (
          !attempt.rejectionReason &&
          (latest?.id !== attempt.id || latest.walletRequested)
        )
          return;
        recovered = await rejectUnsentMarketAttempt(
          operation,
          saved.request,
          attempt,
          rejectionReason
        );
      });
      return recovered;
    } catch {
      return operation;
    }
  }
  const attemptedHash =
    attempt &&
    saved?.sendAttempt?.id === attempt.id &&
    (saved.transactionHash ?? saved.approvalHash);
  if (attemptedHash && !operation.send_attempt?.transaction_hash) {
    try {
      const resolved = await submitMarketTransaction(operationId, {
        transaction_hash: attemptedHash,
      });
      clearResolvedMarketSend(resolved);
      return resolved;
    } catch {
      return operation;
    }
  }
  if (
    saved?.transactionHash &&
    !operation.transaction_hash &&
    ["REVIEW", "APPROVAL", "UNKNOWN"].includes(operation.state)
  ) {
    try {
      return await submitMarketTransaction(operationId, {
        transaction_hash: saved.transactionHash,
      });
    } catch {
      return operation;
    }
  }
  return operation;
}
