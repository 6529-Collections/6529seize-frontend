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
  readonly message?: unknown;
  readonly status?: unknown;
  readonly response?: {
    readonly body?: unknown;
    readonly status?: unknown;
  };
  readonly cause?: {
    readonly status?: unknown;
  };
  readonly terminalNotificationAuth?: unknown;
};

export const getQueryErrorStatus = (error: unknown): number | null => {
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

const SESSION_UPGRADE_ERROR_PATTERN =
  /(?:session[-_ ]?v2|session[-_ ]?upgrade|upgrade[^.]{0,40}session|structured[-_ ]?signature)/i;

const hasSessionUpgradeErrorMarker = (error: unknown): boolean => {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const queryError = error as QueryErrorWithStatus;
  const candidates = [queryError.message, queryError.response?.body];
  return candidates.some(
    (candidate) =>
      typeof candidate === "string" &&
      SESSION_UPGRADE_ERROR_PATTERN.test(candidate)
  );
};

/**
 * Notification polling is authenticated and viewer-specific. A 401 or 403 on
 * that endpoint is terminal for the exact session that made the request. Some
 * session-upgrade responses use another 4xx status, so accept only explicit
 * upgrade markers there instead of treating every authorization denial across
 * the app as an expired session.
 */
export const isTerminalNotificationAuthQueryError = (
  error: unknown
): boolean => {
  if (typeof error === "object" && error !== null) {
    const marker = (error as QueryErrorWithStatus).terminalNotificationAuth;
    if (marker === true) {
      return true;
    }
  }

  const status = getQueryErrorStatus(error);
  if (status === 401 || status === 403) {
    return true;
  }

  return (
    status !== null &&
    status >= 400 &&
    status < 500 &&
    hasSessionUpgradeErrorMarker(error)
  );
};

export const shouldStopPollingRetry = (error: unknown): boolean => {
  return isUnauthorizedQueryError(error) || isRateLimitQueryError(error);
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
