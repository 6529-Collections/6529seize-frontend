import {
  fetchMarketBatch,
  submitMarketBatchTransaction,
} from "@/services/api/market-batch-api";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import {
  readMarketBatch,
  readPersistedMarketBatch,
  retireMarketBatch,
} from "./market-batch-storage";
import {
  batchSendAttempt,
  clearResolvedBatchSend,
  rejectUnsentBatchAttempt,
} from "./market-batch-send";
import { withMarketOperationLock } from "./market-operation-lock";

export function batchNeedsPolling(operation: ApiMarketBatchOperation): boolean {
  return (
    Boolean(batchSendAttempt(operation)) ||
    ["PREPARING", "SUBMITTED", "MINED", "UNKNOWN"].includes(operation.state)
  );
}
/** Reconcile journals; this path never requests a wallet or resends a transaction. */
export async function fetchRecoverableMarketBatch(
  id: string,
  profile: string,
  signal?: AbortSignal
) {
  const operation = await fetchMarketBatch(id, signal);
  if (operation.profile_id !== profile)
    throw new Error("MARKET_PROFILE_CHANGED");
  const original = readMarketBatch(profile, id);
  if (
    operation.id !== id ||
    (original &&
      operation.wallet.toLowerCase() !== original.request.wallet.toLowerCase())
  )
    throw new Error("MARKET_REVIEW_MISMATCH");
  clearResolvedBatchSend(operation);
  if (
    !batchNeedsPolling(operation) &&
    ["CONFIRMED", "FAILED", "EXPIRED"].includes(operation.state)
  ) {
    retireMarketBatch(profile, id);
    return operation;
  }
  const saved = readMarketBatch(profile, id),
    attempt = batchSendAttempt(operation);
  const persisted = readPersistedMarketBatch(profile, id)?.sendAttempt;
  const neverRequested =
    persisted?.id === attempt?.id && persisted?.walletRequested === false;
  const reason =
    attempt?.rejectionReason ??
    (neverRequested ? "WALLET_NOT_REQUESTED" : undefined);
  if (attempt && reason && saved) {
    try {
      return await withMarketOperationLock(id, async () => {
        const latest = readPersistedMarketBatch(profile, id)?.sendAttempt;
        if (
          !attempt.rejectionReason &&
          (latest?.id !== attempt.id || latest.walletRequested)
        )
          return operation;
        return rejectUnsentBatchAttempt(
          operation,
          saved.request,
          attempt,
          reason
        );
      });
    } catch {
      return operation;
    }
  }
  if (
    saved?.transactionHash &&
    !operation.transaction_hash &&
    (attempt?.id === saved.sendAttempt?.id ||
      ["REVIEW", "UNKNOWN"].includes(operation.state))
  ) {
    try {
      const resolved = await submitMarketBatchTransaction(id, {
        transaction_hash: saved.transactionHash,
      });
      if (
        resolved.id !== id ||
        resolved.profile_id !== profile ||
        resolved.wallet.toLowerCase() !== operation.wallet.toLowerCase()
      )
        throw new Error("MARKET_REVIEW_MISMATCH");
      clearResolvedBatchSend(resolved);
      return resolved;
    } catch {
      return operation;
    }
  }
  return operation;
}
