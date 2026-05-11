"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { ApiNotificationsResponseV2 } from "@/generated/models/ApiNotificationsResponseV2";
import { commonApiFetch } from "@/services/api/common-api";
import useCapacitor from "./useCapacitor";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
export function useUnreadNotifications(handle: string | null) {
  const { isCapacitor } = useCapacitor();

  const { data: notifications } = useQuery<ApiNotificationsResponseV2>({
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      { identity: handle, limit: "1", version: "v2" },
    ],
    queryFn: async () =>
      await commonApiFetch<ApiNotificationsResponseV2>({
        endpoint: `v2/notifications`,
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
