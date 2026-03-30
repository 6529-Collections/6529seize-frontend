"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useCallback, useMemo } from "react";

export type OptimisticRemainingPowerState = {
  readonly key: string;
  readonly pendingVotes: {
    readonly amount: number;
    readonly dropId: string;
  }[];
  readonly optimisticVoteCount: number;
  readonly settledRemainingPower: number | null;
  readonly summaryBaselineCount: number | null;
};

type SetOptimisticRemainingPowerState = React.Dispatch<
  React.SetStateAction<OptimisticRemainingPowerState>
>;

type UseMemesQuickVoteOptimisticStateOptions = {
  readonly isSummarySuccess: boolean;
  readonly optimisticRemainingPowerKey: string;
  readonly optimisticRemainingPowerState: OptimisticRemainingPowerState;
  readonly summaryCount: number;
};

type UseMemesQuickVoteVoteHandlersOptions = {
  readonly isSummarySuccess: boolean;
  readonly optimisticRemainingPowerKey: string;
  readonly refetchSummary: () => Promise<unknown>;
  readonly removeDropId: (dropId: string) => void;
  readonly resyncDiscovery: () => void;
  readonly setAndPersistSkippedDropIds: (
    updater: (current: string[]) => string[]
  ) => void;
  readonly setOptimisticRemainingPowerState: SetOptimisticRemainingPowerState;
  readonly summaryCount: number;
};

export const getOptimisticRemainingPowerKey = ({
  contextProfile,
  memesWaveId,
  sessionId,
}: {
  readonly contextProfile: string | null | undefined;
  readonly memesWaveId: string | null | undefined;
  readonly sessionId: number;
}): string => `${sessionId}:${memesWaveId ?? ""}:${contextProfile ?? ""}`;

export const createInitialOptimisticRemainingPowerState = (
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

export const useMemesQuickVoteOptimisticState = ({
  isSummarySuccess,
  optimisticRemainingPowerKey,
  optimisticRemainingPowerState,
  summaryCount,
}: UseMemesQuickVoteOptimisticStateOptions) => {
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

  return {
    hasPendingOptimisticVotes,
    optimisticRemainingPower,
    summaryOptimismState,
  };
};

export const useMemesQuickVoteVoteHandlers = ({
  isSummarySuccess,
  optimisticRemainingPowerKey,
  refetchSummary,
  removeDropId,
  resyncDiscovery,
  setAndPersistSkippedDropIds,
  setOptimisticRemainingPowerState,
  summaryCount,
}: UseMemesQuickVoteVoteHandlersOptions) => {
  const handleInvalidatedDrop = useCallback(
    (dropId: string) => {
      removeDropId(dropId);
      setAndPersistSkippedDropIds((current) =>
        current.filter((value) => value !== dropId)
      );
      void refetchSummary();
    },
    [removeDropId, refetchSummary, setAndPersistSkippedDropIds]
  );

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
    [
      isSummarySuccess,
      optimisticRemainingPowerKey,
      removeDropId,
      setOptimisticRemainingPowerState,
      summaryCount,
    ]
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
    [optimisticRemainingPowerKey, setOptimisticRemainingPowerState]
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
    [
      optimisticRemainingPowerKey,
      refetchSummary,
      resyncDiscovery,
      setOptimisticRemainingPowerState,
    ]
  );

  return {
    handleInvalidatedDrop,
    handleVoteFailure,
    handleVoteQueued,
    handleVoteSuccess,
  };
};
