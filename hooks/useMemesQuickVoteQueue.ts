"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  appendSkippedDropId,
  getDisplayQuickVoteAmounts,
} from "@/hooks/memesQuickVote.helpers";
import { useMemesQuickVoteActiveDrop } from "@/hooks/useMemesQuickVoteActiveDrop";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { useMemesQuickVoteDiscovery } from "@/hooks/useMemesQuickVoteDiscovery";
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

type OptimisticRemainingPowerState = {
  readonly key: string;
  readonly pendingVotes: {
    readonly amount: number;
    readonly dropId: string;
  }[];
  readonly optimisticVoteCount: number;
  readonly settledRemainingPower: number | null;
  readonly summaryBaselineCount: number | null;
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

const getOptimisticRemainingPowerKey = ({
  contextProfile,
  memesWaveId,
  sessionId,
}: {
  readonly contextProfile: string | null | undefined;
  readonly memesWaveId: string | null | undefined;
  readonly sessionId: number;
}): string => `${sessionId}:${memesWaveId ?? ""}:${contextProfile ?? ""}`;

const createInitialOptimisticRemainingPowerState = (
  key: string
): OptimisticRemainingPowerState => ({
  key,
  pendingVotes: [],
  optimisticVoteCount: 0,
  settledRemainingPower: null,
  summaryBaselineCount: null,
});

const getCurrentOptimisticRemainingPowerState = ({
  key,
  state,
}: {
  readonly key: string;
  readonly state: OptimisticRemainingPowerState;
}): OptimisticRemainingPowerState =>
  state.key === key ? state : createInitialOptimisticRemainingPowerState(key);

const deriveSummaryOptimismState = ({
  hasPendingVotes,
  isSummarySuccess,
  optimisticVoteCount,
  summaryBaselineCount,
  summaryCount,
}: {
  readonly hasPendingVotes: boolean;
  readonly isSummarySuccess: boolean;
  readonly optimisticVoteCount: number;
  readonly summaryBaselineCount: number | null;
  readonly summaryCount: number;
}) => {
  if (summaryBaselineCount === null || optimisticVoteCount === 0) {
    return {
      isSettled: true,
      unreflectedVoteCount: 0,
    };
  }

  const reflectedVoteCount = isSummarySuccess
    ? Math.max(0, summaryBaselineCount - summaryCount)
    : 0;
  const isSettled =
    !hasPendingVotes &&
    isSummarySuccess &&
    reflectedVoteCount >= optimisticVoteCount;

  return {
    isSettled,
    unreflectedVoteCount: isSettled
      ? 0
      : Math.max(0, optimisticVoteCount - reflectedVoteCount),
  };
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
    ? Math.max(queue.length, Math.max(0, summaryCount - unreflectedVoteCount))
    : Math.max(serverCount ?? 0, queue.length);
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
  });
  const summary = useMemesQuickVoteSummary({ enabled });
  const discovery = useMemesQuickVoteDiscovery({
    enabled,
    sessionId,
    skippedDropIds,
  });
  const {
    activeCandidateId,
    deferDropId,
    discoveredDropsById,
    hasPageFetchError,
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
    isPending: isSummaryPending,
    isQuickVoteEnabled: isSummaryQuickVoteEnabled,
    isSuccess: isSummarySuccess,
    refetch: refetchSummary,
    stats: summaryStats,
  } = summary;
  const currentOptimisticRemainingPowerState =
    getCurrentOptimisticRemainingPowerState({
      key: optimisticRemainingPowerKey,
      state: optimisticRemainingPowerState,
    });
  const hasPendingOptimisticVotes =
    currentOptimisticRemainingPowerState.pendingVotes.length > 0;
  const optimisticRemainingPower = useMemo(() => {
    const pendingSpent =
      currentOptimisticRemainingPowerState.pendingVotes.reduce(
        (sum, vote) => sum + vote.amount,
        0
      );
    const settledRemainingPower =
      currentOptimisticRemainingPowerState.settledRemainingPower;

    if (settledRemainingPower === null) {
      return null;
    }

    return Math.max(0, settledRemainingPower - pendingSpent);
  }, [currentOptimisticRemainingPowerState]);
  const summaryOptimismState = useMemo(
    () =>
      deriveSummaryOptimismState({
        hasPendingVotes: hasPendingOptimisticVotes,
        isSummarySuccess,
        optimisticVoteCount:
          currentOptimisticRemainingPowerState.optimisticVoteCount,
        summaryBaselineCount:
          currentOptimisticRemainingPowerState.summaryBaselineCount,
        summaryCount,
      }),
    [
      currentOptimisticRemainingPowerState.optimisticVoteCount,
      currentOptimisticRemainingPowerState.summaryBaselineCount,
      hasPendingOptimisticVotes,
      isSummarySuccess,
      summaryCount,
    ]
  );

  const handleInvalidatedDrop = useCallback(
    (dropId: string) => {
      removeDropId(dropId);
      setAndPersistSkippedDropIds((current) =>
        current.filter((value) => value !== dropId)
      );
      // Refresh the shared footer summary without blocking queue advancement.
      void refetchSummary();
    },
    [removeDropId, refetchSummary, setAndPersistSkippedDropIds]
  );

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

  const handleVoteQueued = useCallback(
    (drop: ExtendedDrop, amount: number) => {
      removeDropId(drop.id);
      setOptimisticRemainingPowerState((current) => {
        const baseState = getCurrentOptimisticRemainingPowerState({
          key: optimisticRemainingPowerKey,
          state: current,
        });
        const reflectedVoteCount =
          baseState.summaryBaselineCount === null || !isSummarySuccess
            ? 0
            : Math.max(0, baseState.summaryBaselineCount - summaryCount);
        const isSummaryCycleSettled =
          baseState.summaryBaselineCount !== null &&
          baseState.optimisticVoteCount > 0 &&
          baseState.pendingVotes.length === 0 &&
          isSummarySuccess &&
          reflectedVoteCount >= baseState.optimisticVoteCount;
        const shouldResetSummaryCycle =
          baseState.summaryBaselineCount === null ||
          baseState.optimisticVoteCount === 0 ||
          isSummaryCycleSettled;

        return {
          ...baseState,
          pendingVotes: [
            ...baseState.pendingVotes,
            {
              amount,
              dropId: drop.id,
            },
          ],
          settledRemainingPower:
            baseState.pendingVotes.length === 0
              ? (drop.context_profile_context?.max_rating ?? null)
              : (baseState.settledRemainingPower ??
                drop.context_profile_context?.max_rating ??
                null),
          optimisticVoteCount:
            shouldResetSummaryCycle || !isSummarySuccess
              ? 1
              : baseState.optimisticVoteCount + 1,
          summaryBaselineCount:
            isSummarySuccess && shouldResetSummaryCycle
              ? summaryCount
              : baseState.summaryBaselineCount,
        };
      });
    },
    [isSummarySuccess, optimisticRemainingPowerKey, removeDropId, summaryCount]
  );

  const handleVoteSuccess = useCallback(
    (_drop: ExtendedDrop, _amount: number, nextRemainingPower: number) => {
      setOptimisticRemainingPowerState((current) => {
        const baseState = getCurrentOptimisticRemainingPowerState({
          key: optimisticRemainingPowerKey,
          state: current,
        });
        const currentVote = baseState.pendingVotes[0];

        if (!currentVote) {
          return {
            ...baseState,
            settledRemainingPower: nextRemainingPower,
          };
        }

        return {
          ...baseState,
          pendingVotes: baseState.pendingVotes.slice(1),
          settledRemainingPower: nextRemainingPower,
        };
      });
    },
    [optimisticRemainingPowerKey]
  );

  const handleVoteFailure = useCallback(
    (_drop: ExtendedDrop, _amount: number) => {
      setOptimisticRemainingPowerState((current) => {
        const baseState = getCurrentOptimisticRemainingPowerState({
          key: optimisticRemainingPowerKey,
          state: current,
        });

        if (baseState.pendingVotes.length === 0) {
          return baseState;
        }

        const nextPendingVotes = baseState.pendingVotes.slice(1);
        const nextOptimisticVoteCount = Math.max(
          0,
          baseState.optimisticVoteCount - 1
        );

        return {
          ...baseState,
          pendingVotes: nextPendingVotes,
          optimisticVoteCount: nextOptimisticVoteCount,
          settledRemainingPower:
            nextPendingVotes.length === 0
              ? null
              : baseState.settledRemainingPower,
          summaryBaselineCount:
            nextOptimisticVoteCount === 0
              ? null
              : baseState.summaryBaselineCount,
        };
      });
      resyncDiscovery();
      void refetchSummary();
    },
    [optimisticRemainingPowerKey, refetchSummary, resyncDiscovery]
  );

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
      deferDropId(drop.id);
      setAndPersistSkippedDropIds((current) =>
        appendSkippedDropId(current, drop.id)
      );
    },
    [deferDropId, setAndPersistSkippedDropIds]
  );

  const derivedState = useDerivedMemesQuickVoteQueueState({
    activeDropCandidate: active.activeDrop,
    activeIsLoading: active.isLoading,
    discoveredQueue,
    effectiveOptimisticRemainingPower,
    enabled,
    hasPageFetchError,
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
