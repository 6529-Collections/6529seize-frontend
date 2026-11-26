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
import { runPhoneChevronBackTransition } from "@/helpers/waves/wave-navigation-transition";
import { getWaveHomeRoute } from "@/helpers/navigation.helpers";

export function useExitActiveWave() {
  const myStream = useMyStreamOptional();
  const { clearLastVisited } = useViewContext();
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const setActiveWave = myStream?.activeWave.set;

  return useCallback(
    (isDirectMessage: boolean) => {
      const search = new URLSearchParams(globalThis.location.search);
      const returnToFeed =
        isApp &&
        !isDirectMessage &&
        !isProfileWavesFeed(globalThis.location.pathname, search) &&
        returnsToProfileWavesFeed(search);
      const destination = returnToFeed
        ? PROFILE_WAVES_FEED_HREF
        : getWaveHomeRoute({ isDirectMessage, isApp });
      runPhoneChevronBackTransition(
        returnToFeed ? "/waves" : destination,
        () => {
          clearLastVisited(isDirectMessage ? "dm" : "wave");
          if (setActiveWave)
            setActiveWave(
              null,
              returnToFeed ? { profileFeed: true } : { isDirectMessage }
            );
          else router.push(destination, { scroll: false });
        }
      );
    },
    [clearLastVisited, setActiveWave, isApp, router]
  );
}
