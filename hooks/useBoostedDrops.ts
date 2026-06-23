"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { TimeWindow, TIME_WINDOW_MS } from "@/types/boosted-drops.types";
import { fetchGlobalBoostedDropsV2 } from "@/services/api/wave-drops-v2-api";

interface UseBoostedDropsProps {
  readonly limit?: number;
  readonly timeWindow?: TimeWindow;
}

const DEFAULT_LIMIT = 10;
const MIN_BOOSTS = 3;
const STALE_TIME = 60000; // 1 minute
const REFETCH_INTERVAL = 30000; // 30 seconds

export function useBoostedDrops({
  limit = DEFAULT_LIMIT,
  timeWindow = TimeWindow.DAY,
}: UseBoostedDropsProps = {}) {
  return useQuery<ApiDrop[]>({
    queryKey: [
      QueryKey.BOOSTED_DROPS,
      { global: true, limit, minBoosts: MIN_BOOSTS, timeWindow },
    ],
    queryFn: async ({ signal }) => {
      const countOnlyBoostsAfter = Date.now() - TIME_WINDOW_MS[timeWindow];
      return fetchGlobalBoostedDropsV2({
        limit,
        countOnlyBoostsAfter,
        minBoosts: MIN_BOOSTS,
        signal,
      });
    },
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    retry: 2,
    retryDelay: (attemptIndex) => attemptIndex * 1000,
  });
}
