import { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import { ApiWaveSubscriptionTargetAction } from "@/generated/models/ApiWaveSubscriptionTargetAction";

export const WAVE_SCORE_DISCOVERY_PARAMS = {
  overviewType: ApiWavesOverviewType.ScoredRecentlyDroppedTo,
  scoreSort: ApiWaveScoreSort.Balanced,
} as const;

export const WAVE_FOLLOWING_WAVES_PARAMS = {
  limit: 20,
  initialWavesOverviewType: ApiWavesOverviewType.RecentlyDroppedTo,
  only_waves_followed_by_authenticated_user: true,
};

export const SIDEBAR_WAVES_OVERVIEW_REFETCH_INTERVAL_MS = 60_000;

export const WAVE_DROPS_PARAMS = {
  limit: 50,
};

export const WAVE_DEFAULT_SUBSCRIPTION_ACTIONS = Object.values(
  ApiWaveSubscriptionTargetAction
);
export const WAVE_LOGS_PARAMS = {
  limit: 20,
};

export const getDefaultQueryRetry = (errorCallback?: () => void) => {
  return {
    retry: (failureCount: number) => {
      if (failureCount >= 3) {
        errorCallback?.();
        return false;
      }
      return true;
    },
    retryDelay: (failureCount: number) => {
      return failureCount * 1000;
    },
  };
};
