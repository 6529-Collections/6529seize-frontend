"use client";

import { publicEnv } from "@/config/env";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { subscribeNativeAppActivity } from "@/services/app-activity/native-app-activity";

const CURRENT = publicEnv.VERSION ?? "unknown"; // baked into the bundle
const SHOW_NEW_VERSION_TOAST_PARAM = "showNewVersionToast";
const CLIENT_VERSION_HEADER = "x-6529-client-version";
const VERSION_ENDPOINT = "/api/version";
// Showing a tab fires visibilitychange and focus together; check only once.
const WAKE_RECHECK_DEBOUNCE_MS = 1_000;

type VersionStatusResponse = {
  readonly stale?: unknown;
};

export function useIsVersionStale(interval = 120_000, enabled = true) {
  const searchParams = useSearchParams();
  const shouldForceShowNewVersionToast =
    searchParams.get(SHOW_NEW_VERSION_TOAST_PARAM) === "true";
  const [stale, setStale] = useState(shouldForceShowNewVersionToast);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    if (shouldForceShowNewVersionToast) {
      setStale(true);
      return;
    }

    let disposed = false;
    let lastCheckAt = Number.NEGATIVE_INFINITY;
    let latestCheckId = 0;
    let timer: ReturnType<typeof setInterval> | undefined;

    const isHidden = () => document.visibilityState === "hidden";

    async function check() {
      lastCheckAt = Date.now();
      // Checks can overlap after a wake; only the newest one may set state.
      latestCheckId += 1;
      const checkId = latestCheckId;
      try {
        const { stale } = await fetch(VERSION_ENDPOINT, {
          cache: "no-store",
          headers: {
            [CLIENT_VERSION_HEADER]: CURRENT,
          },
        }).then((r) => r.json() as Promise<VersionStatusResponse>);

        if (
          !disposed &&
          checkId === latestCheckId &&
          typeof stale === "boolean"
        ) {
          setStale(stale);
        }
      } catch {
        /* ignore network errors */
      }
    }

    function stopPolling() {
      clearInterval(timer);
      timer = undefined;
    }

    function startPolling() {
      timer = setInterval(() => {
        if (!isHidden()) {
          void check();
        }
      }, interval);
    }

    // Restart the polling cadence from this moment, checking now unless a
    // check just ran (visibilitychange and focus fire together).
    function resumePolling() {
      stopPolling();
      if (Date.now() - lastCheckAt > WAKE_RECHECK_DEBOUNCE_MS) {
        void check();
      }
      startPolling();
    }

    // A hidden tab neither polls nor keeps a timer alive; it catches up as
    // soon as it is shown, focused again, or back online.
    const onWake = () => {
      if (!isHidden()) {
        resumePolling();
      }
    };
    const onVisibilityChange = () => {
      if (isHidden()) {
        stopPolling();
      } else {
        resumePolling();
      }
    };

    if (!isHidden()) {
      resumePolling();
    }
    document.addEventListener("visibilitychange", onVisibilityChange);
    globalThis.addEventListener("focus", onWake);
    globalThis.addEventListener("online", onWake);
    // The native app's resume signal, in case the web view's own visibility
    // events arrive late or not at all.
    const unsubscribeNativeActivity = subscribeNativeAppActivity(onWake);

    return () => {
      disposed = true;
      stopPolling();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      globalThis.removeEventListener("focus", onWake);
      globalThis.removeEventListener("online", onWake);
      unsubscribeNativeActivity();
    };
  }, [interval, enabled, shouldForceShowNewVersionToast]);

  return enabled && stale;
}
