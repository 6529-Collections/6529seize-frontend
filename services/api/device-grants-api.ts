import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiDeviceSecurityNotice } from "@/generated/models/ApiDeviceSecurityNotice";
import type { ApiE2eeAck } from "@/generated/models/ApiE2eeAck";
import type { ApiDropSignedEvents } from "@/generated/models/ApiDropSignedEvents";
import type { ApiDropSignedEventsBatch } from "@/generated/models/ApiDropSignedEventsBatch";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRegisterDeviceGrantRequest } from "@/generated/models/ApiRegisterDeviceGrantRequest";
import {
  commonApiFetch,
  commonApiPost,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";

/**
 * Sends a request with exactly this session token instead of the stored
 * session: no session-aware 401 retry, so the token cannot be swapped for
 * another while the request is in flight.
 */
const boundToSession = (sessionToken: string | undefined) =>
  sessionToken === undefined
    ? {}
    : {
        includeWalletAuth: false,
        headers: { Authorization: `Bearer ${sessionToken}` },
      };

/**
 * The device grants of the authenticated profile's wallets, newest first. The
 * API returns at most the 100 newest, including expired and revoked ones.
 * With a session token, the request is bound to exactly that token.
 */
export const fetchDeviceGrants = (
  signal?: AbortSignal,
  sessionToken?: string
): Promise<ApiDeviceGrant[]> =>
  commonApiFetch<ApiDeviceGrant[]>({
    endpoint: "device-grants",
    signal,
    errorMode: "structured",
    ...boundToSession(sessionToken),
  });

/**
 * Registers an app device grant (6529 Mobile and Desktop): EIP-712 typed data
 * the signed-in wallet signed outside a web sign-in.
 */
export const registerAppDeviceGrant = (
  request: ApiRegisterDeviceGrantRequest
): Promise<ApiDeviceGrant> =>
  commonApiPost<ApiRegisterDeviceGrantRequest, ApiDeviceGrant>({
    endpoint: "device-grants",
    body: request,
    errorMode: "structured",
  });

/** A null result means this server still uses the legacy notice flows. */
export async function fetchDeviceSecurityNotices(
  signal?: AbortSignal
): Promise<ApiDeviceSecurityNotice[] | null> {
  try {
    return await commonApiFetch<ApiDeviceSecurityNotice[]>({
      endpoint: "device-security-notices",
      signal,
      cache: "no-store",
      errorMode: "structured",
    });
  } catch (error) {
    if (getStructuredApiErrorStatus(error) === 404) {
      return null;
    }
    throw error;
  }
}

export const acknowledgeEncryptedDmDevice = (deviceKey: string) =>
  commonApiPost<Record<string, never>, ApiE2eeAck>({
    endpoint: `e2ee/devices/${encodeURIComponent(deviceKey)}/acknowledge`,
    body: {},
    errorMode: "structured",
  });

export const acknowledgeDeviceGrant = (
  grantId: string
): Promise<ApiDeviceGrant> =>
  commonApiPost<Record<string, never>, ApiDeviceGrant>({
    endpoint: `device-grants/${encodeURIComponent(grantId)}/acknowledge`,
    body: {},
    errorMode: "structured",
  });

export const revokeDeviceGrant = (
  grantId: string,
  sessionToken?: string
): Promise<ApiDeviceGrant> =>
  commonApiPost<Record<string, never>, ApiDeviceGrant>({
    endpoint: `device-grants/${encodeURIComponent(grantId)}/revoke`,
    body: {},
    errorMode: "structured",
    ...boundToSession(sessionToken),
  });

/** The stored device-signed events of a drop and the grants they reference. */
export const fetchDropSignedEvents = (
  dropId: string,
  signal?: AbortSignal
): Promise<ApiDropSignedEvents> =>
  commonApiFetch<ApiDropSignedEvents>({
    endpoint: `drops/${encodeURIComponent(dropId)}/signed-events`,
    signal,
    errorMode: "structured",
  });

/**
 * The signed events of up to 50 drops in one read (only content events, at
 * most 20 per drop; grants listed once for the batch). Ids the caller cannot
 * read are listed in `unavailable`, drops with more events in
 * `truncated_drop_ids`.
 */
export const fetchDropsSignedEvents = (
  dropIds: readonly string[],
  signal?: AbortSignal
): Promise<ApiDropSignedEventsBatch> =>
  commonApiFetch<ApiDropSignedEventsBatch>({
    endpoint: "drops/signed-events",
    params: { drop_ids: dropIds.join(",") },
    signal,
    errorMode: "structured",
  });

/**
 * The wallets of the profile that owns a primary address, used to check that
 * a signed event's wallet is the author's. When no profile owns the address
 * (404) only the address itself counts, which fails closed for other wallets.
 * Any other failure is thrown: a temporary outage must surface as a retryable
 * error, never shrink the list and turn a valid signature into an invalid one.
 */
export async function fetchAuthorWallets(
  primaryAddress: string,
  signal?: AbortSignal
): Promise<string[]> {
  let identity: ApiIdentity;
  try {
    identity = await commonApiFetch<ApiIdentity>({
      endpoint: `identities/${encodeURIComponent(primaryAddress.toLowerCase())}`,
      signal,
      errorMode: "structured",
    });
  } catch (error) {
    if (getStructuredApiErrorStatus(error) === 404) {
      return [primaryAddress];
    }
    throw error;
  }
  const wallets = (identity.wallets ?? []).map(({ wallet }) => wallet);
  return [primaryAddress, ...wallets];
}
