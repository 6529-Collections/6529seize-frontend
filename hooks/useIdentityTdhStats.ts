import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiTdhStats } from "@/generated/models/ApiTdhStats";
import { commonApiFetch } from "@/services/api/common-api";

interface UseIdentityTdhStatsOptions {
  readonly identity: string | null | undefined;
  readonly enabled?: boolean;
  readonly staleTime?: number;
}

export interface IdentityTdhStats {
  readonly producedXtdhRate: number;
  readonly grantedCollectionsCount: number;
  readonly grantedTokensCount: number;
  readonly totalReceivedXtdh: number;
  readonly receivedXtdhRate: number;
  readonly totalGrantedXtdh: number;
  readonly xtdhMultiplier: number;
  readonly availableGrantRate: number;
}

async function fetchIdentityTdhStats(identity: string): Promise<IdentityTdhStats> {
  const encodedIdentity = encodeURIComponent(identity);
  const response = await commonApiFetch<ApiTdhStats>({
    endpoint: `tdh-stats/${encodedIdentity}`,
  });




  return {
    producedXtdhRate: response.produced_xtdh_rate,
    grantedCollectionsCount: response.granted_target_collections_count,
    grantedTokensCount: response.granted_target_tokens_count,
    totalReceivedXtdh: response.received_xtdh,
    receivedXtdhRate: response.received_xtdh_rate,
    totalGrantedXtdh: response.granted_xtdh,
    xtdhMultiplier: response.xtdh_multiplier,
    availableGrantRate: response.available_grant_rate,
  };
}

export function useIdentityTdhStats({
  identity,
  enabled = true,
  staleTime = 60_000,
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
    staleTime,
    gcTime: 300_000,
    retry: 3,
    retryDelay: (attempt) => Math.min(1_000 * 2 ** attempt, 30_000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}



