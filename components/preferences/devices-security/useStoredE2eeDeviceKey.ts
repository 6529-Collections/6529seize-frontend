"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { readStoredE2eeDeviceKey } from "@/lib/e2ee/stored-device-key";

/** Query key of this browser's stored encrypted-messages device key. */
export const storedE2eeDeviceKeyQueryKey = (profileId: string | null) =>
  [QueryKey.E2EE_STORED_DEVICE_KEY, profileId] as const;

/**
 * This browser's stored encrypted device: still being read, unreadable, or
 * known (null when this browser has none). Only a known one can say a row
 * isn't this browser's.
 */
type StoredDeviceKey =
  | { readonly status: "pending" | "failed" }
  | { readonly status: "known"; readonly key: string | null };

/**
 * This browser's encrypted-messages device for the profile, read from its
 * storage, with or without a running engine: the one identity Devices &
 * security uses to tell this browser's encrypted device apart (which row is
 * this browser, which dialog a revoke gets, whether its data is removed).
 */
export function useStoredE2eeDeviceKey(
  profileId: string | null,
  enabled: boolean
): StoredDeviceKey {
  const query = useQuery({
    queryKey: storedE2eeDeviceKeyQueryKey(profileId),
    enabled: enabled && profileId !== null,
    queryFn: () =>
      profileId === null ? null : readStoredE2eeDeviceKey(profileId),
    staleTime: 0,
  });
  if (query.isSuccess) {
    return { status: "known", key: query.data };
  }
  return { status: query.isError ? "failed" : "pending" };
}
