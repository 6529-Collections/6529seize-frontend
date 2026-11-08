import { v4 as uuidv4 } from "uuid";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import { postDrop } from "@/services/api/signed-drop-writes";
import { DropHasher } from "@/utils/drop-hasher";

/**
 * Request fields that prove who sent a drop rather than describe it. The API
 * leaves the same fields out when it matches a retry to the first attempt.
 */
const PROOF_FIELDS = [
  "client_drop_id",
  "device_signature",
  "signature",
  "signature_message",
  "is_safe_signature",
  "signer_address",
] as const;
const MAX_UNSETTLED_SENDS = 64;
const RETRY_DELAY_MS = 1_000;
// A longer Retry-After leaves the retry to the user.
const MAX_RETRY_DELAY_MS = 10_000;

/** Content fingerprint -> client_drop_id of a send whose outcome is unknown. */
const unsettledSends = new Map<string, string>();

function fingerprintOf(request: ApiCreateDropRequest): string {
  const content: Record<string, unknown> = { ...request };
  for (const field of PROOF_FIELDS) delete content[field];
  return new DropHasher().hash({
    drop: content as unknown as ApiCreateDropRequest,
    termsOfService: null,
  });
}

/**
 * The request with a client_drop_id. Sending the same wave and content again
 * after a send whose outcome is unknown reuses that send's id, so the API
 * answers with the drop it may already have created; any other send gets a
 * new id. A request that already has an id or a wallet signature is returned
 * unchanged, because the id is part of the signed payload.
 */
export function withClientDropId(
  request: ApiCreateDropRequest
): ApiCreateDropRequest {
  if (request.client_drop_id || request.signature) return request;
  const clientDropId = unsettledSends.get(fingerprintOf(request)) ?? uuidv4();
  return { ...request, client_drop_id: clientDropId };
}

/** For endpoints with their own idempotency key. */
export function withoutClientDropId(
  request: ApiCreateDropRequest
): ApiCreateDropRequest {
  const { client_drop_id: _clientDropId, ...rest } = request;
  return rest;
}

/**
 * A response can be lost after the API created the drop: a timeout, a network
 * failure or a server error. A client error (4xx other than 408 and 429)
 * means the drop was not created.
 */
function isOutcomeUnknown(error: unknown): boolean {
  const status = getStructuredApiErrorStatus(error);
  return (
    status === undefined ||
    status < 400 ||
    status >= 500 ||
    status === 408 ||
    status === 429
  );
}

/** At least 1 s, or the response's Retry-After; null when that is too long. */
function retryDelayMs(error: unknown): number | null {
  const headers =
    typeof error === "object" && error !== null && "headers" in error
      ? error.headers
      : undefined;
  const retryAfter =
    headers instanceof Headers ? headers.get("Retry-After") : null;
  if (retryAfter === null || retryAfter.trim() === "") return RETRY_DELAY_MS;
  const seconds = Number(retryAfter);
  const delayMs = Number.isFinite(seconds)
    ? seconds * 1_000
    : Date.parse(retryAfter) - Date.now();
  if (Number.isNaN(delayMs)) return RETRY_DELAY_MS;
  return delayMs > MAX_RETRY_DELAY_MS
    ? null
    : Math.max(RETRY_DELAY_MS, delayMs);
}

function rememberUnsettledSend(request: ApiCreateDropRequest): void {
  const clientDropId = request.client_drop_id;
  if (!clientDropId) return;
  const fingerprint = fingerprintOf(request);
  unsettledSends.delete(fingerprint);
  unsettledSends.set(fingerprint, clientDropId);
  if (unsettledSends.size > MAX_UNSETTLED_SENDS) {
    const oldest = unsettledSends.keys().next().value;
    if (oldest !== undefined) unsettledSends.delete(oldest);
  }
}

function forgetSettledSend(request: ApiCreateDropRequest): void {
  const fingerprint = fingerprintOf(request);
  if (unsettledSends.get(fingerprint) === request.client_drop_id) {
    unsettledSends.delete(fingerprint);
  }
}

/**
 * POST /drops with a client_drop_id. A send whose outcome is unknown is
 * retried once with the same id, after at least 1 s or the response's
 * Retry-After. The API answers it with the drop the first attempt created, if
 * it did. When the retry fails the same way, the id is kept for a resend of
 * the same content.
 */
export async function postIdempotentDrop(
  body: ApiCreateDropRequest
): Promise<ApiDrop> {
  const request = withClientDropId(body);
  const send = () => postDrop(request, { errorMode: "structured" });
  try {
    let drop: ApiDrop;
    try {
      drop = await send();
    } catch (error) {
      const delayMs = retryDelayMs(error);
      if (
        !request.client_drop_id ||
        !isOutcomeUnknown(error) ||
        delayMs === null
      ) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs));
      drop = await send();
    }
    forgetSettledSend(request);
    return drop;
  } catch (error) {
    if (isOutcomeUnknown(error)) rememberUnsettledSend(request);
    else forgetSettledSend(request);
    throw error;
  }
}
