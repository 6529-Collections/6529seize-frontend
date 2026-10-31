"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { getE2eeDeviceLabel } from "../e2eeDeviceLabel";
import { detectE2eePlatform } from "../e2eePlatform";
import { looksLikeClearOnExitBrowser } from "./e2eeStorageDurability";

/**
 * Before enrolling, reads the profile's devices (GET /e2ee/me needs no
 * registered device) and says whether this browser seems to delete its data
 * when it closes. Pass the profile id only while this browser has no
 * encrypted-messages state of its own; null skips the check. Browsers only:
 * the 6529 apps keep their storage. Failures show no warning.
 */
export function useE2eeClearOnExitWarning(profileId: string | null): boolean {
  const { data } = useQuery({
    queryKey: [QueryKey.E2EE_ENROLLMENT_DEVICES, profileId],
    queryFn: async () => {
      const platform = detectE2eePlatform();
      if (platform !== "web") {
        return false;
      }
      // The REST client loads on demand, like the engine (e2eeEngineLoader).
      const { createE2eeApiClient } = await import("@/lib/e2ee/api");
      const me = await createE2eeApiClient().getMe();
      return looksLikeClearOnExitBrowser({
        devices: me.devices,
        label: getE2eeDeviceLabel(platform),
        now: Date.now(),
      });
    },
    enabled: profileId !== null,
    retry: false,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
  });
  return profileId !== null && data === true;
}
