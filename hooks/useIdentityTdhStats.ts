import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiTdhStats } from "@/generated/models/ApiTdhStats";
import { commonApiFetch } from "@/services/api/common-api";

interface UseIdentityTdhStatsOptions {
  readonly identity: string | null | undefined;
  readonly enabled?: boolean;
}

export interface IdentityTdhStats {
  readonly producedXtdhRate: number;
  readonly grantedXtdhPerDay: number;
  readonly grantedCollectionsCount: number;
  readonly grantedTokensCount: number;
  readonly totalReceivedXtdh: number;
  readonly receivedXtdhRate: number | null;
  readonly totalGrantedXtdh: number;
  readonly xtdhMultiplier: number | null;
  readonly tdhRate: number | null;
  readonly availableGrantRate: number | null;
}

async function fetchIdentityTdhStats(identity: string): Promise<IdentityTdhStats> {
  const encodedIdentity = encodeURIComponent(identity);
  const response = await commonApiFetch<ApiTdhStats>({
    endpoint: `tdh-stats/${encodedIdentity}`,
  });

  const producedXtdhRate = sanitizeNonNegativeNumber(response.produced_xtdh_rate);
  const tdhRate = sanitizeNullableNonNegativeNumber(
    (response.tdh_rate ?? Number.NaN),
  );

  return {
    producedXtdhRate,
    grantedXtdhPerDay: sanitizeNonNegativeNumber(response.granted_xtdh_rate),
    grantedCollectionsCount: sanitizeCount(response.granted_target_collections_count),
    grantedTokensCount: sanitizeCount(response.granted_target_tokens_count),
    totalReceivedXtdh: sanitizeNonNegativeNumber(response.received_xtdh),
    receivedXtdhRate: sanitizeNullableNonNegativeNumber(
      response.received_xtdh_rate ?? Number.NaN,
    ),
    totalGrantedXtdh: sanitizeNonNegativeNumber(response.granted_xtdh),
    xtdhMultiplier: sanitizeNullableNonNegativeNumber(response.xtdh_multiplier),
    tdhRate,
    availableGrantRate: sanitizeNullableNonNegativeNumber(response.available_grant_rate),
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
