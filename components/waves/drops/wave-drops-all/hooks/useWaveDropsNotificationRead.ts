import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useContext, useEffect } from "react";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";

interface UseWaveDropsNotificationReadParams {
  readonly waveId: string;
  readonly removeWaveDeliveredNotifications: (
    waveId: string
  ) => Promise<unknown> | void;
}

export const useWaveDropsNotificationRead = ({
  waveId,
  removeWaveDeliveredNotifications,
}: UseWaveDropsNotificationReadParams) => {
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);

  useEffect(() => {
    const syncReadState = async () => {
      try {
        await Promise.resolve(removeWaveDeliveredNotifications(waveId));
      } catch (error) {
        console.error("Failed to remove wave delivered notifications:", error);
      }

      commonApiPostWithoutBodyAndResponse({
        endpoint: `notifications/wave/${waveId}/read`,
      })
        .then(() => {
          invalidateNotifications();
        })
        .catch((error) => console.error("Failed to mark feed as read:", error));
    };

    syncReadState();
  }, [waveId, removeWaveDeliveredNotifications, invalidateNotifications]);
};
