import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiE2eeDevice, ApiE2eeMe } from "@/lib/e2ee/api-types";
import { commonApiFetch } from "@/services/api/common-api";

/**
 * The signed-in profile's encrypted-DMs devices from the API (`e2ee/me`),
 * for screens that can't wait for the encrypted-messages engine.
 */
export const ownE2eeDevicesQueryKey = (
  profileId: string | null,
  address: string | null
) => [QueryKey.E2EE_PROFILE_DEVICES, profileId, address] as const;

export async function fetchOwnE2eeDevices(
  profileId: string | null,
  signal: AbortSignal
): Promise<ApiE2eeDevice[]> {
  const data = await commonApiFetch<ApiE2eeMe>({
    endpoint: "e2ee/me",
    signal,
  });
  if (data.profile_id !== profileId) {
    throw new Error("Device profile changed");
  }
  return data.devices;
}
