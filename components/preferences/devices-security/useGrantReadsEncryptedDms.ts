"use client";

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { isE2eeEnabled } from "@/config/e2eeEnv";
import type { ApiDeviceGrant } from "@/generated/models/ApiDeviceGrant";
import {
  fetchOwnE2eeDevices,
  ownE2eeDevicesQueryKey,
} from "./ownE2eeDevicesQuery";

/**
 * Whether a new signed-posts grant also turned on encrypted DMs (one setup,
 * one device), so its alert names both. Asked only while a grant is being
 * announced; until the answer arrives the alert names signed posts only.
 */
export function useGrantReadsEncryptedDms(
  grant: ApiDeviceGrant | null,
  address: string | null
): boolean {
  const { connectedProfile } = useAuth();
  const profileId = connectedProfile?.id ?? null;
  const { data: devices } = useQuery({
    queryKey: ownE2eeDevicesQueryKey(profileId, address),
    queryFn: ({ signal }) => fetchOwnE2eeDevices(profileId, signal),
    enabled:
      grant !== null &&
      address !== null &&
      profileId !== null &&
      isE2eeEnabled(),
  });
  if (!grant || !devices) {
    return false;
  }
  return devices.some(
    (device) =>
      device.revoked_at === null &&
      device.grant_message !== null &&
      device.grant_message !== undefined &&
      device.grant_id === grant.id
  );
}
