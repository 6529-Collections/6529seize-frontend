"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import {
  getAuthAwareQueryRetry,
  isUnauthorizedQueryError,
} from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiNotificationsResponseV2 } from "@/generated/models/ApiNotificationsResponseV2";
import {
  isAuthJwtUsable,
  type ConnectedWalletAccount,
} from "@/services/auth/auth.utils";
import { commonApiFetch } from "@/services/api/common-api";
import useCapacitor from "./useCapacitor";

type ConnectedAccountUnreadCounts = Readonly<Record<string, number>>;

const POLL_INTERVAL_MS = 15000;

const toAddressKey = (address: string): string => address.toLowerCase();

const getTokenFingerprint = (jwt: string): string => {
  let hash = 0;
  for (let index = 0; index < jwt.length; index += 1) {
    hash = (hash * 31 + jwt.charCodeAt(index)) >>> 0;
  }
  return `${jwt.length}:${hash.toString(36)}`;
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

  const notifications = await commonApiFetch<ApiNotificationsResponseV2>({
    endpoint: "v2/notifications",
    params: { limit: "1" },
    headers: {
      Authorization: `Bearer ${account.jwt}`,
    },
  });
  return clampUnreadCount(notifications.unread_count);
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
          getTokenFingerprint(jwt)
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
        readonly jwt: string;
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
          unauthorizedFailures.push({
            addressKey,
            jwt: getTokenFingerprint(account.jwt),
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
        setUnauthorizedJwtFingerprintByAddress((previous) => {
          const next = { ...previous };
          for (const failure of unauthorizedFailures) {
            next[failure.addressKey] = failure.jwt;
          }
          return next;
        });
        throw firstUnauthorizedFailure.error;
      }

      return nextCounts;
    },
    enabled: pollableAccounts.length > 0,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
    ...getAuthAwareQueryRetry(),
  });

  return data ?? {};
}
