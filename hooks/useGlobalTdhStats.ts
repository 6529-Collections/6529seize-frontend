import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiXTdhGlobalStats } from "@/generated/models/ApiXTdhGlobalStats";
import { commonApiFetch } from "@/services/api/common-api";

export interface GlobalTdhStats {

  readonly xtdh: number;
  readonly xtdhRate: number;
  readonly multiplier: number | null;
  readonly outgoingRate: number;
  readonly outgoingTotal: number;
  readonly outgoingCollectionsCount: number;
  readonly outgoingTokensCount: number;
}

async function fetchGlobalTdhStats(): Promise<GlobalTdhStats> {
  const response = await commonApiFetch<ApiXTdhGlobalStats>({
    endpoint: "xtdh/stats",
  });

  return {

    xtdh: sanitizeNonNegativeNumber(response.xtdh),
    xtdhRate: sanitizeNonNegativeNumber(response.xtdh_rate),
    multiplier: sanitizeNullableNonNegativeNumber(response.multiplier),
    outgoingRate: sanitizeNonNegativeNumber(response.outgoing_rate),
    outgoingTotal: sanitizeNonNegativeNumber(response.outgoing_total),
    outgoingCollectionsCount: sanitizeCount(
      response.outgoing_collections_count
    ),
    outgoingTokensCount: sanitizeCount(response.outgoing_tokens_count),
  };
}

export function useGlobalTdhStats() {
  return useQuery<GlobalTdhStats, Error>({
    queryKey: [QueryKey.GLOBAL_TDH_STATS],
    queryFn: fetchGlobalTdhStats,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

function sanitizeNullableNonNegativeNumber(value: unknown): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return null;
  }
  return Math.max(value, 0);
}

function sanitizeNonNegativeNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

function sanitizeCount(value: unknown): number {
  return Math.trunc(sanitizeNonNegativeNumber(value));
}
