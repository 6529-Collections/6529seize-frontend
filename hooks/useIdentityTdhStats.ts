import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { ApiTdhStats } from "@/generated/models/ApiTdhStats";
import { commonApiFetch } from "@/services/api/common-api";

interface UseIdentityTdhStatsOptions {
  readonly identity: string | null | undefined;
  readonly enabled?: boolean;
}

async function fetchIdentityTdhStats(identity: string): Promise<ApiTdhStats> {
  const encodedIdentity = encodeURIComponent(identity);
  return await commonApiFetch<ApiTdhStats>({
    endpoint: `tdh-stats/${encodedIdentity}`,
  });
}

export function useIdentityTdhStats({
  identity,
  enabled = true,
}: Readonly<UseIdentityTdhStatsOptions>) {
  return useQuery<ApiTdhStats, Error>({
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
