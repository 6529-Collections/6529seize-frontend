"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { canNavigateInWaveTabShell } from "@/helpers/waves/wave-tab-shell";
import { getActiveWaveIdFromUrl } from "@/helpers/navigation.helpers";
import {
  PROFILE_FEED_RETURN_PARAM,
  PROFILE_WAVES_FEED_HREF,
  returnsToProfileWavesFeed,
} from "@/helpers/waves/profile-feed-navigation";

export function useWaveTabNavigation() {
  const router = useRouter();

  return useCallback(
    (requestedHref: string, mode: "push" | "replace" = "push") => {
      let href = requestedHref;
      const current = new URL(globalThis.location.href);
      const target = new URL(href, current);
      const waveId = getActiveWaveIdFromUrl({
        pathname: current.pathname,
        searchParams: current.searchParams,
      });
      if (
        current.origin === target.origin &&
        waveId &&
        waveId ===
          getActiveWaveIdFromUrl({
            pathname: target.pathname,
            searchParams: target.searchParams,
          }) &&
        returnsToProfileWavesFeed(current.searchParams)
      ) {
        target.searchParams.set(
          PROFILE_FEED_RETURN_PARAM,
          PROFILE_WAVES_FEED_HREF
        );
        href = target.pathname + target.search + target.hash;
      }
      if (current.href === target.href) return;

      const sharedShellOwnsTransition = canNavigateInWaveTabShell(
        current,
        target
      );

      // Only client-owned tab state can bypass the server. Preserve real
      // navigation when the page, competition, or any command parameter changes.
      current.searchParams.delete("tab");
      target.searchParams.delete("tab");
      current.searchParams.sort();
      target.searchParams.sort();
      if (sharedShellOwnsTransition || current.href === target.href) {
        if (mode === "replace") globalThis.history.replaceState(null, "", href);
        else globalThis.history.pushState(null, "", href);
        return;
      }

      router[mode](href, { scroll: false });
    },
    [router]
  );
}
