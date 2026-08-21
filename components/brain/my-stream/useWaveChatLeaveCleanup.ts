"use client";

import { useEffect, useEffectEvent, useLayoutEffect, useRef } from "react";

type SetUnreadDividerSerialNo = (
  serialNo: number | null | ((current: number | null) => number | null)
) => void;

interface MarkWaveNotificationsReadOptions {
  readonly shouldSend?: () => boolean;
  readonly queueIfBlocked?: boolean;
  readonly readThroughSerialNo?: number | undefined;
  readonly requestDmUnreadState?: boolean;
}

interface UseWaveChatLeaveCleanupParams {
  readonly enabled: boolean;
  readonly isDirectMessage?: boolean | undefined;
  readonly readThroughSerialNo?: number | undefined;
  readonly waveId: string;
  readonly setUnreadDividerSerialNo: SetUnreadDividerSerialNo;
  readonly removeWaveDeliveredNotifications: (
    waveId: string
  ) => Promise<unknown> | void;
  readonly markWaveNotificationsRead: (
    waveId: string,
    options?: MarkWaveNotificationsReadOptions
  ) => Promise<unknown> | void;
}

export function useWaveChatLeaveCleanup({
  enabled,
  isDirectMessage = false,
  readThroughSerialNo,
  waveId,
  setUnreadDividerSerialNo,
  removeWaveDeliveredNotifications,
  markWaveNotificationsRead,
}: UseWaveChatLeaveCleanupParams) {
  const readBoundaryByWaveRef = useRef(
    new Map<
      string,
      {
        readonly isDirectMessage: boolean;
        readonly readThroughSerialNo: number | undefined;
      }
    >()
  );

  useLayoutEffect(() => {
    readBoundaryByWaveRef.current.set(waveId, {
      isDirectMessage,
      readThroughSerialNo,
    });
  }, [isDirectMessage, readThroughSerialNo, waveId]);

  const cleanupLeftWave = useEffectEvent((leftWaveId: string) => {
    const readBoundary = readBoundaryByWaveRef.current.get(leftWaveId);
    readBoundaryByWaveRef.current.delete(leftWaveId);
    setUnreadDividerSerialNo(null);
    void (async () => {
      if (document.visibilityState !== "visible") {
        return;
      }

      try {
        await Promise.resolve(removeWaveDeliveredNotifications(leftWaveId));
      } catch (error: unknown) {
        console.error("Failed to remove wave delivered notifications:", error);
      }

      try {
        const dmReadOptions = readBoundary?.isDirectMessage
          ? {
              readThroughSerialNo:
                readBoundary.readThroughSerialNo === undefined
                  ? 0
                  : Math.max(0, Math.floor(readBoundary.readThroughSerialNo)),
              requestDmUnreadState: true,
            }
          : {};
        await markWaveNotificationsRead(leftWaveId, {
          queueIfBlocked: false,
          ...dmReadOptions,
        });
      } catch (error: unknown) {
        console.error("Failed to mark feed as read:", error);
      }
    })();
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    return () => {
      cleanupLeftWave(waveId);
    };
  }, [enabled, waveId]);
}
