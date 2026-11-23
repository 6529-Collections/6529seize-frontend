"use client";

import { useCallback } from "react";
import { useE2ee } from "@/hooks/e2ee/useE2ee";
import { removeE2eeProfileLocalData } from "@/lib/e2ee/local-data";
import { clearE2eeLocalMarkers } from "./e2eeLocalState";

/**
 * "Remove encrypted messages from this browser" for the signed-in profile,
 * without signing out: the same removal sign-out offers (it takes the
 * profile's engine lock first, so a running engine stops and cannot write
 * back), then the engine starts again with nothing saved. It works whatever
 * the engine's state, for example while it is stopped.
 */
export function useRemoveE2eeLocalData():
  | ((onlyDeviceKey?: string) => Promise<boolean>)
  | null {
  const { profileId, restart } = useE2ee();
  const remove = useCallback(
    async (onlyDeviceKey?: string) => {
      if (!profileId) {
        return false;
      }
      // With a device key: only while that is still this browser's device.
      const removed =
        onlyDeviceKey === undefined
          ? await removeE2eeProfileLocalData(profileId)
          : await removeE2eeProfileLocalData(profileId, { onlyDeviceKey });
      if (removed !== false) {
        clearE2eeLocalMarkers(profileId);
        restart();
      }
      return removed !== false;
    },
    [profileId, restart]
  );
  return profileId ? remove : null;
}
