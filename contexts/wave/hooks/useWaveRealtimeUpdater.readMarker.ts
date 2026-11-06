"use client";

import { useWaveNotificationsReadMarkerState } from "@/hooks/useMarkWaveNotificationsRead";
import {
  useDebouncedWaveReads,
  type FlushWaveRead,
} from "@/hooks/useMarkWaveNotificationsRead.debounce";
import { useCallback, useRef, type RefObject } from "react";
import {
  reportBackgroundTaskError,
  type UseWaveRealtimeUpdaterProps,
} from "./useWaveRealtimeUpdater.helpers";

interface ActiveWaveReadOptions {
  /** Sends at once instead of joining the batched read (legacy DMs). */
  readonly immediate?: boolean;
}

export type MarkActiveWaveAsRead = (
  waveId: string,
  readThroughSerialNo?: number,
  options?: ActiveWaveReadOptions
) => void;

/**
 * Marks the open wave read for drops that arrive while it is visible. With
 * `batchReads`, the reads join a short window (see useDebouncedWaveReads);
 * otherwise, and for legacy direct messages, each one is sent at once.
 */
export const useActiveWaveReadMarker = ({
  activeWaveId,
  activeWaveIdRef,
  batchReads,
  removeWaveDeliveredNotifications,
}: Pick<UseWaveRealtimeUpdaterProps, "removeWaveDeliveredNotifications"> & {
  readonly activeWaveId: string | null;
  readonly activeWaveIdRef: RefObject<string | null>;
  readonly batchReads: boolean;
}): MarkActiveWaveAsRead => {
  const pendingReadNotificationsRef = useRef<Promise<void> | null>(null);

  const { markWaveNotificationsRead, identityKey } =
    useWaveNotificationsReadMarkerState();
  const canSendReadForWave = useCallback(
    (waveId: string): boolean => {
      return (
        activeWaveIdRef.current === waveId &&
        document.visibilityState === "visible"
      );
    },
    [activeWaveIdRef]
  );

  const removeDeliveredNotifications = useCallback(
    async (waveId: string) => {
      try {
        await removeWaveDeliveredNotifications(waveId);
      } catch (error) {
        reportBackgroundTaskError(
          "Failed to remove wave delivered notifications:",
          error
        );
      }
    },
    [removeWaveDeliveredNotifications]
  );

  const markNotificationsRead = useCallback(
    async (
      waveId: string,
      readThroughSerialNo?: number,
      shouldSend: () => boolean = () => canSendReadForWave(waveId)
    ) => {
      try {
        const result = await markWaveNotificationsRead(waveId, {
          shouldSend,
          readThroughSerialNo,
        });
        if (result === "sent") await removeDeliveredNotifications(waveId);
      } catch (error) {
        reportBackgroundTaskError("Failed to mark wave as read:", error);
      }
    },
    [
      markWaveNotificationsRead,
      canSendReadForWave,
      removeDeliveredNotifications,
    ]
  );

  const flushBatchedRead = useCallback<FlushWaveRead>(
    (waveId, readThroughSerialNo, reason) => {
      if (reason === "timer") {
        pendingReadNotificationsRef.current = markNotificationsRead(
          waveId,
          readThroughSerialNo
        );
        return;
      }
      // The reader saw this batch, but is leaving, hiding the window or
      // unmounting. The read goes now or not at all: a read for an ordinary
      // wave marks the whole wave read when the server gets it, so it must not
      // wait for auth or an earlier read and then cover messages that arrived
      // after the reader left.
      let isFlushing = true;
      pendingReadNotificationsRef.current = markNotificationsRead(
        waveId,
        readThroughSerialNo,
        () => isFlushing
      );
      isFlushing = false;
    },
    [markNotificationsRead]
  );

  const { enqueue: enqueueBatchedRead } = useDebouncedWaveReads({
    activeWaveId,
    identityKey,
    flush: flushBatchedRead,
  });

  return useCallback<MarkActiveWaveAsRead>(
    (waveId, readThroughSerialNo, options) => {
      if (
        activeWaveIdRef.current !== waveId ||
        document.visibilityState !== "visible"
      ) {
        return;
      }

      if (batchReads && options?.immediate !== true) {
        enqueueBatchedRead(waveId, readThroughSerialNo);
        return;
      }

      pendingReadNotificationsRef.current = markNotificationsRead(
        waveId,
        readThroughSerialNo
      );
    },
    [activeWaveIdRef, batchReads, enqueueBatchedRead, markNotificationsRead]
  );
};
