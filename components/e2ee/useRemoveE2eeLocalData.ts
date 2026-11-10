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
export function useRemoveE2eeLocalData(): (() => Promise<void>) | null {
  const { profileId, restart } = useE2ee();
  const remove = useCallback(async () => {
    if (!profileId) {
      return;
    }
    await removeE2eeProfileLocalData(profileId);
    clearE2eeLocalMarkers(profileId);
    restart();
  }, [profileId, restart]);
  return profileId ? remove : null;
}
