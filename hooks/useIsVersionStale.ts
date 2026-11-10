"use client";

import { publicEnv } from "@/config/env";
import { applyDelayJitter } from "@/helpers/jitter.helpers";
import {
  getVersionPollHeaders,
  noteAnnouncedVersion,
  parseReleaseOrder,
} from "@/lib/version/versionPoll";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { subscribeNativeAppActivity } from "@/services/app-activity/native-app-activity";

const CURRENT = publicEnv.VERSION ?? "unknown";
const CURRENT_RELEASE_ORDER = parseReleaseOrder(
  publicEnv.VERSION_RELEASE_ORDER
);
const SHOW_NEW_VERSION_TOAST_PARAM = "showNewVersionToast";
const VERSION_ENDPOINT = "/api/version";
// Showing a tab fires visibilitychange and focus together; check only once.
const WAKE_RECHECK_DEBOUNCE_MS = 1_000;
// A hidden tab checks rarely (10-15 min, jittered) so a long-lived tab still
// learns about new versions and reports itself for adoption telemetry.
const HIDDEN_CHECK_DELAY_MS = 12.5 * 60 * 1000;
const HIDDEN_CHECK_JITTER_RATIO = 0.2;

type VersionStatusResponse = {
  readonly stale?: unknown;
  readonly announced_version?: unknown;
  readonly announced_release_order?: unknown;
};

/**
 * Whether the URL carries the `showNewVersionToast=true` preview flag. It
 * follows client-side query changes, so a deep link can force the update
 * control after mount. Render it under Suspense: it reads search params.
 */
export function useVersionPreviewFlag(): boolean {
  const searchParams = useSearchParams();
  return searchParams.get(SHOW_NEW_VERSION_TOAST_PARAM) === "true";
}

/**
 * Polls the deployed version. `shouldForceShowNewVersionToast` comes from
 * useVersionPreviewFlag; while it is still null (the reader has not rendered
 * yet) nothing is checked, so a forced preview never polls first.
 */
export function useIsVersionStale(
  interval = 120_000,
  enabled = true,
  // null: not known yet.
  shouldForceShowNewVersionToast: boolean | null = false
) {
  const [stale, setStale] = useState(shouldForceShowNewVersionToast === true);

  useEffect(() => {
    if (!enabled || shouldForceShowNewVersionToast === null) {
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
    let hiddenTimer: ReturnType<typeof setTimeout> | undefined;

    const isHidden = () => document.visibilityState === "hidden";

    /** Check update availability for the build loaded in this tab. */
    async function check() {
      lastCheckAt = Date.now();
      // Checks can overlap after a wake; only the newest one may set state.
      latestCheckId += 1;
      const checkId = latestCheckId;
      try {
        const response = await fetch(VERSION_ENDPOINT, {
          cache: "no-store",
          headers: getVersionPollHeaders(
            CURRENT,
            isHidden(),
            CURRENT_RELEASE_ORDER
          ),
        }).then((r) => r.json() as Promise<VersionStatusResponse>);

        if (
          !disposed &&
          checkId === latestCheckId &&
          typeof response.stale === "boolean"
        ) {
          // Older servers can still answer during the first ordered rollout.
          // An ordered page requires a newer announced order even from them.
          const announcedOrder = parseReleaseOrder(
            response.announced_release_order
          );
          const updateAvailable =
            response.stale &&
            (CURRENT_RELEASE_ORDER === null ||
              (announcedOrder !== null &&
                announcedOrder > CURRENT_RELEASE_ORDER));
          if (updateAvailable) {
            noteAnnouncedVersion(CURRENT, response.announced_version);
          }
          setStale(updateAvailable);
        }
      } catch {
        /* ignore network errors */
      }
    }

    function stopPolling() {
      clearInterval(timer);
      timer = undefined;
    }

    function stopHiddenChecks() {
      clearTimeout(hiddenTimer);
      hiddenTimer = undefined;
    }

    function scheduleHiddenCheck() {
      stopHiddenChecks();
      hiddenTimer = setTimeout(
        () => {
          hiddenTimer = undefined;
          if (!isHidden()) return;
          void check();
          scheduleHiddenCheck();
        },
        applyDelayJitter(HIDDEN_CHECK_DELAY_MS, HIDDEN_CHECK_JITTER_RATIO)
      );
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
      stopHiddenChecks();
      stopPolling();
      if (Date.now() - lastCheckAt > WAKE_RECHECK_DEBOUNCE_MS) {
        void check();
      }
      startPolling();
    }

    // A hidden tab drops to the rare hidden check; it catches up as soon as
    // it is shown, focused again, or back online.
    const onWake = () => {
      if (!isHidden()) {
        resumePolling();
      }
    };
    const onVisibilityChange = () => {
      if (isHidden()) {
        stopPolling();
        scheduleHiddenCheck();
      } else {
        resumePolling();
      }
    };

    if (isHidden()) {
      scheduleHiddenCheck();
    } else {
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
      stopHiddenChecks();
      document.removeEventListener("visibilitychange", onVisibilityChange);
      globalThis.removeEventListener("focus", onWake);
      globalThis.removeEventListener("online", onWake);
      unsubscribeNativeActivity();
    };
  }, [interval, enabled, shouldForceShowNewVersionToast]);

  return enabled && stale;
}
