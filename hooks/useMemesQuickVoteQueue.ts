"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  appendSkippedDropId,
  getDisplayQuickVoteAmounts,
  getMemesQuickVoteRemainingCount,
} from "@/hooks/memesQuickVote.helpers";
import { useMemesQuickVoteActiveDrop } from "@/hooks/useMemesQuickVoteActiveDrop";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { useMemesQuickVoteDiscovery } from "@/hooks/useMemesQuickVoteDiscovery";
import { useMemesQuickVoteHiddenSummaryCleanup } from "@/hooks/useMemesQuickVoteHiddenSummaryCleanup";
import {
  createInitialOptimisticRemainingPowerState,
  getOptimisticRemainingPowerKey,
  type OptimisticRemainingPowerState,
  useMemesQuickVoteOptimisticState,
  useMemesQuickVoteVoteHandlers,
} from "@/hooks/useMemesQuickVoteQueue.optimistic";
import { useMemesQuickVoteStorage } from "@/hooks/useMemesQuickVoteStorage";
import { useMemesQuickVoteSubmit } from "@/hooks/useMemesQuickVoteSubmit";
import { useMemesQuickVoteSummary } from "@/hooks/useMemesQuickVoteSummary";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useCallback, useContext, useMemo, useState } from "react";

type UseMemesQuickVoteQueueOptions = {
  readonly enabled?: boolean | undefined;
  readonly sessionId: number;
};

type UseMemesQuickVoteQueueResult = {
  readonly activeDrop: ExtendedDrop | null;
  readonly hasDiscoveryError: boolean;
  readonly isExhausted: boolean;
  readonly isLoading: boolean;
  readonly isReady: boolean;
  readonly isVoting: boolean;
  readonly latestUsedAmount: number | null;
  readonly queue: ExtendedDrop[];
  readonly recentAmounts: number[];
  readonly remainingCount: number;
  readonly retryDiscovery: () => void;
  readonly submitVote: (
    drop: ExtendedDrop,
    amount: number | string
  ) => Promise<boolean>;
  readonly skipDrop: (drop: ExtendedDrop) => void;
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
};

type UseMemesQuickVoteQueueDerivedState = Pick<
  UseMemesQuickVoteQueueResult,
  | "activeDrop"
  | "hasDiscoveryError"
  | "isExhausted"
  | "isLoading"
  | "isReady"
  | "latestUsedAmount"
  | "queue"
  | "recentAmounts"
  | "remainingCount"
  | "uncastPower"
  | "votingLabel"
>;

type UseDerivedMemesQuickVoteQueueStateOptions = {
  readonly activeDropCandidate: ExtendedDrop | null;
  readonly activeIsLoading: boolean;
  readonly discoveredQueue: readonly ApiDrop[];
  readonly effectiveOptimisticRemainingPower: number | null;
  readonly enabled: boolean;
  readonly hasPageFetchError: boolean;
  readonly hiddenSkippedCount: number;
  readonly isDiscoveryExhausted: boolean;
  readonly isFetchingPage: boolean;
  readonly isSettingsLoaded: boolean;
  readonly isSummaryPending: boolean;
  readonly isSummaryQuickVoteEnabled: boolean;
  readonly isSummarySuccess: boolean;
  readonly recentAmountsByRecency: readonly number[];
  readonly serverCount: number | null;
  readonly summaryCount: number;
  readonly unreflectedVoteCount: number;
  readonly summaryVotingLabel: string | null;
};

