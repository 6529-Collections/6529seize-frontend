"use client";

import { scheduleStaggered } from "@/helpers/jitter.helpers";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import { WEBSOCKET_RECONNECT_RESYNC_STAGGER_MAX_MS } from "@/services/websocket/WebSocketTypes";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import type { WaveMessages } from "./types";
import { reportBackgroundTaskError } from "./useWaveRealtimeUpdater.helpers";

/** A burst of new drops is verified this long after its last frame. */
export const CHAT_GAP_TRAILING_CHECK_MS = 5_000;
/** A continuous stream is verified at least this often. */
export const CHAT_GAP_TRAILING_CHECK_MAX_WAIT_MS = 15_000;

type FetchNewestSince = (
  waveId: string,
  sinceSerialNo: number
) => Promise<void>;

interface TrailingCheck {
  readonly firstFrameAt: number;
  readonly timer: ReturnType<typeof setTimeout>;
}

export interface WaveGapSync {
  /** Fetches every drop newer than the wave's verified watermark now. */
  readonly requestGapSync: (waveId: string) => void;
  /** Records a new drop that arrived by socket, for the trailing check. */
  readonly noteRealtimeInsert: (waveId: string) => void;
  /** The server asked for a resync: every wave with unverified drops checks. */
  readonly requestResync: () => void;
}

/**
 * The serial number up to which the store is known to match the server: the
 * highest serial an HTTP fetch returned. Drops that arrived by socket after it
 * are unverified until the next newest-drops fetch.
 */
const getVerifiedSerialNo = (waveMessages: WaveMessages): number | null => {
  if (waveMessages.latestFetchedSerialNo !== null) {
    return waveMessages.latestFetchedSerialNo;
  }
  let highest: number | null = null;
  for (const drop of waveMessages.drops) {
    if (drop.id.startsWith("temp-") || !Number.isFinite(drop.serial_no)) {
      continue;
    }
    highest =
      highest === null ? drop.serial_no : Math.max(highest, drop.serial_no);
  }
  return highest;
};

/**
 * Gap-only newest sync (WAVES-PLAN 0.7). A connected socket is trusted: a
 * drop that arrives by socket is applied without a request. The newest drops
 * are fetched only on a gap signal, and once after a burst, when a trailing
 * check fetches everything past the verified watermark, so a silently lost
 * frame shows up at most {@link CHAT_GAP_TRAILING_CHECK_MS} after the burst
 * ({@link CHAT_GAP_TRAILING_CHECK_MAX_WAIT_MS} in a continuous stream).
 *
 * Global serial numbers hide per-wave gaps, so frames alone cannot reveal a
 * lost drop; WAVES-PLAN 1.5 (`prev_serial_no`) replaces the trailing check
 * with exact gap markers.
 *
 * Checks for a wave that is hidden or not in use wait: they run when the
 * window is visible again or the wave becomes active. Reconnects and tab
 * resumes keep their own sync of the active wave in `MyStreamProvider`.
 */
