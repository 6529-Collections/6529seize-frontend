import type { ApiMarketBatchCapabilities } from "@/generated/models/ApiMarketBatchCapabilities";
import type { ApiMarketBatchOperation } from "@/generated/models/ApiMarketBatchOperation";
import type { ApiMarketBatchPrepareRequest } from "@/generated/models/ApiMarketBatchPrepareRequest";
import type { ApiMarketSendAttemptRequest } from "@/generated/models/ApiMarketSendAttemptRequest";
import type { ApiMarketSendAttemptRejection } from "@/generated/models/ApiMarketSendAttemptRejection";
import type { ApiMarketSubmission } from "@/generated/models/ApiMarketSubmission";
import type { ApiMarketMyOperations } from "@/generated/models/ApiMarketMyOperations";
import { commonApiFetch, commonApiPost } from "./common-api";

const path = (id: string) => `market/operations/${encodeURIComponent(id)}`;
function batch(operation: ApiMarketBatchOperation): ApiMarketBatchOperation {
  if (operation.kind !== "BUY_BATCH") throw new Error("MARKET_REVIEW_MISMATCH");
  return operation;
}
async function post<T>(endpoint: string, body: T, idempotencyKey?: string) {
  return batch(
    await commonApiPost<T, ApiMarketBatchOperation>({
      endpoint,
      body,
      ...(idempotencyKey
        ? { headers: { "Idempotency-Key": idempotencyKey } }
        : {}),
      errorMode: "structured",
    })
  );
}
export const fetchMarketBatchCapabilities = (signal?: AbortSignal) =>
  commonApiFetch<ApiMarketBatchCapabilities>({
    endpoint: "market/batch-capabilities",
    signal,
    cache: "no-store",
    errorMode: "structured",
  });
export const prepareMarketBatch = (
  body: ApiMarketBatchPrepareRequest,
  key: string
) => post("market/operations", body, key);
export const fetchMarketBatch = async (id: string, signal?: AbortSignal) =>
  batch(
    await commonApiFetch<ApiMarketBatchOperation>({
      endpoint: path(id),
      signal,
      cache: "no-store",
      errorMode: "structured",
    })
  );
export const continueMarketBatch = (id: string) =>
  post(`${path(id)}/continue`, {});
export const beginMarketBatchAttempt = (
  id: string,
  body: ApiMarketSendAttemptRequest
) => post(`${path(id)}/send-attempts`, body);
export const rejectMarketBatchAttempt = (
  id: string,
  body: ApiMarketSendAttemptRejection
) => post(`${path(id)}/send-attempts/rejection`, body);
export const submitMarketBatchTransaction = (
  id: string,
  body: ApiMarketSubmission
) => post(`${path(id)}/submissions`, body);
export const fetchMarketHistoryWithBatches = (
  signal?: AbortSignal,
  cursor?: string | null
) =>
  commonApiFetch<ApiMarketMyOperations>({
    endpoint: "market/me/operations",
    params: {
      include_batches: "true",
      limit: "24",
      ...(cursor ? { cursor } : {}),
    },
    signal,
    cache: "no-store",
    errorMode: "structured",
  });
