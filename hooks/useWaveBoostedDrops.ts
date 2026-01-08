"use client";

import { useQuery } from "@tanstack/react-query";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { commonApiFetch } from "@/services/api/common-api";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { Page } from "@/helpers/Types";

interface UseWaveBoostedDropsProps {
  readonly waveId: string;
  readonly limit?: number;
}

const DEFAULT_LIMIT = 10;
const STALE_TIME = 60000; // 1 minute
const REFETCH_INTERVAL = 30000; // 30 seconds
const TRENDING_WINDOW_MS = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

export function useWaveBoostedDrops({
  waveId,
  limit = DEFAULT_LIMIT,
}: UseWaveBoostedDropsProps) {
  return useQuery<ApiDrop[]>({
    queryKey: [QueryKey.BOOSTED_DROPS, { waveId, limit }],
    queryFn: async () => {
      const countOnlyBoostsAfter = Date.now() - TRENDING_WINDOW_MS;
      const response = await commonApiFetch<Page<ApiDrop>>({
        endpoint: "boosted-drops",
        params: {
          wave_id: waveId,
          sort: "boosts",
          sort_direction: "DESC",
          page_size: limit.toString(),
          count_only_boosts_after: countOnlyBoostsAfter.toString(),
        },
      });
      return response.data;
    },
    enabled: !!waveId,
    staleTime: STALE_TIME,
    refetchInterval: REFETCH_INTERVAL,
    retry: 2,
    retryDelay: (attemptIndex) => attemptIndex * 1000,
  });
}
