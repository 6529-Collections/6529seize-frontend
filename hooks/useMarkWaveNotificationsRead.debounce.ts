"use client";

import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

/**
 * Read markers for an open wave wait at most this long, so a burst of
 * messages sends one read (owner decision D2: another device may see the
 * read up to 3 s later).
 */
export const WAVE_READ_DEBOUNCE_MS = 3_000;

/**
 * Why a batched read is sent: its window ended ("timer"), or the reader
 * left the wave, blurred or hid the window, or the marker unmounted.
 */
export type WaveReadFlushReason = "timer" | "leave" | "blur" | "unmount";

export type FlushWaveRead = (
  waveId: string,
  readThroughSerialNo: number | undefined,
  reason: WaveReadFlushReason
) => void;

interface PendingWaveRead {
  readThroughSerialNo: number | undefined;
  readonly timer: ReturnType<typeof setTimeout>;
}

const maxDefinedSerialNo = (
  current: number | undefined,
  next: number | undefined
): number | undefined => {
  if (current === undefined) return next;
  if (next === undefined) return current;
  return Math.max(current, next);
};

/**
 * Batches the read markers sent while a wave is open. The first marker opens
 * a {@link WAVE_READ_DEBOUNCE_MS} window and later ones join it, so the
 * window sends one read through the newest serial, at most one per wave every
 * 3 s, and never more than 3 s late.
 *
 * A pending read goes out at once when the reader leaves its wave, when the
 * window blurs or hides, and on unmount. A profile switch discards pending
 * reads instead: they belong to the identity that was reading.
 */
export function useDebouncedWaveReads({
  activeWaveId,
  identityKey,
  flush,
}: {
  readonly activeWaveId: string | null;
  readonly identityKey: string;
  readonly flush: FlushWaveRead;
}): {
  readonly enqueue: (
    waveId: string,
    readThroughSerialNo: number | undefined
  ) => void;
} {
  const pendingRef = useRef(new Map<string, PendingWaveRead>());
  const flushRef = useRef(flush);
  const identityKeyRef = useRef(identityKey);

  const discardAll = useCallback(() => {
    for (const pending of pendingRef.current.values()) {
      clearTimeout(pending.timer);
    }
    pendingRef.current.clear();
  }, []);

  // Runs before the flush callback below is replaced, so no read queued for
  // the previous identity can be sent with the next one's credentials.
  useLayoutEffect(() => {
    if (identityKeyRef.current === identityKey) return;
    identityKeyRef.current = identityKey;
    discardAll();
  }, [discardAll, identityKey]);

  useLayoutEffect(() => {
    flushRef.current = flush;
  }, [flush]);

  const flushOne = useCallback(
    (waveId: string, reason: WaveReadFlushReason) => {
      const pending = pendingRef.current.get(waveId);
      if (pending === undefined) return;
      clearTimeout(pending.timer);
      pendingRef.current.delete(waveId);
      flushRef.current(waveId, pending.readThroughSerialNo, reason);
    },
    []
  );

  const flushAll = useCallback(
    (reason: WaveReadFlushReason) => {
      for (const waveId of pendingRef.current.keys()) {
        flushOne(waveId, reason);
      }
    },
    [flushOne]
  );

  // Leaving a wave sends its pending read.
  useEffect(() => {
    for (const waveId of pendingRef.current.keys()) {
      // eslint-disable-next-line react-you-might-not-need-an-effect/no-pass-ref-to-parent -- The pending reads are this hook's own state; nothing is passed to or from a parent.
      if (waveId !== activeWaveId) flushOne(waveId, "leave");
    }
  }, [activeWaveId, flushOne]);

  useEffect(() => {
    const flushOnBlur = () => flushAll("blur");
    const flushWhenHidden = () => {
      if (document.visibilityState !== "visible") flushAll("blur");
    };
    window.addEventListener("blur", flushOnBlur);
    window.addEventListener("pagehide", flushOnBlur);
    document.addEventListener("visibilitychange", flushWhenHidden);
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, discardAll);
    return () => {
      window.removeEventListener("blur", flushOnBlur);
      window.removeEventListener("pagehide", flushOnBlur);
      document.removeEventListener("visibilitychange", flushWhenHidden);
      globalThis.removeEventListener(PROFILE_SWITCHED_EVENT, discardAll);
      flushAll("unmount");
    };
  }, [discardAll, flushAll]);

  const enqueue = useCallback(
    (waveId: string, readThroughSerialNo: number | undefined) => {
      const pending = pendingRef.current.get(waveId);
      if (pending !== undefined) {
        pending.readThroughSerialNo = maxDefinedSerialNo(
          pending.readThroughSerialNo,
          readThroughSerialNo
        );
        return;
      }
      pendingRef.current.set(waveId, {
        readThroughSerialNo,
        timer: setTimeout(
          () => flushOne(waveId, "timer"),
          WAVE_READ_DEBOUNCE_MS
        ),
      });
    },
    [flushOne]
  );

  return { enqueue };
}
