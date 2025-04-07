import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { ApiNotificationsResponse } from "../generated/models/ApiNotificationsResponse";
import { commonApiFetch } from "../services/api/common-api";
import useCapacitor from "./useCapacitor";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "../components/react-query-wrapper/utils/query-utils";
export function useUnreadNotifications(handle: string | undefined) {
  const { isCapacitor } = useCapacitor();

  const { data: notifications } = useQuery<ApiNotificationsResponse>({
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      { identity: handle, limit: "1" },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiNotificationsResponse>({
        endpoint: `notifications`,
        params: {
          limit: "1",
        },
      }),
    enabled: !!handle,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
    ...getDefaultQueryRetry(),
  });

  const [haveUnreadNotifications, setHaveUnreadNotifications] = useState(false);

  useEffect(() => {
    setHaveUnreadNotifications(!!notifications?.unread_count);
  }, [notifications]);

  return { notifications, haveUnreadNotifications };
}
