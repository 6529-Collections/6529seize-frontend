import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiDropSignedEvents } from "@/generated/models/ApiDropSignedEvents";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiRegisterDeviceGrantRequest } from "@/generated/models/ApiRegisterDeviceGrantRequest";
import {
  commonApiFetch,
  commonApiPost,
  getStructuredApiErrorStatus,
} from "@/services/api/common-api";

/**
 * The device grants of the authenticated profile's wallets, newest first. The
 * API returns at most the 100 newest, including expired and revoked ones.
 */
export const fetchDeviceGrants = (
  signal?: AbortSignal
): Promise<ApiDeviceGrant[]> =>
  commonApiFetch<ApiDeviceGrant[]>({
    endpoint: "device-grants",
    signal,
    errorMode: "structured",
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

export const revokeDeviceGrant = (grantId: string): Promise<ApiDeviceGrant> =>
  commonApiPost<Record<string, never>, ApiDeviceGrant>({
    endpoint: `device-grants/${encodeURIComponent(grantId)}/revoke`,
    body: {},
    errorMode: "structured",
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