type UseMemesQuickVoteQueueActionsOptions = {
  readonly activeCandidateId: string | null;
  readonly discoveredDropsById: Record<string, ApiDrop>;
  readonly enabled: boolean;
  readonly hideDropId: (dropId: string) => void;
  readonly invalidateDrops: React.ContextType<
    typeof ReactQueryWrapperContext
  >["invalidateDrops"];
  readonly isQuickVoteEnabled: boolean;
  readonly isSummarySuccess: boolean;
  readonly nextCandidateId: string | null;
  readonly optimisticRemainingPowerKey: string;
  readonly optimisticRemainingPowerState: OptimisticRemainingPowerState;
  readonly refetchSummary: () => Promise<unknown>;
  readonly removeDropId: (dropId: string) => void;
  readonly requestAuth: React.ContextType<typeof AuthContext>["requestAuth"];
  readonly resyncDiscovery: () => void;
  readonly setAndPersistRecentAmounts: (
    updater: (current: number[]) => number[]
  ) => void;
  readonly setAndPersistSkippedDropIds: (
    updater: (current: string[]) => string[]
  ) => void;
  readonly setOptimisticRemainingPowerState: React.Dispatch<
    React.SetStateAction<OptimisticRemainingPowerState>
  >;
  readonly setToast: React.ContextType<typeof AuthContext>["setToast"];
  readonly summaryCount: number;
};

const clampDropMaxRating = (
  drop: ExtendedDrop,
  optimisticRemainingPower: number | null
): ExtendedDrop => {
  const profileContext = drop.context_profile_context;
  const maxRating = profileContext?.max_rating;

  if (
    optimisticRemainingPower === null ||
    profileContext?.rating !== 0 ||
    typeof maxRating !== "number"
  ) {
    return drop;
  }

  const nextMaxRating = Math.max(
    0,
    Math.min(maxRating, optimisticRemainingPower)
  );

  if (nextMaxRating === maxRating) {
    return drop;
  }

  return {
    ...drop,
    context_profile_context: {
      ...profileContext,
      max_rating: nextMaxRating,
    },
  };
};

const isVoteableQuickVoteDrop = (drop: ExtendedDrop | null): boolean => {
  const profileContext = drop?.context_profile_context;

  return (
    profileContext?.rating === 0 &&
    typeof profileContext.max_rating === "number" &&
    profileContext.max_rating > 0
  );
};

const useDerivedMemesQuickVoteQueueState = ({
  activeDropCandidate,
  activeIsLoading,
  discoveredQueue,
  effectiveOptimisticRemainingPower,
  enabled,
  hasPageFetchError,
  hiddenSkippedCount,
  isDiscoveryExhausted,
  isFetchingPage,
  isSettingsLoaded,
  isSummaryPending,
  isSummaryQuickVoteEnabled,
  isSummarySuccess,
  recentAmountsByRecency,
  serverCount,
  summaryCount,
  unreflectedVoteCount,
  summaryVotingLabel,
}: UseDerivedMemesQuickVoteQueueStateOptions): UseMemesQuickVoteQueueDerivedState => {
  const clampedActiveDrop = useMemo(
    () =>
      activeDropCandidate
        ? clampDropMaxRating(
            activeDropCandidate,
            effectiveOptimisticRemainingPower
          )
        : null,
    [activeDropCandidate, effectiveOptimisticRemainingPower]
  );
  const activeDrop = isVoteableQuickVoteDrop(clampedActiveDrop)
    ? clampedActiveDrop
    : null;

  const queue = useMemo(() => {
    const clampedQueue = discoveredQueue
      .map(convertApiDropToExtendedDrop)
      .map((drop) =>
        clampDropMaxRating(drop, effectiveOptimisticRemainingPower)
      );

    if (!clampedActiveDrop) {
      return clampedQueue;
    }

    return clampedQueue.map((drop) =>
      drop.id === clampedActiveDrop.id ? clampedActiveDrop : drop
    );
  }, [clampedActiveDrop, discoveredQueue, effectiveOptimisticRemainingPower]);

  const recentAmounts = useMemo(
    () => getDisplayQuickVoteAmounts(recentAmountsByRecency),
    [recentAmountsByRecency]
  );
  const latestUsedAmount = recentAmountsByRecency.at(-1) ?? null;
  const uncastPower = activeDrop?.context_profile_context?.max_rating ?? null;
  const votingLabel = activeDrop
    ? WAVE_VOTING_LABELS[activeDrop.wave.voting_credit_type]
    : summaryVotingLabel;
  const remainingCount = isSummarySuccess
    ? getMemesQuickVoteRemainingCount({
        count: summaryCount,
        floor: queue.length,
        hiddenCount: hiddenSkippedCount,
        optimisticVoteCount: unreflectedVoteCount,
      })
    : getMemesQuickVoteRemainingCount({
        count: serverCount,
        floor: queue.length,
        hiddenCount: hiddenSkippedCount,
      });
  const hasDiscoveryError = enabled && hasPageFetchError;
  const isQuickVoteUnavailable =
    enabled && isSettingsLoaded && !isSummaryQuickVoteEnabled;
  const activeProfileContext = clampedActiveDrop?.context_profile_context;
  const isPowerExhausted =
    enabled &&
    !hasDiscoveryError &&
    activeProfileContext?.rating === 0 &&
    typeof activeProfileContext.max_rating === "number" &&
    activeProfileContext.max_rating <= 0;
  const isExhausted =
    enabled &&
    (isQuickVoteUnavailable || isDiscoveryExhausted || isPowerExhausted);
  const isLoading =
    enabled &&
    !hasDiscoveryError &&
    !isExhausted &&
    !activeDropCandidate &&
    (!isSettingsLoaded ||
      (isSummaryQuickVoteEnabled && isSummaryPending) ||
      isFetchingPage ||
      activeIsLoading);

  return {
    activeDrop,
    hasDiscoveryError,
    isExhausted,
    isLoading,
    isReady: activeDrop !== null,
    latestUsedAmount,
    queue,
    recentAmounts,
    remainingCount,
    uncastPower,
    votingLabel,
  };
};

