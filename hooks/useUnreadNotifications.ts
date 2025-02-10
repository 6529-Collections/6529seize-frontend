import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useRef } from "react";
import { ApiNotificationsResponse } from "../generated/models/ApiNotificationsResponse";
import { commonApiFetch } from "../services/api/common-api";
import { QueryKey } from "../components/react-query-wrapper/ReactQueryWrapper";
import useCapacitor from "./useCapacitor";

export function useUnreadNotifications(handle: string | undefined) {
  const { isCapacitor } = useCapacitor();

  const [refetchEnabled, setRefetchEnabled] = useState(
    !document.hidden || !isCapacitor
  );
  const refetchIntervalRef = useRef<number | undefined>(30000);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setRefetchEnabled(!document.hidden || !isCapacitor);
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  const { data: notifications, refetch } = useQuery<ApiNotificationsResponse>({
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
    refetchInterval: refetchEnabled ? refetchIntervalRef.current : false,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
  });

  const [haveUnreadNotifications, setHaveUnreadNotifications] = useState(false);

  useEffect(() => {
    setHaveUnreadNotifications(!!notifications?.unread_count);
  }, [notifications]);

  return { notifications, haveUnreadNotifications };
}
