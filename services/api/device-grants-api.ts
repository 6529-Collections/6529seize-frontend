import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiDropSignedEvents } from "@/generated/models/ApiDropSignedEvents";
import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import { commonApiFetch, commonApiPost } from "@/services/api/common-api";

/** Every device grant of the authenticated profile's wallets, newest first. */
export const fetchDeviceGrants = (
  signal?: AbortSignal
): Promise<ApiDeviceGrant[]> =>
  commonApiFetch<ApiDeviceGrant[]>({
    endpoint: "device-grants",
    signal,
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
 * a signed event's wallet is the author's. Falls back to the primary address
 * alone when the profile cannot be loaded, which fails closed for others.
 */
export async function fetchAuthorWallets(
  primaryAddress: string,
  signal?: AbortSignal
): Promise<string[]> {
  try {
    const identity = await commonApiFetch<ApiIdentity>({
      endpoint: `identities/${encodeURIComponent(primaryAddress.toLowerCase())}`,
      signal,
      errorMode: "structured",
    });
    const wallets = (identity.wallets ?? []).map(({ wallet }) => wallet);
    return [primaryAddress, ...wallets];
  } catch {
    return [primaryAddress];
  }
}
