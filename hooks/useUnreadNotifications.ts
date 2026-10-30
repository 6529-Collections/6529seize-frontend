"use client";

import { useQuery } from "@tanstack/react-query";
import type { ApiNotificationsResponseV2 } from "@/generated/models/ApiNotificationsResponseV2";
import { commonApiFetch } from "@/services/api/common-api";
import { useMobileBatterySavings } from "./useMobileAppActivity";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  isTerminalNotificationAuthQueryError,
  shouldRetryQuery,
} from "@/components/react-query-wrapper/utils/query-utils";
import { getAuthJwt, isAuthJwtUsable } from "@/services/auth/auth.utils";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";
import { useNotificationRealtimeState } from "@/services/notifications/notification-realtime-state";
import {
  getUnreadNotificationsRefetchInterval,
  isProfileCoveredByNotificationSocket,
} from "@/services/notifications/unread-notifications-polling";

interface UseUnreadNotificationsOptions {
  readonly enabled?: boolean | undefined;
  readonly profileId?: string | null | undefined;
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
  const isMobileEnvironment = useMobileBatterySavings();
  const notificationRealtimeState = useNotificationRealtimeState();
  const authJwt = getAuthJwt();
  const hasUsableAuthJwt = isAuthJwtUsable(authJwt);
  const authFingerprint = getAuthTokenFingerprint(authJwt);
  const isEnabled = !!handle && options.enabled !== false && hasUsableAuthJwt;
  const isRealtimeCovered = isProfileCoveredByNotificationSocket(
    notificationRealtimeState,
    options.profileId
  );

  const notificationQuery = useQuery<ApiNotificationsResponseV2>({
    // The token decides whose count this is, so every consumer of the active
    // account shares one cache entry even while its profile handle catches up.
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      {
        auth: authFingerprint,
        limit: "1",
        version: "v2",
        includeCompetitions: true,
      },
    ],
    queryFn: async ({ signal }) => {
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
          include_competitions: "true",
        },
        cache: "no-store",
        errorMode: "structured",
        signal,
      });
    },
    enabled: isEnabled,
    refetchInterval: (query) =>
      getUnreadNotificationsRefetchInterval(query, isRealtimeCovered),
    refetchOnWindowFocus: (query) =>
      !isTerminalNotificationAuthQueryError(query.state.error),
    refetchOnMount: (query) =>
      !isTerminalNotificationAuthQueryError(query.state.error),
    refetchOnReconnect: (query) =>
      !isTerminalNotificationAuthQueryError(query.state.error),
    refetchIntervalInBackground: !isMobileEnvironment,
    retry: (failureCount: number, retryError: unknown) =>
      !isTerminalNotificationAuthQueryError(retryError) &&
      shouldRetryQuery(failureCount, retryError),
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