const useMemesQuickVoteQueueActions = ({
  activeCandidateId,
  discoveredDropsById,
  enabled,
  hideDropId,
  invalidateDrops,
  isQuickVoteEnabled,
  isSummarySuccess,
  nextCandidateId,
  optimisticRemainingPowerKey,
  optimisticRemainingPowerState,
  refetchSummary,
  removeDropId,
  requestAuth,
  resyncDiscovery,
  setAndPersistRecentAmounts,
  setAndPersistSkippedDropIds,
  setOptimisticRemainingPowerState,
  setToast,
  summaryCount,
}: UseMemesQuickVoteQueueActionsOptions) => {
  const {
    hasPendingOptimisticVotes,
    optimisticRemainingPower,
    summaryOptimismState,
  } = useMemesQuickVoteOptimisticState({
    isSummarySuccess,
    optimisticRemainingPowerKey,
    optimisticRemainingPowerState,
    summaryCount,
  });
  const {
    handleInvalidatedDrop,
    handleVoteFailure,
    handleVoteQueued,
    handleVoteSuccess,
  } = useMemesQuickVoteVoteHandlers({
    isSummarySuccess,
    optimisticRemainingPowerKey,
    refetchSummary,
    removeDropId,
    resyncDiscovery,
    setAndPersistSkippedDropIds,
    setOptimisticRemainingPowerState,
    summaryCount,
  });
  const active = useMemesQuickVoteActiveDrop({
    activeCandidateId,
    discoveredDropsById,
    enabled: enabled && isQuickVoteEnabled,
    nextCandidateId,
    onInvalidatedDrop: handleInvalidatedDrop,
  });
  const effectiveOptimisticRemainingPower =
    active.hasFreshData && !hasPendingOptimisticVotes
      ? null
      : optimisticRemainingPower;
  const { isVoting, submitVote } = useMemesQuickVoteSubmit({
    requestAuth,
    setToast,
    invalidateDrops,
    onVoteFailure: handleVoteFailure,
    onVoteQueued: handleVoteQueued,
    onVoteSuccess: handleVoteSuccess,
    setAndPersistRecentAmounts,
    setAndPersistSkippedDropIds,
  });
  const skipDrop = useCallback(
    (drop: ExtendedDrop) => {
      hideDropId(drop.id);
      setAndPersistSkippedDropIds((current) =>
        appendSkippedDropId(current, drop.id)
      );
    },
    [hideDropId, setAndPersistSkippedDropIds]
  );

  return {
    active,
    effectiveOptimisticRemainingPower,
    isVoting,
    skipDrop,
    submitVote,
    summaryOptimismState,
  };
};

