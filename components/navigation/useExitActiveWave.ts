"use client";

import { useCallback } from "react";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { useViewContext } from "./ViewContext";
import { useRouter } from "next/navigation";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import {
  PROFILE_WAVES_FEED_HREF,
  isProfileWavesFeed,
  returnsToProfileWavesFeed,
} from "@/helpers/waves/profile-feed-navigation";
import { runWaveNavigationTransition } from "@/helpers/waves/wave-navigation-transition";

export function useExitActiveWave() {
  const myStream = useMyStreamOptional();
  const { clearLastVisited } = useViewContext();
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const setActiveWave = myStream?.activeWave.set;

  return useCallback(
    (isDirectMessage: boolean) => {
      clearLastVisited(isDirectMessage ? "dm" : "wave");
      const search = new URLSearchParams(globalThis.location.search);
      if (
        isApp &&
        !isDirectMessage &&
        !isProfileWavesFeed(globalThis.location.pathname, search) &&
        returnsToProfileWavesFeed(search)
      ) {
        if (setActiveWave) {
          setActiveWave(null, { profileFeed: true });
        } else {
          runWaveNavigationTransition("feed", () =>
            router.push(PROFILE_WAVES_FEED_HREF, { scroll: false })
          );
        }
        return;
      }
      setActiveWave?.(null, { isDirectMessage });
    },
    [clearLastVisited, setActiveWave, isApp, router]
  );
}
