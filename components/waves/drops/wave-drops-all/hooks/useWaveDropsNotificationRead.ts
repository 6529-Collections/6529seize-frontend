import { useMarkWaveNotificationsRead } from "@/hooks/useMarkWaveNotificationsRead";
import { useEffect, useEffectEvent } from "react";

interface UseWaveDropsNotificationReadParams {
  readonly waveId: string;
  readonly enabled?: boolean | undefined;
  readonly removeWaveDeliveredNotifications: (
    waveId: string
  ) => Promise<unknown> | void;
}

export const useWaveDropsNotificationRead = ({
  waveId,
  enabled = true,
  removeWaveDeliveredNotifications,
}: UseWaveDropsNotificationReadParams) => {
  const markWaveNotificationsRead = useMarkWaveNotificationsRead();

  const syncReadState = useEffectEvent(async (targetWaveId: string) => {
    if (document.visibilityState !== "visible") {
      return;
    }

    try {
      await Promise.resolve(removeWaveDeliveredNotifications(targetWaveId));
    } catch (error) {
      console.error("Failed to remove wave delivered notifications:", error);
    }

    try {
      await markWaveNotificationsRead(targetWaveId);
    } catch (error) {
      console.error("Failed to mark feed as read:", error);
    }
  });

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const syncReadStateWhenVisible = () => {
      if (document.visibilityState === "visible") {
        void syncReadState(waveId);
      }
    };

    void syncReadState(waveId);
    document.addEventListener("visibilitychange", syncReadStateWhenVisible);
    return () =>
      document.removeEventListener(
        "visibilitychange",
        syncReadStateWhenVisible
      );
  }, [enabled, waveId]);
};
