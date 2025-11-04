import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiTdhStats } from "@/generated/models/ApiTdhStats";
import { commonApiFetch } from "@/services/api/common-api";

interface UseIdentityTdhStatsOptions {
  readonly identity: string | null | undefined;
  readonly enabled?: boolean;
}

export interface IdentityTdhStats {
  readonly xtdhRate: number;
  readonly grantedXtdhPerDay: number;
  readonly grantedCollectionsCount: number;
  readonly grantedTokensCount: number;
  readonly totalReceivedXtdh: number;
  readonly totalGrantedXtdh: number;
  readonly xtdhMultiplier: number | null;
  readonly baseTdhRate: number | null;
}

async function fetchIdentityTdhStats(identity: string): Promise<IdentityTdhStats> {
  const encodedIdentity = encodeURIComponent(identity);
  const response = await commonApiFetch<ApiTdhStats>({
    endpoint: `tdh-stats/${encodedIdentity}`,
  });

  const xtdhRate = sanitizeNonNegativeNumber(response.xtdh_rate);
  const baseTdhRate =
    typeof response.tdh_rate === "number" &&
    Number.isFinite(response.tdh_rate) &&
    typeof response.xtdh_rate === "number" &&
    Number.isFinite(response.xtdh_rate)
      ? Math.max(response.tdh_rate - response.xtdh_rate, 0)
      : null;

  return {
    xtdhRate,
    grantedXtdhPerDay: sanitizeNonNegativeNumber(response.granted_xtdh_per_day),
    grantedCollectionsCount: sanitizeCount(response.granted_target_collections_count),
    grantedTokensCount: sanitizeCount(response.granted_target_tokens_count),
    totalReceivedXtdh: sanitizeNonNegativeNumber(response.received_xtdh),
    totalGrantedXtdh: sanitizeNonNegativeNumber(response.granted_xtdh),
    xtdhMultiplier:
      typeof response.xtdh_multiplier === "number" && Number.isFinite(response.xtdh_multiplier)
        ? Math.max(response.xtdh_multiplier, 0)
        : null,
    baseTdhRate,
  };
}

export function useIdentityTdhStats({
  identity,
  enabled = true,
}: Readonly<UseIdentityTdhStatsOptions>) {
  return useQuery<IdentityTdhStats, Error>({
    queryKey: [QueryKey.IDENTITY_TDH_STATS, identity?.toLowerCase()],
    queryFn: async () => {
      if (!identity) {
        throw new Error("Identity is required to fetch TDH stats");
      }

      return await fetchIdentityTdhStats(identity);
    },
    enabled: Boolean(identity) && enabled,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}

function sanitizeNonNegativeNumber(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return value;
}

function sanitizeCount(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return 0;
  }
  return Math.trunc(value);
}