export const useMemesQuickVoteQueue = ({
  enabled = true,
  sessionId,
}: UseMemesQuickVoteQueueOptions): UseMemesQuickVoteQueueResult => {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const {
    contextProfile,
    isLoaded: isSettingsLoaded,
    isEnabled: isQuickVoteEnabled,
    memesWaveId,
    proxyId,
  } = useMemesQuickVoteContext();
  const optimisticRemainingPowerKey = getOptimisticRemainingPowerKey({
    contextProfile,
    memesWaveId,
    sessionId,
  });
  const [optimisticRemainingPowerState, setOptimisticRemainingPowerState] =
    useState<OptimisticRemainingPowerState>(() =>
      createInitialOptimisticRemainingPowerState(optimisticRemainingPowerKey)
    );
  const {
    recentAmountsByRecency,
    setAndPersistRecentAmounts,
    setAndPersistSkippedDropIds,
    skippedDropIds,
  } = useMemesQuickVoteStorage({
    contextProfile,
    memesWaveId,
    proxyId,
  });
  const summary = useMemesQuickVoteSummary({ enabled });
  const discovery = useMemesQuickVoteDiscovery({
    enabled,
    sessionId,
    skippedDropIds,
  });
  const {
    activeCandidateId,
    discoveredDropsById,
    hasPageFetchError,
    hideDropId,
    isExhausted: isDiscoveryExhausted,
    isFetchingPage,
    nextCandidateId,
    queue: discoveredQueue,
    removeDropId,
    resyncDiscovery,
    retryDiscovery,
    serverCount,
  } = discovery;
  const {
    count: summaryCount,
    firstDrop: summaryFirstDrop,
    isPending: isSummaryPending,
    isQuickVoteEnabled: isSummaryQuickVoteEnabled,
    isSuccess: isSummarySuccess,
    refetch: refetchSummary,
    stats: summaryStats,
  } = summary;
  const {
    active,
    effectiveOptimisticRemainingPower,
    isVoting,
    skipDrop,
    submitVote,
    summaryOptimismState,
  } = useMemesQuickVoteQueueActions({
    activeCandidateId,
    discoveredDropsById,
    enabled,
    hideDropId,
    invalidateDrops,
    isQuickVoteEnabled,
    isSummarySuccess,
    nextCandidateId,
    optimisticRemainingPowerKey,
    optimisticRemainingPowerState,
    refetchSummary,
    removeDropId,
    requestAuth,
    resyncDiscovery,
    setAndPersistRecentAmounts,
    setAndPersistSkippedDropIds,
    setOptimisticRemainingPowerState,
    setToast,
    summaryCount,
  });
  const clearHiddenSummaryDrop = useCallback(
    (dropId: string) => {
      removeDropId(dropId);
      setAndPersistSkippedDropIds((current) =>
        current.filter((value) => value !== dropId)
      );
      void refetchSummary();
    },
    [refetchSummary, removeDropId, setAndPersistSkippedDropIds]
  );
  useMemesQuickVoteHiddenSummaryCleanup({
    activeCandidateId,
    enabled,
    isFetchingPage,
    isSummarySuccess,
    memesWaveId,
    onClearHiddenSummaryDrop: clearHiddenSummaryDrop,
    skippedDropIds,
    summaryFirstDrop,
  });

  const derivedState = useDerivedMemesQuickVoteQueueState({
    activeDropCandidate: active.activeDrop,
    activeIsLoading: active.isLoading,
    discoveredQueue,
    effectiveOptimisticRemainingPower,
    enabled,
    hasPageFetchError,
    hiddenSkippedCount: skippedDropIds.length,
    isDiscoveryExhausted,
    isFetchingPage,
    isSettingsLoaded,
    isSummaryPending,
    isSummaryQuickVoteEnabled,
    isSummarySuccess,
    recentAmountsByRecency,
    serverCount,
    summaryCount,
    unreflectedVoteCount: summaryOptimismState.unreflectedVoteCount,
    summaryVotingLabel: summaryStats.votingLabel,
  });

  return {
    ...derivedState,
    isVoting,
    retryDiscovery,
    submitVote,
    skipDrop,
  };
};
