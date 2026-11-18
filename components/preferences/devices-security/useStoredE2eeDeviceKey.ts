"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { readStoredE2eeDeviceKey } from "@/lib/e2ee/stored-device-key";

/** Query key of this browser's stored encrypted-messages device key. */
export const storedE2eeDeviceKeyQueryKey = (profileId: string | null) =>
  [QueryKey.E2EE_STORED_DEVICE_KEY, profileId] as const;

/**
 * This browser's encrypted-messages device for the profile, read from its
 * storage, with or without a running engine: the one identity Devices &
 * security uses to tell this browser's encrypted device apart (which row is
 * this browser, which dialog a revoke gets, whether its data is removed).
 * Null while unknown or when this browser has none.
 */
export function useStoredE2eeDeviceKey(
  profileId: string | null,
  enabled: boolean
): string | null {
  const query = useQuery({
    queryKey: storedE2eeDeviceKeyQueryKey(profileId),
    enabled: enabled && profileId !== null,
    queryFn: () =>
      profileId === null ? null : readStoredE2eeDeviceKey(profileId),
    staleTime: 0,
  });
  return query.data ?? null;
}
