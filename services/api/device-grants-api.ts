import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import type { ApiDropSignedEvents } from "@/generated/models/ApiDropSignedEvents";
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
