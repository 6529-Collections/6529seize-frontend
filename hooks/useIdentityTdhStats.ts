import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiXTdhStats } from "@/generated/models/ApiXTdhStats";
import { commonApiFetch } from "@/services/api/common-api";

interface UseIdentityTdhStatsOptions {
  readonly identity: string | null | undefined;
  readonly enabled?: boolean;
  readonly staleTime?: number;
}

export interface IdentityTdhStats {
  readonly generationRate: number;
  readonly outgoingRate: number;
  readonly outgoingTotal: number;
  readonly outgoingCollectionsCount: number;
  readonly outgoingTokensCount: number;
  readonly incomingTotal: number;
  readonly incomingRate: number;
  readonly multiplier: number;
  readonly unusedRate: number;
}

async function fetchIdentityTdhStats(identity: string): Promise<IdentityTdhStats> {
  const encodedIdentity = encodeURIComponent(identity);
  const response = await commonApiFetch<ApiXTdhStats>({
    endpoint: `xtdh/stats/${encodedIdentity}`,
  });

  console.log(response)




  return {
    generationRate: response.generation_rate,
    outgoingRate: response.outgoing_rate,
    outgoingCollectionsCount: response.outgoing_collections_count,
    outgoingTokensCount: response.outgoing_tokens_count,
    incomingTotal: response.incoming_total,
    incomingRate: response.incoming_rate,
    outgoingTotal: response.outgoing_total,
    multiplier: response.multiplier,
    unusedRate: response.unused_rate,
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



