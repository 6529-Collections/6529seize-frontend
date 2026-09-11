import type { ApiMarketMyOperations } from "@/generated/models/ApiMarketMyOperations";
import type { ApiMarketOperation } from "@/generated/models/ApiMarketOperation";
import type { ApiMarketOrders } from "@/generated/models/ApiMarketOrders";
import type { ApiMarketPrepareRequest } from "@/generated/models/ApiMarketPrepareRequest";
import type { ApiMarketSignature } from "@/generated/models/ApiMarketSignature";
import type { ApiMarketSubmission } from "@/generated/models/ApiMarketSubmission";
import type { ApiMarketSendAttemptRequest } from "@/generated/models/ApiMarketSendAttemptRequest";
import type { ApiMarketSendAttemptRejection } from "@/generated/models/ApiMarketSendAttemptRejection";
import type { ApiMarketListings } from "@/generated/models/ApiMarketListings";
import type { ApiCollectFamily } from "@/generated/models/ApiCollectFamily";
import { commonApiFetch, commonApiPost } from "./common-api";

const operationPath = (id: string) =>
  `market/operations/${encodeURIComponent(id)}`;
export const fetchMarketListings = (
  family: ApiCollectFamily,
  cursor: string | null,
  signal?: AbortSignal
) =>
  commonApiFetch<ApiMarketListings>({
    endpoint: "market/listings",
    params: { family, limit: "24", ...(cursor ? { cursor } : {}) },
    signal,
    cache: "no-store",
    errorMode: "structured",
  });
export const fetchMarketOrders = (
  assetKey: string,
  side: "LISTING" | "OFFER",
  signal?: AbortSignal
) =>
  commonApiFetch<ApiMarketOrders>({
    endpoint: "market/orders",
    params: { asset_key: assetKey, side },
    signal,
    cache: "no-store",
    errorMode: "structured",
  });
export const prepareMarketOperation = (
  body: ApiMarketPrepareRequest,
  idempotencyKey: string
) =>
  commonApiPost<ApiMarketPrepareRequest, ApiMarketOperation>({
    endpoint: "market/operations",
    body,
    headers: { "Idempotency-Key": idempotencyKey },
    errorMode: "structured",
  });
export const fetchMarketOperation = (id: string, signal?: AbortSignal) =>
  commonApiFetch<ApiMarketOperation>({
    endpoint: operationPath(id),
    signal,
    cache: "no-store",
    errorMode: "structured",
  });
export const fetchMyMarketOperations = (
  signal?: AbortSignal,
  cursor?: string | null
) =>
  commonApiFetch<ApiMarketMyOperations>({
    endpoint: "market/me/operations",
    params: { limit: "24", ...(cursor ? { cursor } : {}) },
    signal,
    cache: "no-store",
    errorMode: "structured",
  });
export const continueMarketOperation = (id: string) =>
  commonApiPost<Record<string, never>, ApiMarketOperation>({
    endpoint: `${operationPath(id)}/continue`,
    body: {},
    errorMode: "structured",
  });
export const submitMarketSignature = (id: string, body: ApiMarketSignature) =>
  commonApiPost<ApiMarketSignature, ApiMarketOperation>({
    endpoint: `${operationPath(id)}/signature`,
    body,
    errorMode: "structured",
  });
export const submitMarketTransaction = (
  id: string,
  body: ApiMarketSubmission
) =>
  commonApiPost<ApiMarketSubmission, ApiMarketOperation>({
    endpoint: `${operationPath(id)}/submissions`,
    body,
    errorMode: "structured",
  });

export const beginMarketTransactionAttempt = (
  id: string,
  body: ApiMarketSendAttemptRequest
) =>
  commonApiPost<ApiMarketSendAttemptRequest, ApiMarketOperation>({
    endpoint: `${operationPath(id)}/send-attempts`,
    body,
    errorMode: "structured",
  });

export const rejectMarketTransactionAttempt = (
  id: string,
  body: ApiMarketSendAttemptRejection
) =>
  commonApiPost<ApiMarketSendAttemptRejection, ApiMarketOperation>({
    endpoint: `${operationPath(id)}/send-attempts/rejection`,
    body,
    errorMode: "structured",
  });
