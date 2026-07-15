"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiNotificationsResponseV2 } from "@/generated/models/ApiNotificationsResponseV2";
import { commonApiFetch } from "@/services/api/common-api";
import useCapacitor from "./useCapacitor";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  isTerminalNotificationAuthQueryError,
  shouldStopPollingRetry,
} from "@/components/react-query-wrapper/utils/query-utils";
import { getAuthJwt, isAuthJwtUsable } from "@/services/auth/auth.utils";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";

interface UseUnreadNotificationsOptions {
  readonly enabled?: boolean | undefined;
}

type MissingAuthPollingError = Error & {
  readonly status: 401;
};

const createMissingAuthPollingError = (): MissingAuthPollingError => {
  const error = new Error(
    "Unread notification polling requires valid auth"
  ) as MissingAuthPollingError;
  Object.defineProperty(error, "status", {
    value: 401,
    enumerable: true,
  });
  return error;
};

export function useUnreadNotifications(
  handle: string | null,
  options: UseUnreadNotificationsOptions = {}
) {
  const { isCapacitor } = useCapacitor();
  const authJwt = getAuthJwt();
  const hasUsableAuthJwt = isAuthJwtUsable(authJwt);
  const authFingerprint = getAuthTokenFingerprint(authJwt);
  const isEnabled =
    !!handle && options.enabled !== false && hasUsableAuthJwt;

  const { data: notifications, error } = useQuery<ApiNotificationsResponseV2>({
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      {
        auth: authFingerprint,
        identity: handle,
        limit: "1",
        version: "v2",
      },
    ],
    queryFn: async () => {
      if (!authJwt || !isAuthJwtUsable(authJwt) || getAuthJwt() !== authJwt) {
        throw createMissingAuthPollingError();
      }

      return await commonApiFetch<ApiNotificationsResponseV2>({
        endpoint: `v2/notifications`,
        headers: {
          Authorization: `Bearer ${authJwt}`,
        },
        params: {
          limit: "1",
        },
        errorMode: "structured",
      });
    },
    enabled: isEnabled,
    refetchInterval: (query) =>
      isTerminalNotificationAuthQueryError(query.state.error) ? false : 30000,
    refetchOnWindowFocus: (query) =>
      !isTerminalNotificationAuthQueryError(query.state.error),
    refetchOnMount: (query) =>
      !isTerminalNotificationAuthQueryError(query.state.error),
    refetchOnReconnect: (query) =>
      !isTerminalNotificationAuthQueryError(query.state.error),
    refetchIntervalInBackground: !isCapacitor,
    retry: (failureCount: number, error: unknown) => {
      if (isTerminalNotificationAuthQueryError(error)) {
        return false;
      }
      if (shouldStopPollingRetry(error)) {
        return false;
      }

      return failureCount < 3;
    },
    retryDelay: (failureCount: number) => {
      return failureCount * 1000;
    },
  });

  const isTerminalAuthError = isTerminalNotificationAuthQueryError(error);
  const effectiveNotifications =
    isEnabled && !isTerminalAuthError ? notifications : undefined;
  const haveUnreadNotifications =
    (effectiveNotifications?.unread_count ?? 0) > 0;

  return { notifications: effectiveNotifications, haveUnreadNotifications };
}
