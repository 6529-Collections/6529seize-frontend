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

export const WAVE_DROPS_NATIVE_INITIAL_PARAMS = {
  limit: 20,
};

export const getWaveDropsInitialLimit = (isNative: boolean): number =>
  isNative ? WAVE_DROPS_NATIVE_INITIAL_PARAMS.limit : WAVE_DROPS_PARAMS.limit;

export const WAVE_DEFAULT_SUBSCRIPTION_ACTIONS = Object.values(
  ApiWaveSubscriptionTargetAction
);
export const WAVE_LOGS_PARAMS = {
  limit: 20,
};

type QueryErrorWithStatus = {
  readonly status?: unknown;
  readonly response?: {
    readonly status?: unknown;
  };
  readonly cause?: {
    readonly status?: unknown;
  };
};

const getQueryErrorStatus = (error: unknown): number | null => {
  if (typeof error !== "object" || error === null) {
    return null;
  }

  const statusError = error as QueryErrorWithStatus;
  const status =
    statusError.status ??
    statusError.response?.status ??
    statusError.cause?.status;

  return typeof status === "number" ? status : null;
};

export const isRateLimitQueryError = (error: unknown): boolean => {
  return getQueryErrorStatus(error) === 429;
};

type DefaultQueryRetryPolicy<TError> = {
  readonly retry: (failureCount: number, error: TError) => boolean;
  readonly retryDelay: (failureCount: number) => number;
};

export const getDefaultQueryRetry = <TError = Error>(
  errorCallback?: () => void
): DefaultQueryRetryPolicy<TError> => {
  return {
    retry: (failureCount: number, error: TError) => {
      if (isRateLimitQueryError(error)) {
        errorCallback?.();
        return false;
      }
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

export const isUnauthorizedQueryError = (error: unknown): boolean => {
  return getQueryErrorStatus(error) === 401;
};
