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
    removeWaveDeliveredNotifications(waveId);
    commonApiPostWithoutBodyAndResponse({
      endpoint: `notifications/wave/${waveId}/read`,
    })
      .then(() => {
        invalidateNotifications();
      })
      .catch((error) => console.error("Failed to mark feed as read:", error));
  }, [waveId, removeWaveDeliveredNotifications, invalidateNotifications]);
};
