import { useQueries } from "@tanstack/react-query";
import { useWaveOutcomesQuery } from "./useWaveOutcomesQuery";
import { ApiWaveOutcomeCredit } from "@/generated/models/ApiWaveOutcomeCredit";
import { ApiWaveOutcomeType } from "@/generated/models/ApiWaveOutcomeType";
import { commonApiFetch } from "@/services/api/common-api";
import { ApiWaveOutcomeDistributionItemsPage } from "@/generated/models/ApiWaveOutcomeDistributionItemsPage";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

const DISTRIBUTION_PAGE_SIZE = 100;

export interface WaveRankRewards {
  readonly nicTotal: number;
  readonly repTotal: number;
  readonly manualOutcomes: string[];
  readonly isLoading: boolean;
}

export function useWaveRankReward({
  waveId,
  rank,
  enabled = true,
}: {
  waveId: string;
  rank: number | null;
  enabled?: boolean;
}): WaveRankRewards {
  const { outcomes, isEnabled: isOutcomesEnabled } = useWaveOutcomesQuery({
    waveId,
    // We only need the types of outcomes to know what to fetch
    enabled: enabled && !!rank,
  });

  // Calculate which page the rank falls into.
  // Rank 1 -> index 0. Page 1 (indices 0-99).
  // Rank 101 -> index 100. Page 2 (indices 100-199).
  const targetIndex = rank ? rank - 1 : 0;
  const page = Math.floor(targetIndex / DISTRIBUTION_PAGE_SIZE) + 1;

  const distributionQueries = useQueries({
    queries: outcomes.map((outcome) => ({
      queryKey: [
        QueryKey.WAVE_OUTCOME_DISTRIBUTION_PAGE,
        waveId,
        outcome.index,
        page,
        DISTRIBUTION_PAGE_SIZE,
      ],
      queryFn: () =>
        commonApiFetch<ApiWaveOutcomeDistributionItemsPage>({
          endpoint: `waves/${waveId}/outcomes/${outcome.index}/distribution`,
          params: {
            page: page.toString(),
            page_size: DISTRIBUTION_PAGE_SIZE.toString(),
          },
        }),
      enabled: isOutcomesEnabled && !!rank && enabled,
      staleTime: 60000, // Cache for a minute
    })),
  });

  const isLoading = distributionQueries.some((q) => q.isLoading);

  if (!rank || !enabled) {
    return {
      nicTotal: 0,
      repTotal: 0,
      manualOutcomes: [],
      isLoading: false
    }
  }

  let nicTotal = 0;
  let repTotal = 0;
  const manualOutcomes: string[] = [];

  // Iterate over outcomes and their corresponding query results
  outcomes.forEach((outcome, i) => {
    const query = distributionQueries[i];
    if (query.data?.data) {
      const item = query.data.data.find((d) => d.index === targetIndex);
      if (item && item.amount) {
        if (outcome.credit === ApiWaveOutcomeCredit.Cic) {
          nicTotal += item.amount;
        } else if (outcome.credit === ApiWaveOutcomeCredit.Rep) {
          repTotal += item.amount;
        } else if (outcome.type === ApiWaveOutcomeType.Manual) {
          if (item.description) {
            manualOutcomes.push(item.description);
          }
        }
      }
    }
  });

  return {
    nicTotal,
    repTotal,
    manualOutcomes,
    isLoading,
  };
}
