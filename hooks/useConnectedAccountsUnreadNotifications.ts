"use client";

import { useQuery } from "@tanstack/react-query";
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

  try {
    const notifications = await commonApiFetch<ApiNotificationsResponse>({
      endpoint: "notifications",
      params: { limit: "1" },
      headers: {
        Authorization: `Bearer ${account.jwt}`,
      },
    });
    return clampUnreadCount(notifications.unread_count);
  } catch {
    return 0;
  }
};

export function useConnectedAccountsUnreadNotifications(
  accounts: readonly ConnectedWalletAccount[]
): ConnectedAccountUnreadCounts {
  const { isCapacitor } = useCapacitor();

  const { data } = useQuery<ConnectedAccountUnreadCounts>({
    queryKey: [
      QueryKey.IDENTITY_NOTIFICATIONS,
      "connected-account-unread-counts",
      accounts.map((account) => toAddressKey(account.address)),
    ],
    queryFn: async () => {
      if (accounts.length === 0) {
        return {};
      }

      const unreadPairs = await Promise.all(
        accounts.map(async (account) => [
          toAddressKey(account.address),
          await fetchUnreadCountForAccount(account),
        ])
      );

      return Object.fromEntries(unreadPairs);
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
