import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import {
  fetchMarketOperation,
  submitMarketTransaction,
} from "@/services/api/market-api";
import { readMarketIntent } from "./market-operation-storage";

export function marketOperationNeedsPolling(
  operation: ApiMarketOperation
): boolean {
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
  const saved = readMarketIntent(profileId, operationId);
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
