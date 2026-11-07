"use client";

import { applyDelayJitter } from "@/helpers/jitter.helpers";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

// A drop in a wave missing from the list reaches every online tab within
// about 0.4 s. Each tab refreshes its list once, at a uniform random delay
// of 2-20 s, so the server sees a spread instead of a spike.
const UNKNOWN_WAVE_REFRESH_DELAY_MS = 11_000;
const UNKNOWN_WAVE_REFRESH_JITTER_RATIO = 9 / 11;
// After a refresh, further drops wait at least this long for the next one.
const UNKNOWN_WAVE_REFRESH_MIN_GAP_MS = 30_000;

const isTabHidden = () =>
  typeof document !== "undefined" && document.visibilityState === "hidden";

/**
 * Coalesces list refreshes for drops in waves the list doesn't have. The
 * first such drop schedules one jittered refresh; drops while it is pending
 * add nothing; drops within the minimum gap after it get one trailing
 * refresh. A hidden tab waits until it is visible.
 */
export function useUnknownWaveRefresh(
  refresh: () => void,
  enabled: boolean
): () => void {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const waitingForVisibleRef = useRef(false);
  const lastRefreshAtRef = useRef<number | null>(null);
  const refreshRef = useRef(refresh);
  useLayoutEffect(() => {
    refreshRef.current = refresh;
  }, [refresh]);

  const cancel = useCallback(() => {
    if (timerRef.current !== null) clearTimeout(timerRef.current);
    timerRef.current = null;
    waitingForVisibleRef.current = false;
  }, []);

  const schedule = useCallback(() => {
    const lastRefreshAt = lastRefreshAtRef.current;
    const gapLeft =
      lastRefreshAt === null
        ? 0
        : Math.max(
            0,
            lastRefreshAt + UNKNOWN_WAVE_REFRESH_MIN_GAP_MS - Date.now()
          );
    const delay =
      gapLeft +
      applyDelayJitter(
        UNKNOWN_WAVE_REFRESH_DELAY_MS,
        UNKNOWN_WAVE_REFRESH_JITTER_RATIO
      );
    timerRef.current = setTimeout(() => {
      timerRef.current = null;
      if (isTabHidden()) {
        waitingForVisibleRef.current = true;
        return;
      }
      lastRefreshAtRef.current = Date.now();
      refreshRef.current();
    }, delay);
  }, []);

  const request = useCallback(() => {
    if (!enabled || timerRef.current !== null || waitingForVisibleRef.current)
      return;
    if (isTabHidden()) {
      waitingForVisibleRef.current = true;
      return;
    }
    schedule();
  }, [enabled, schedule]);

  useEffect(() => {
    if (!enabled) return;
    const onVisibilityChange = () => {
      if (isTabHidden() || !waitingForVisibleRef.current) return;
      waitingForVisibleRef.current = false;
      schedule();
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      cancel();
    };
  }, [cancel, enabled, schedule]);

  return request;
}