export function useWaveGapSync({
  activeWaveId,
  getData,
  isWaveInUse,
  fetchNewestSince,
}: {
  readonly activeWaveId: string | null;
  readonly getData: (waveId: string) => WaveMessages | undefined;
  readonly isWaveInUse: (waveId: string) => boolean;
  readonly fetchNewestSince: FetchNewestSince;
}): WaveGapSync {
  const trailingChecksRef = useRef(new Map<string, TrailingCheck>());
  // Waves with unverified drops whose check waits for visibility or use.
  const deferredRef = useRef(new Set<string>());
  const cancelResyncRef = useRef<(() => void) | null>(null);
  const activeWaveIdRef = useRef(activeWaveId);

  const cancelTrailingCheck = useCallback((waveId: string) => {
    const check = trailingChecksRef.current.get(waveId);
    if (check === undefined) return;
    clearTimeout(check.timer);
    trailingChecksRef.current.delete(waveId);
  }, []);

  const requestGapSync = useCallback(
    (waveId: string) => {
      cancelTrailingCheck(waveId);
      deferredRef.current.delete(waveId);
      const waveMessages = getData(waveId);
      if (waveMessages === undefined) return;
      const sinceSerialNo = getVerifiedSerialNo(waveMessages);
      if (sinceSerialNo === null) return;
      void (async () => {
        try {
          await fetchNewestSince(waveId, sinceSerialNo);
        } catch (error) {
          reportBackgroundTaskError(
            "Failed to sync newest wave messages:",
            error
          );
        }
      })();
    },
    [cancelTrailingCheck, fetchNewestSince, getData]
  );

  const isCheckable = useCallback(
    (waveId: string): boolean =>
      document.visibilityState === "visible" &&
      (waveId === activeWaveIdRef.current || isWaveInUse(waveId)),
    [isWaveInUse]
  );

  const runTrailingCheck = useCallback(
    (waveId: string) => {
      trailingChecksRef.current.delete(waveId);
      if (isCheckable(waveId)) {
        requestGapSync(waveId);
      } else {
        deferredRef.current.add(waveId);
      }
    },
    [isCheckable, requestGapSync]
  );

  const runDeferredChecks = useCallback(() => {
    for (const waveId of [...deferredRef.current]) {
      if (getData(waveId) === undefined) {
        deferredRef.current.delete(waveId);
      } else if (isCheckable(waveId)) {
        requestGapSync(waveId);
      }
    }
  }, [getData, isCheckable, requestGapSync]);

  // Timers and listeners outlive a render; they call the latest callbacks.
  const latestRef = useRef({ runTrailingCheck, runDeferredChecks });
  useLayoutEffect(() => {
    activeWaveIdRef.current = activeWaveId;
    latestRef.current = { runTrailingCheck, runDeferredChecks };
  });

  const noteRealtimeInsert = useCallback(
    (waveId: string) => {
      if (!isCheckable(waveId)) {
        cancelTrailingCheck(waveId);
        deferredRef.current.add(waveId);
        return;
      }
      const now = Date.now();
      const previous = trailingChecksRef.current.get(waveId);
      if (previous !== undefined) clearTimeout(previous.timer);
      const firstFrameAt = previous?.firstFrameAt ?? now;
      const delay = Math.max(
        0,
        Math.min(
          CHAT_GAP_TRAILING_CHECK_MS,
          firstFrameAt + CHAT_GAP_TRAILING_CHECK_MAX_WAIT_MS - now
        )
      );
      trailingChecksRef.current.set(waveId, {
        firstFrameAt,
        timer: setTimeout(
          () => latestRef.current.runTrailingCheck(waveId),
          delay
        ),
      });
    },
    [cancelTrailingCheck, isCheckable]
  );

  const requestResync = useCallback(() => {
    const waveIds = new Set(trailingChecksRef.current.keys());
    if (activeWaveIdRef.current !== null) waveIds.add(activeWaveIdRef.current);
    for (const waveId of waveIds) {
      cancelTrailingCheck(waveId);
      deferredRef.current.add(waveId);
    }
    if (document.visibilityState !== "visible") return;
    cancelResyncRef.current?.();
    // Every socket gets the marker at once; spread the fetches like the
    // React Query resync does.
    cancelResyncRef.current = scheduleStaggered(() => {
      cancelResyncRef.current = null;
      latestRef.current.runDeferredChecks();
    }, WEBSOCKET_RECONNECT_RESYNC_STAGGER_MAX_MS);
  }, [cancelTrailingCheck]);

  // A wave whose check waited for use checks once it becomes active.
  useEffect(() => {
    if (activeWaveId !== null && deferredRef.current.has(activeWaveId)) {
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-ref-to-parent -- The ref is this hook's own state; nothing is passed to or from a parent.
      requestGapSync(activeWaveId);
    }
  }, [activeWaveId, requestGapSync]);

  useEffect(() => {
    const trailingChecks = trailingChecksRef.current;
    const deferred = deferredRef.current;
    const clearAll = () => {
      for (const check of trailingChecks.values()) clearTimeout(check.timer);
      trailingChecks.clear();
      deferred.clear();
      cancelResyncRef.current?.();
      cancelResyncRef.current = null;
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        latestRef.current.runDeferredChecks();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, clearAll);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      globalThis.removeEventListener(PROFILE_SWITCHED_EVENT, clearAll);
      clearAll();
    };
  }, []);

  return { requestGapSync, noteRealtimeInsert, requestResync };
}
