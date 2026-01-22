import { useQuery } from "@tanstack/react-query";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiCommunityMetricsSeries } from "@/generated/models/ApiCommunityMetricsSeries";
import { commonApiFetch } from "@/services/api/common-api";

const DAYS_31_MS = 31 * 24 * 60 * 60 * 1000;

interface CommunityMetricsSeriesData {
  readonly stepsStartTimes: number[];
  readonly dropsCreated: number[];
  readonly distinctDroppers: number[];
  readonly mainStageSubmissions: number[];
  readonly mainStageDistinctVoters: number[];
  readonly mainStageVotes: number[];
  readonly networkTdh: number[];
  readonly tdhOnMainStageSubmissions: number[];
  readonly consolidationsFormed: number[];
  readonly xtdhGranted: number[];
  readonly activeIdentities: number[];
  readonly profileCount: number[];
  readonly tdhUtilizationPercentage: number[];
}

function calculateTdhUtilizationPercentage(
  tdhOnMainStage: number[],
  networkTdh: number[]
): number[] {
  return tdhOnMainStage.map((tdh, i) => {
    const network = networkTdh[i] ?? 0;
    return network > 0 ? (tdh / network) * 100 : 0;
  });
}

async function fetchCommunityMetricsSeries(): Promise<CommunityMetricsSeriesData> {
  const now = Date.now();
  const since = now - DAYS_31_MS;

  const response = await commonApiFetch<ApiCommunityMetricsSeries>({
    endpoint: "community-metrics/series",
    params: {
      since: since.toString(),
      to: now.toString(),
    },
  });

  return {
    stepsStartTimes: response.steps_start_times,
    dropsCreated: response.drops_created,
    distinctDroppers: response.distinct_droppers,
    mainStageSubmissions: response.main_stage_submissions,
    mainStageDistinctVoters: response.main_stage_distinct_voters,
    mainStageVotes: response.main_stage_votes,
    networkTdh: response.network_tdh,
    tdhOnMainStageSubmissions: response.tdh_on_main_stage_submissions,
    consolidationsFormed: response.consolidations_formed,
    xtdhGranted: response.xtdh_granted,
    activeIdentities: response.active_identities,
    profileCount: response.profile_count,
    tdhUtilizationPercentage: calculateTdhUtilizationPercentage(
      response.tdh_on_main_stage_submissions,
      response.network_tdh
    ),
  };
}

export function useCommunityMetricsSeries() {
  return useQuery<CommunityMetricsSeriesData, Error>({
    queryKey: [QueryKey.COMMUNITY_METRICS_SERIES],
    queryFn: fetchCommunityMetricsSeries,
    staleTime: 60_000,
    gcTime: 300_000,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1_000 * 2 ** attemptIndex, 30_000),
    refetchOnWindowFocus: false,
    refetchOnMount: true,
  });
}
