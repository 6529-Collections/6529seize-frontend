import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiMintMetrics } from "@/generated/models/ApiMintMetrics";
import type { ApiMintMetricsPage } from "@/generated/models/ApiMintMetricsPage";
import { commonApiFetch } from "@/services/api/common-api";

interface MintMetricsData {
  readonly items: ApiMintMetrics[];
  readonly totalCount: number;
}

async function fetchMintMetrics(pageSize: number): Promise<MintMetricsData> {
  const response = await commonApiFetch<ApiMintMetricsPage>({
    endpoint: "community-metrics/mints",
    params: {
      page_size: String(pageSize),
      sort: "mint_time",
      sort_direction: "DESC",
    },
  });

  return {
    items: response.data,
    totalCount: response.count,
  };
}

export function useMintMetrics(pageSize = 10) {
  return useQuery<MintMetricsData, Error>({
    queryKey: [QueryKey.MINT_METRICS, { pageSize }],
    queryFn: () => fetchMintMetrics(pageSize),
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 30_000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
