"use client";

import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { Page } from "@/helpers/Types";
import { commonApiFetch } from "@/services/api/common-api";
import { TIME_WINDOW_MS, TimeWindow } from "@/types/boosted-drops.types";

interface UseBoostedDropsProps {
  readonly limit?: number;
  readonly timeWindow?: TimeWindow;
}

const DEFAULT_LIMIT = 10;
const STALE_TIME = 60000; // 1 minute
const REFETCH_INTERVAL = 30000; // 30 seconds

export function useBoostedDrops({
  limit = DEFAULT_LIMIT,
  timeWindow = TimeWindow.DAY,
}: UseBoostedDropsProps = {}) {
  return useQuery<ApiDrop[]>({
    queryKey: [QueryKey.BOOSTED_DROPS, { global: true, limit, timeWindow }],
    queryFn: async () => {
      const countOnlyBoostsAfter = Date.now() - TIME_WINDOW_MS[timeWindow];
      const response = await commonApiFetch<Page<ApiDrop>>({
        endpoint: "boosted-drops",
        params: {
          sort: "boosts",
          sort_direction: "DESC",
          page_size: limit.toString(),
          count_only_boosts_after: countOnlyBoostsAfter.toString(),
        },
      });
      return response.data;
    },
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    retry: 2,
    retryDelay: (attemptIndex) => attemptIndex * 1000,
  });
}
