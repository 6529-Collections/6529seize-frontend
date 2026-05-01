import { useMarkWaveNotificationsRead } from "@/hooks/useMarkWaveNotificationsRead";
import { useEffect } from "react";

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

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const syncReadState = async () => {
      try {
        await Promise.resolve(removeWaveDeliveredNotifications(waveId));
      } catch (error) {
        console.error("Failed to remove wave delivered notifications:", error);
      }

      try {
        await markWaveNotificationsRead(waveId);
      } catch (error) {
        console.error("Failed to mark feed as read:", error);
      }
    };

    void syncReadState();
  }, [
    enabled,
    waveId,
    removeWaveDeliveredNotifications,
    markWaveNotificationsRead,
  ]);
};
