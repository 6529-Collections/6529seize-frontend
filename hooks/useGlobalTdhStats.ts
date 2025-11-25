import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiTdhGlobalStats } from "@/generated/models/ApiTdhGlobalStats";
import { commonApiFetch } from "@/services/api/common-api";

export interface GlobalTdhStats {
  readonly tdh: number;
  readonly tdhRate: number | null;
  readonly xtdh: number;
  readonly xtdhRate: number;
  readonly xtdhMultiplier: number | null;
  readonly grantedXtdhRate: number;
  readonly grantedXtdh: number;
  readonly grantedCollectionsCount: number;
  readonly grantedTokensCount: number;
}

async function fetchGlobalTdhStats(): Promise<GlobalTdhStats> {
  const response = await commonApiFetch<ApiTdhGlobalStats>({
    endpoint: "tdh-stats",
  });

  return {
    tdh: sanitizeNonNegativeNumber(response.tdh),
    tdhRate: sanitizeNullableNonNegativeNumber(response.tdh_rate),
    xtdh: sanitizeNonNegativeNumber(response.xtdh),
    xtdhRate: sanitizeNonNegativeNumber(response.xtdh_rate),
    xtdhMultiplier: sanitizeNullableNonNegativeNumber(response.xtdh_multiplier),
    grantedXtdhRate: sanitizeNonNegativeNumber(response.granted_xtdh_rate),
    grantedXtdh: sanitizeNonNegativeNumber(response.granted_xtdh),
    grantedCollectionsCount: sanitizeCount(
      response.granted_target_collections_count
    ),
    grantedTokensCount: sanitizeCount(response.granted_target_tokens_count),
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
