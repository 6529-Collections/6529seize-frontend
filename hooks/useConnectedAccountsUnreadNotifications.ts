"use client";

import { isMultiCompetitionEnabled } from "@/helpers/competition.helpers";
import { useQueries, type UseQueryResult } from "@tanstack/react-query";
import { useCallback, useMemo, useState } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  getQueryErrorStatus,
  isTerminalNotificationAuthQueryError,
  shouldRetryQuery,
} from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiNotificationsResponseV2 } from "@/generated/models/ApiNotificationsResponseV2";
import {
  isAuthJwtUsable,
  type ConnectedWalletAccount,
} from "@/services/auth/auth.utils";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";
import { commonApiFetch } from "@/services/api/common-api";
import { useMobileBatterySavings } from "./useMobileAppActivity";
import { useNotificationRealtimeState } from "@/services/notifications/notification-realtime-state";
import {
  getUnreadNotificationsRefetchInterval,
  isProfileCoveredByNotificationSocket,
} from "@/services/notifications/unread-notifications-polling";

type ConnectedAccountUnreadCounts = Readonly<Record<string, number>>;

const toAddressKey = (address: string): string => address.toLowerCase();

type ConnectedAccountTerminalAuthPollingError = Error & {
  readonly status: number;
  readonly terminalNotificationAuth: true;
  readonly jwtFingerprint: string;
  readonly cause?: unknown;
};

const createConnectedAccountTerminalAuthPollingError = (
  jwtFingerprint: string,
  status: number,
  cause?: unknown
): ConnectedAccountTerminalAuthPollingError => {
  const error = new Error(
    "Connected account unread notification polling requires valid auth"
  ) as ConnectedAccountTerminalAuthPollingError;
  Object.defineProperty(error, "status", {
    value: status,
    enumerable: true,
  });
  Object.defineProperty(error, "terminalNotificationAuth", {
    value: true,
    enumerable: true,
  });
  // Keep token fingerprints away from generic error serializers.
  Object.defineProperty(error, "jwtFingerprint", {
    value: jwtFingerprint,
    enumerable: false,
  });
  if (cause !== undefined) {
    Object.defineProperty(error, "cause", {
      value: cause,
      enumerable: false,
    });
  }
  return error;
};

const getTerminalJwtFingerprint = (error: unknown): string | null => {
  if (
    !isTerminalNotificationAuthQueryError(error) ||
    typeof error !== "object" ||
    error === null
  ) {
    return null;
  }
  const jwtFingerprint = (error as { readonly jwtFingerprint?: unknown })
    .jwtFingerprint;
  return typeof jwtFingerprint === "string" ? jwtFingerprint : null;
};

const clampUnreadCount = (count: number | null | undefined): number => {
  if (typeof count !== "number" || Number.isNaN(count) || count <= 0) {
    return 0;
  }
  return Math.floor(count);
};

const fetchUnreadCountForAccount = async (
  jwt: string,
  signal: AbortSignal
): Promise<number> => {
  const jwtFingerprint = getAuthTokenFingerprint(jwt);
  if (!isAuthJwtUsable(jwt)) {
    throw createConnectedAccountTerminalAuthPollingError(jwtFingerprint, 401);
  }

  try {
    const notifications = await commonApiFetch<ApiNotificationsResponseV2>({
      endpoint: "v2/notifications",
      params: {
        limit: "1",
        ...(isMultiCompetitionEnabled()
          ? { include_competitions: "true" }
          : {}),
      },
      headers: {
        Authorization: `Bearer ${jwt}`,
      },
      cache: "no-store",
      errorMode: "structured",
      signal,
    });
    return clampUnreadCount(notifications.unread_count);
  } catch (error) {
    if (isTerminalNotificationAuthQueryError(error)) {
      throw createConnectedAccountTerminalAuthPollingError(
        jwtFingerprint,
        getQueryErrorStatus(error) ?? 401,
        error
      );
    }
    throw error;
  }
};

/**
 * One query per connected account, so each account keeps its own cache entry,
 * request, error and poll cadence: an account the socket does not cover, or a
 * change to the account list, no longer refetches every other account.
 */
export function useConnectedAccountsUnreadNotifications(
  accounts: readonly ConnectedWalletAccount[]
): ConnectedAccountUnreadCounts {
  const isMobileEnvironment = useMobileBatterySavings();
  const notificationRealtimeState = useNotificationRealtimeState();
  const [terminalJwtFingerprintByAccount, setTerminalJwtFingerprintByAccount] =
    useState<Readonly<Record<string, string>>>({});
  const pollableAccounts = useMemo(
    () =>
      accounts.flatMap((account) => {
        const jwt = account.jwt;
        if (typeof jwt !== "string" || !isAuthJwtUsable(jwt)) {
          return [];
        }

        const addressKey = toAddressKey(account.address);
        return terminalJwtFingerprintByAccount[addressKey] ===
          getAuthTokenFingerprint(jwt)
          ? []
          : [{ addressKey, jwt, profileId: account.profileId }];
      }),
    [accounts, terminalJwtFingerprintByAccount]
  );
  const responseVersion = isMultiCompetitionEnabled()
    ? "v2-native-competitions"
    : "v2";

  const blockAccountUntilNewToken = useCallback(
    (addressKey: string, jwtFingerprint: string) => {
      setTerminalJwtFingerprintByAccount((previous) =>
        previous[addressKey] === jwtFingerprint
          ? previous
          : { ...previous, [addressKey]: jwtFingerprint }
      );
    },
    []
  );

  const combineUnreadCounts = useCallback(
    (
      results: readonly UseQueryResult<number>[]
    ): ConnectedAccountUnreadCounts => {
      const counts: Record<string, number> = {};
      results.forEach((result, index) => {
        const addressKey = pollableAccounts[index]?.addressKey;
        if (addressKey !== undefined && typeof result.data === "number") {
          counts[addressKey] = result.data;
        }
      });
      return counts;
    },
    [pollableAccounts]
  );

  return useQueries({
    queries: pollableAccounts.map(({ addressKey, jwt, profileId }) => {
      const isRealtimeCovered = isProfileCoveredByNotificationSocket(
        notificationRealtimeState,
        profileId
      );
      return {
        queryKey: [
          QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS,
          { account: addressKey, version: responseVersion },
        ],
        queryFn: ({ signal }: { readonly signal: AbortSignal }) =>
          fetchUnreadCountForAccount(jwt, signal),
        refetchInterval: (query: {
          readonly state: { readonly error: unknown };
        }) => getUnreadNotificationsRefetchInterval(query, isRealtimeCovered),
        refetchOnWindowFocus: true,
        refetchOnMount: true,
        refetchOnReconnect: true,
        refetchIntervalInBackground: !isMobileEnvironment,
        retry: (failureCount: number, error: unknown) => {
          const terminalJwtFingerprint = getTerminalJwtFingerprint(error);
          if (terminalJwtFingerprint !== null) {
            blockAccountUntilNewToken(addressKey, terminalJwtFingerprint);
            return false;
          }
          return (
            !isTerminalNotificationAuthQueryError(error) &&
            shouldRetryQuery(failureCount, error)
          );
        },
        retryDelay: (failureCount: number) => failureCount * 1000,
      };
    }),
    combine: combineUnreadCounts,
  });
}
