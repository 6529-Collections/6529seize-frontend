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
import { useNotificationRealtimeState } from "@/services/notifications/notification-realtime-state";

interface UseUnreadNotificationsOptions {
  readonly enabled?: boolean | undefined;
}

const FALLBACK_POLL_INTERVAL_MS = 30_000;
const REALTIME_RECONCILIATION_INTERVAL_MS = 5 * 60_000;

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
  const notificationRealtimeState = useNotificationRealtimeState();
  const authJwt = getAuthJwt();
  const hasUsableAuthJwt = isAuthJwtUsable(authJwt);
  const authFingerprint = getAuthTokenFingerprint(authJwt);
  const isEnabled = !!handle && options.enabled !== false && hasUsableAuthJwt;
  const isRealtimeCovered =
    notificationRealtimeState.connected &&
    notificationRealtimeState.syncedProfileIds.length > 0;

  const notificationQuery = useQuery<ApiNotificationsResponseV2>({
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
      const requestAuthJwt = getAuthJwt();
      if (!requestAuthJwt || !isAuthJwtUsable(requestAuthJwt)) {
        throw createMissingAuthPollingError();
      }

      return await commonApiFetch<ApiNotificationsResponseV2>({
        endpoint: `v2/notifications`,
        headers: {
          Authorization: `Bearer ${requestAuthJwt}`,
        },
        params: {
          limit: "1",
        },
        errorMode: "structured",
      });
    },
    enabled: isEnabled,
    refetchInterval: (query) => {
      if (isTerminalNotificationAuthQueryError(query.state.error)) {
        return false;
      }
      return isRealtimeCovered
        ? REALTIME_RECONCILIATION_INTERVAL_MS
        : FALLBACK_POLL_INTERVAL_MS;
    },
    refetchOnWindowFocus: (query) =>
      !isTerminalNotificationAuthQueryError(query.state.error),
    refetchOnMount: (query) =>
      !isTerminalNotificationAuthQueryError(query.state.error),
    refetchOnReconnect: (query) =>
      !isTerminalNotificationAuthQueryError(query.state.error),
    refetchIntervalInBackground: !isCapacitor,
    retry: (failureCount: number, retryError: unknown) => {
      if (isTerminalNotificationAuthQueryError(retryError)) {
        return false;
      }
      if (shouldStopPollingRetry(retryError)) {
        return false;
      }

      return failureCount < 3;
    },
    retryDelay: (failureCount: number) => {
      return failureCount * 1000;
    },
  });

  const isTerminalAuthError = isTerminalNotificationAuthQueryError(
    notificationQuery.error
  );
  const effectiveNotifications =
    isEnabled && !isTerminalAuthError ? notificationQuery.data : undefined;
  const haveUnreadNotifications =
    (effectiveNotifications?.unread_count ?? 0) > 0;

  return { notifications: effectiveNotifications, haveUnreadNotifications };
}
