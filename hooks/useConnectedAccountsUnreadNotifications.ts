"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiNotificationsResponse } from "@/generated/models/ApiNotificationsResponse";
import type { ConnectedWalletAccount } from "@/services/auth/auth.utils";
import { commonApiFetch } from "@/services/api/common-api";
import useCapacitor from "./useCapacitor";

type ConnectedAccountUnreadCounts = Readonly<Record<string, number>>;

const POLL_INTERVAL_MS = 15000;

const toAddressKey = (address: string): string => address.toLowerCase();

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

  const notifications = await commonApiFetch<ApiNotificationsResponse>({
    endpoint: "notifications",
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
  const queryKey = [
    QueryKey.IDENTITY_NOTIFICATIONS,
    "connected-account-unread-counts",
    accounts.map((account) => toAddressKey(account.address)),
  ] as const;

  const { data } = useQuery<ConnectedAccountUnreadCounts>({
    queryKey,
    queryFn: async () => {
      if (accounts.length === 0) {
        return {};
      }

      const previousCounts =
        queryClient.getQueryData<ConnectedAccountUnreadCounts>(queryKey) ?? {};
      const results = await Promise.allSettled(
        accounts.map((account) => fetchUnreadCountForAccount(account))
      );
      const nextCounts: Record<string, number> = {};

      accounts.forEach((account, index) => {
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

        const previousCount = previousCounts[addressKey];
        if (typeof previousCount === "number") {
          nextCounts[addressKey] = previousCount;
        }
      });

      return nextCounts;
    },
    enabled: accounts.length > 0,
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    refetchIntervalInBackground: !isCapacitor,
    ...getDefaultQueryRetry(),
  });

  return data ?? {};
}
