"use client";

import { useAuth } from "@/components/auth/Auth";
import { useSeizeConnectContext } from "@/components/auth/SeizeConnectContext";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import type { ApiDeviceSecurityNotice } from "@/generated/models/ApiDeviceSecurityNotice";
import { fetchDeviceSecurityNotices } from "@/services/api/device-grants-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function deviceSecurityNoticeKey(notice: ApiDeviceSecurityNotice) {
  return notice.signing_grant_id ?? notice.encrypted_dm_device_key;
}

export function useDeviceSecurityNotices(enabled: boolean) {
  const { activeProfileProxy, connectedProfile, isAuthenticated } = useAuth();
  const { address } = useSeizeConnectContext();
  const queryClient = useQueryClient();
  const account = address?.toLowerCase();
  const canQuery =
    enabled && isAuthenticated === true && !!account && !activeProfileProxy;
  const queryKey = [
    QueryKey.DEVICE_SECURITY_NOTICES,
    connectedProfile?.id,
    account,
  ] as const;

  const { data: notices } = useQuery({
    queryKey,
    queryFn: ({ signal }) => fetchDeviceSecurityNotices(signal),
    enabled: canQuery,
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
    refetchInterval: 60_000,
  });

  const removeNotice = async (notice: ApiDeviceSecurityNotice) => {
    const key = deviceSecurityNoticeKey(notice);
    await queryClient.cancelQueries({ queryKey, exact: true });
    queryClient.setQueryData<ApiDeviceSecurityNotice[] | null>(
      queryKey,
      (previous) =>
        previous?.filter((entry) => deviceSecurityNoticeKey(entry) !== key) ??
        previous
    );
    void queryClient.invalidateQueries({ queryKey, exact: true });
    if (notice.signing_grant_id) {
      void queryClient.invalidateQueries({
        queryKey: [QueryKey.DEVICE_GRANTS],
      });
    }
  };

  return { notices: canQuery ? notices : undefined, removeNotice };
}
