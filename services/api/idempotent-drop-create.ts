import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  forgetSettledSend,
  rememberUnsettledSend,
  withClientDropId,
} from "@/services/api/client-drop-ids";
import { getStructuredApiErrorStatus } from "@/services/api/common-api";
import { postDrop } from "@/services/api/signed-drop-writes";

const RETRY_DELAY_MS = 1_000;
// A longer Retry-After leaves the retry to the user.
const MAX_RETRY_DELAY_MS = 10_000;

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
