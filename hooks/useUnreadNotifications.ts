"use client";

import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import type { ApiNotificationsResponseV2 } from "@/generated/models/ApiNotificationsResponseV2";
import { commonApiFetch } from "@/services/api/common-api";
import useCapacitor from "./useCapacitor";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  getAuthAwareQueryRetry,
  isUnauthorizedQueryError,
} from "@/components/react-query-wrapper/utils/query-utils";
import { getAuthJwt, isAuthJwtUsable } from "@/services/auth/auth.utils";

interface UseUnreadNotificationsOptions {
  readonly enabled?: boolean | undefined;
}

const createMissingAuthError = (): Error & { readonly status: 401 } => {
  const error = new Error("Unread notification polling requires valid auth") as
    | Error
    | (Error & { status: 401 });
  Object.defineProperty(error, "status", {
    value: 401,
    enumerable: true,
  });
  return error as Error & { readonly status: 401 };
};

const getTokenFingerprint = (jwt: string | null): string => {
  if (!jwt) {
    return "none";
  }

  let hash = 0;
  for (let index = 0; index < jwt.length; index += 1) {
    hash = (hash * 31 + jwt.charCodeAt(index)) >>> 0;
  }
  return `${jwt.length}:${hash.toString(36)}`;
};

export function useUnreadNotifications(
  handle: string | null,
  options: UseUnreadNotificationsOptions = {}
) {
  const { isCapacitor } = useCapacitor();
  const authJwt = getAuthJwt();
  const hasUsableAuthJwt = isAuthJwtUsable(authJwt);
  const authPollingKey = `${handle ?? ""}:${getTokenFingerprint(authJwt)}`;
  const [blockedAuthPollingKey, setBlockedAuthPollingKey] = useState<
    string | null
  >(null);
  const isAuthPollingBlocked = blockedAuthPollingKey === authPollingKey;
  const isEnabled =
    !!handle &&
    options.enabled !== false &&
    hasUsableAuthJwt &&
    !isAuthPollingBlocked;

  const { data: notifications } = useQuery<ApiNotificationsResponseV2>({
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      { identity: handle, limit: "1", version: "v2" },
    ],
    queryFn: async () => {
      if (!isAuthJwtUsable(getAuthJwt())) {
        setBlockedAuthPollingKey(authPollingKey);
        throw createMissingAuthError();
      }

      try {
        return await commonApiFetch<ApiNotificationsResponseV2>({
          endpoint: `v2/notifications`,
          params: {
            limit: "1",
          },
        });
      } catch (error) {
        if (isUnauthorizedQueryError(error)) {
          setBlockedAuthPollingKey(authPollingKey);
        }
        throw error;
      }
    },
    enabled: isEnabled,
    refetchInterval: 30000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
    ...getAuthAwareQueryRetry(),
  });

  const [haveUnreadNotifications, setHaveUnreadNotifications] = useState(false);

  useEffect(() => {
    setHaveUnreadNotifications(!!notifications?.unread_count);
  }, [notifications]);

  return { notifications, haveUnreadNotifications };
}
