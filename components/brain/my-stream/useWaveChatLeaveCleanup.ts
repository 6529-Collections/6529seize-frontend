"use client";

import { useEffect, useEffectEvent } from "react";

type SetUnreadDividerSerialNo = (
  serialNo: number | null | ((current: number | null) => number | null)
) => void;

interface MarkWaveNotificationsReadOptions {
  readonly shouldSend?: () => boolean;
  readonly queueIfBlocked?: boolean;
}

interface UseWaveChatLeaveCleanupParams {
  readonly enabled: boolean;
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
  waveId,
  setUnreadDividerSerialNo,
  removeWaveDeliveredNotifications,
  markWaveNotificationsRead,
}: UseWaveChatLeaveCleanupParams) {
  const cleanupLeftWave = useEffectEvent((leftWaveId: string) => {
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
        await markWaveNotificationsRead(leftWaveId, {
          queueIfBlocked: false,
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
