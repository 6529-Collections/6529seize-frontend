"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  isRateLimitQueryError,
  isUnauthorizedQueryError,
} from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiNotificationsResponseV2 } from "@/generated/models/ApiNotificationsResponseV2";
import {
  isAuthJwtUsable,
  type ConnectedWalletAccount,
} from "@/services/auth/auth.utils";
import { getAuthTokenFingerprint } from "@/services/auth/auth-token-fingerprint";
import { commonApiFetch } from "@/services/api/common-api";
import useCapacitor from "./useCapacitor";

type ConnectedAccountUnreadCounts = Readonly<Record<string, number>>;

const POLL_INTERVAL_MS = 15000;

const toAddressKey = (address: string): string => address.toLowerCase();

type UnauthorizedConnectedAccountFailure = {
  readonly addressKey: string;
  readonly jwtFingerprint: string;
};

type ConnectedAccountAuthPollingError = Error & {
  readonly status: 401;
  readonly unauthorizedFailures: readonly UnauthorizedConnectedAccountFailure[];
  readonly cause?: unknown;
};

const createConnectedAccountAuthPollingError = (
  unauthorizedFailures: readonly UnauthorizedConnectedAccountFailure[],
  cause?: unknown
): ConnectedAccountAuthPollingError => {
  const error = new Error(
    "Connected account unread notification polling requires valid auth"
  ) as ConnectedAccountAuthPollingError;
  Object.defineProperty(error, "status", {
    value: 401,
    enumerable: true,
  });
  Object.defineProperty(error, "unauthorizedFailures", {
    value: unauthorizedFailures,
    enumerable: true,
  });
  if (cause !== undefined) {
    Object.defineProperty(error, "cause", {
      value: cause,
      enumerable: false,
    });
  }
  return error;
};

const getUnauthorizedFailuresFromError = (
  error: unknown
): readonly UnauthorizedConnectedAccountFailure[] => {
  if (!isUnauthorizedQueryError(error)) {
    return [];
  }
  if (typeof error !== "object" || error === null) {
    return [];
  }

  const failures = (error as { readonly unauthorizedFailures?: unknown })
    .unauthorizedFailures;
  return Array.isArray(failures)
    ? failures.filter(
        (failure): failure is UnauthorizedConnectedAccountFailure =>
          typeof failure === "object" &&
          failure !== null &&
          typeof (failure as UnauthorizedConnectedAccountFailure).addressKey ===
            "string" &&
          typeof (failure as UnauthorizedConnectedAccountFailure)
            .jwtFingerprint === "string"
      )
    : [];
};

const clampUnreadCount = (count: number | null | undefined): number => {
  if (typeof count !== "number" || Number.isNaN(count) || count <= 0) {
    return 0;
  }
  return Math.floor(count);
};

const fetchUnreadCountForAccount = async (
  account: ConnectedWalletAccount
): Promise<number> => {
  if (!account.jwt) {
    return 0;
  }
  const addressKey = toAddressKey(account.address);
  const jwtFingerprint = getAuthTokenFingerprint(account.jwt);

  if (!isAuthJwtUsable(account.jwt)) {
    throw createConnectedAccountAuthPollingError([
      { addressKey, jwtFingerprint },
    ]);
  }

  try {
    const notifications = await commonApiFetch<ApiNotificationsResponseV2>({
      endpoint: "v2/notifications",
      params: { limit: "1" },
      headers: {
        Authorization: `Bearer ${account.jwt}`,
      },
      errorMode: "structured",
    });
    return clampUnreadCount(notifications.unread_count);
  } catch (error) {
    if (isUnauthorizedQueryError(error)) {
      throw createConnectedAccountAuthPollingError(
        [{ addressKey, jwtFingerprint }],
        error
      );
    }
    throw error;
  }
};

