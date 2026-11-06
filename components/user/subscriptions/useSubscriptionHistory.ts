import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { RedeemedSubscription } from "@/generated/models/RedeemedSubscription";
import type { SubscriptionLog } from "@/generated/models/SubscriptionLog";
import type { SubscriptionTopUp } from "@/generated/models/SubscriptionTopUp";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";

type HistoryTab = "redeemed" | "logs" | "topups";
const ENDPOINTS = { redeemed: "redeemed", logs: "logs", topups: "top-up" };

function emptyPage<T>(page: number): Page<T> {
  return { count: 0, page, next: false, data: [] };
}

function useHistoryPage<T>(
  profileKey: string | undefined,
  tab: HistoryTab,
  page: number,
  enabled: boolean
) {
  return useQuery({
    queryKey: [QueryKey.SUBSCRIPTION_HISTORY, profileKey, tab, page],
    queryFn: ({ signal }) =>
      commonApiFetch<Page<T>>({
        endpoint: `subscriptions/consolidation/${ENDPOINTS[tab]}/${encodeURIComponent(profileKey ?? "")}?page=${page}&page_size=10`,
        signal,
      }),
    enabled: !!profileKey && enabled,
    retry: false,
    staleTime: 30_000,
  });
}

export function useSubscriptionHistory(profileKey: string | undefined) {
  const queryClient = useQueryClient();
  const initialView = {
    profileKey,
    selectedIndex: 0,
    pages: { redeemed: 1, logs: 1, topups: 1 },
  };
  const [view, setView] = useState(initialView);
  // A different profile starts at Redeemed page 1 without exposing old rows.
  const currentView = view.profileKey === profileKey ? view : initialView;
  const { selectedIndex, pages } = currentView;
  const redeemed = useHistoryPage<RedeemedSubscription>(
    profileKey,
    "redeemed",
    pages.redeemed,
    selectedIndex === 0
  );
  const logs = useHistoryPage<SubscriptionLog>(
    profileKey,
    "logs",
    pages.logs,
    selectedIndex === 1
  );
  const topups = useHistoryPage<SubscriptionTopUp>(
    profileKey,
    "topups",
    pages.topups,
    selectedIndex === 2
  );

  const refresh = async () => {
    if (!profileKey) return;
    const queryKey = [QueryKey.SUBSCRIPTION_HISTORY, profileKey];
    // Do not let a pre-transaction response replace the invalidated cache.
    await queryClient.cancelQueries({ queryKey });
    await queryClient.invalidateQueries({ queryKey });
  };

  return {
    selectedIndex,
    setSelectedIndex: (index: number) =>
      setView((previous) => ({
        ...(previous.profileKey === profileKey ? previous : initialView),
        selectedIndex: index,
      })),
    setPage: (tab: HistoryTab, page: number) =>
      setView((previous) => {
        const current =
          previous.profileKey === profileKey ? previous : initialView;
        return { ...current, pages: { ...current.pages, [tab]: page } };
      }),
    redeemed: redeemed.data ?? emptyPage<RedeemedSubscription>(pages.redeemed),
    logs: logs.data ?? emptyPage<SubscriptionLog>(pages.logs),
    topups: topups.data ?? emptyPage<SubscriptionTopUp>(pages.topups),
    redeemedLoading: redeemed.isPending || redeemed.isFetching,
    logsLoading: logs.isPending || logs.isFetching,
    topupsLoading: topups.isPending || topups.isFetching,
    isError: [redeemed, logs, topups][selectedIndex]?.isError ?? false,
    refresh,
  };
}
