"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  isUnauthorizedQueryError,
  SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
} from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDmDropsUnreadCount } from "@/generated/models/ApiDmDropsUnreadCount";
import { commonApiFetch } from "@/services/api/common-api";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";
import { getAuthJwt, isAuthJwtUsable } from "@/services/auth/auth.utils";
import useCapacitor from "./useCapacitor";

interface UseUnreadDmDropsOptions {
  readonly enabled?: boolean | undefined;
}

const clampUnreadCount = (count: number | null | undefined): number => {
  if (typeof count !== "number" || Number.isNaN(count) || count <= 0) {
    return 0;
  }

  return Math.floor(count);
};

export function useUnreadDmDrops(
  handle: string | null,
  options: UseUnreadDmDropsOptions = {}
) {
  const { isCapacitor } = useCapacitor();
  const authJwt = getAuthJwt();
  const hasUsableAuthJwt = isAuthJwtUsable(authJwt);
  const authFingerprint = getAuthTokenFingerprint(authJwt);
  const isEnabled = Boolean(
    handle && options.enabled !== false && hasUsableAuthJwt
  );

  const { data } = useQuery<ApiDmDropsUnreadCount>({
    queryKey: [
      QueryKey.DM_DROPS_UNREAD,
      { identity: handle, auth: authFingerprint },
    ],
    queryFn: async () => {
      return commonApiFetch<ApiDmDropsUnreadCount>({
        endpoint: "dm-drops/unread",
        errorMode: "structured",
      });
    },
    enabled: isEnabled,
    refetchInterval: SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
    retry: (failureCount: number, error: unknown) => {
      if (isUnauthorizedQueryError(error)) {
        return false;
      }

      return failureCount < 3;
    },
    retryDelay: (failureCount: number) => failureCount * 1000,
  });

  const unreadDmDrops = isEnabled ? data : undefined;
  const unreadDmDropsCount = clampUnreadCount(unreadDmDrops?.count);

  return {
    unreadDmDrops,
    unreadDmDropsCount,
    haveUnreadDmDrops: unreadDmDropsCount > 0,
  };
}