export function useConnectedAccountsUnreadNotifications(
  accounts: readonly ConnectedWalletAccount[]
): ConnectedAccountUnreadCounts {
  const { isCapacitor } = useCapacitor();
  const queryClient = useQueryClient();
  const [
    unauthorizedJwtFingerprintByAddress,
    setUnauthorizedJwtFingerprintByAddress,
  ] = useState<
    Readonly<Record<string, string>>
  >({});
  const pollableAccounts = useMemo(
    () =>
      accounts.filter((account) => {
        const jwt = account.jwt;
        if (typeof jwt !== "string" || !isAuthJwtUsable(jwt)) {
          return false;
        }

        return (
          unauthorizedJwtFingerprintByAddress[toAddressKey(account.address)] !==
          getAuthTokenFingerprint(jwt)
        );
      }),
    [accounts, unauthorizedJwtFingerprintByAddress]
  );
  const queryKey = [
    QueryKey.CONNECTED_ACCOUNT_UNREAD_NOTIFICATIONS,
    "connected-account-unread-counts",
    "v2",
    pollableAccounts.map((account) => toAddressKey(account.address)),
  ] as const;

  const { data } = useQuery<ConnectedAccountUnreadCounts>({
    queryKey,
    queryFn: async () => {
      if (pollableAccounts.length === 0) {
        return {};
      }

      const previousCounts =
        queryClient.getQueryData<ConnectedAccountUnreadCounts>(queryKey) ?? {};
      const results = await Promise.allSettled(
        pollableAccounts.map((account) => fetchUnreadCountForAccount(account))
      );
      const nextCounts: Record<string, number> = {};
      const unauthorizedFailures: {
        readonly addressKey: string;
        readonly jwtFingerprint: string;
        readonly error: unknown;
      }[] = [];

      pollableAccounts.forEach((account, index) => {
        const addressKey = toAddressKey(account.address);
        const result = results[index];

        if (!result) {
          const previousCount = previousCounts[addressKey];
          if (typeof previousCount === "number") {
            nextCounts[addressKey] = previousCount;
          }
          return;
        }

        if (result.status === "fulfilled") {
          nextCounts[addressKey] = result.value;
          return;
        }

        if (account.jwt && isUnauthorizedQueryError(result.reason)) {
          const nestedUnauthorizedFailures =
            getUnauthorizedFailuresFromError(result.reason);
          if (nestedUnauthorizedFailures.length > 0) {
            nestedUnauthorizedFailures.forEach((failure) => {
              unauthorizedFailures.push({
                ...failure,
                error: result.reason,
              });
            });
            return;
          }

          unauthorizedFailures.push({
            addressKey,
            jwtFingerprint: getAuthTokenFingerprint(account.jwt),
            error: result.reason,
          });
          return;
        }

        const previousCount = previousCounts[addressKey];
        if (typeof previousCount === "number") {
          nextCounts[addressKey] = previousCount;
        }
      });

      const firstUnauthorizedFailure = unauthorizedFailures[0];
      if (firstUnauthorizedFailure) {
        throw createConnectedAccountAuthPollingError(
          unauthorizedFailures.map(({ addressKey, jwtFingerprint }) => ({
            addressKey,
            jwtFingerprint,
          })),
          firstUnauthorizedFailure.error
        );
      }

      return nextCounts;
    },
    enabled: pollableAccounts.length > 0,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
    retry: (failureCount: number, error: unknown) => {
      const unauthorizedFailures = getUnauthorizedFailuresFromError(error);
      if (unauthorizedFailures.length > 0) {
        setUnauthorizedJwtFingerprintByAddress((previous) => {
          let didChange = false;
          const next = { ...previous };
          for (const failure of unauthorizedFailures) {
            if (next[failure.addressKey] !== failure.jwtFingerprint) {
              next[failure.addressKey] = failure.jwtFingerprint;
              didChange = true;
            }
          }
          return didChange ? next : previous;
        });
        return false;
      }
      if (isUnauthorizedQueryError(error)) {
        return false;
      }
      if (isRateLimitQueryError(error)) {
        return false;
      }

      return failureCount < 3;
    },
    retryDelay: (failureCount: number) => {
      return failureCount * 1000;
    },
  });

  return data ?? {};
}
