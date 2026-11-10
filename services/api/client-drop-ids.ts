import { v4 as uuidv4 } from "uuid";
import type { ApiCreateDropRequest } from "@/generated/models/ApiCreateDropRequest";
import { getWalletAddress, getWalletRole } from "@/services/auth/auth.utils";
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

/**
 * Signed-in identity and content fingerprint -> client_drop_id of a send whose
 * outcome is unknown. Another identity never reuses a kept id.
 */
const unsettledSends = new Map<string, string>();

/** Forgets every kept id, for a sign-out or a profile switch. */
export function clearClientDropIds(): void {
  unsettledSends.clear();
}

function fingerprintOf(request: ApiCreateDropRequest): string {
  const content: Record<string, unknown> = { ...request };
  for (const field of PROOF_FIELDS) delete content[field];
  const identity = `${getWalletAddress()?.toLowerCase() ?? ""}:${getWalletRole() ?? ""}`;
  return `${identity}|${new DropHasher().hash({
    drop: content as unknown as ApiCreateDropRequest,
    termsOfService: null,
  })}`;
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

/** Keeps the id of a send whose outcome is unknown, for a resend. */
export function rememberUnsettledSend(request: ApiCreateDropRequest): void {
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

/** Forgets the id of a send that settled. */
export function forgetSettledSend(request: ApiCreateDropRequest): void {
  const fingerprint = fingerprintOf(request);
  if (unsettledSends.get(fingerprint) === request.client_drop_id) {
    unsettledSends.delete(fingerprint);
  }
}
