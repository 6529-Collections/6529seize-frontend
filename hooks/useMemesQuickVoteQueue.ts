"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  appendSkippedSerial,
  buildMemesQuickVoteQueue,
  deriveMemesQuickVoteEffectiveDrops,
  deriveMemesQuickVoteStats,
  getMemesQuickVoteEligibleDrops,
  getDisplayQuickVoteAmounts,
} from "@/hooks/memesQuickVote.helpers";
import { useMemesQuickVoteSubmit } from "@/hooks/useMemesQuickVoteSubmit";
import { useMemesWaveParticipatoryDrops } from "@/hooks/useMemesWaveParticipatoryDrops";
import { useMemesQuickVoteStorage } from "@/hooks/useMemesQuickVoteStorage";
import { useCallback, useContext, useMemo, useState } from "react";

type UseMemesQuickVoteQueueOptions = {
  readonly sessionId: number;
};

type MemesQuickVoteOptimisticState = {
  readonly resetKey: string;
  readonly votedSerials: number[];
  readonly optimisticRemainingPower: number | null;
};

const buildMemesQuickVoteResetKey = (
  sessionId: number,
  memesWaveId: string | null | undefined,
  contextProfile: string | null | undefined
): string => `${sessionId}:${memesWaveId ?? ""}:${contextProfile ?? ""}`;

type UseMemesQuickVoteQueueResult = {
  readonly activeDrop: ExtendedDrop | null;
  readonly queue: ExtendedDrop[];
  readonly isReady: boolean;
  readonly isLoading: boolean;
  readonly isVoting: boolean;
  readonly latestUsedAmount: number | null;
  readonly recentAmounts: number[];
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
  readonly submitVote: (
    drop: ExtendedDrop,
    amount: number | string
  ) => Promise<boolean>;
  readonly skipDrop: (drop: ExtendedDrop) => void;
};

export const useMemesQuickVoteQueue = ({
  sessionId,
}: UseMemesQuickVoteQueueOptions): UseMemesQuickVoteQueueResult => {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const { drops, contextProfile, isPending, isRefetching, memesWaveId } =
    useMemesWaveParticipatoryDrops();

  const currentResetKey = useMemo(
    () => buildMemesQuickVoteResetKey(sessionId, memesWaveId, contextProfile),
    [contextProfile, memesWaveId, sessionId]
  );
  const [optimisticState, setOptimisticState] =
    useState<MemesQuickVoteOptimisticState>({
      resetKey: currentResetKey,
      votedSerials: [],
      optimisticRemainingPower: null,
    });
  const {
    liveSkippedSerials,
    recentAmountsByRecency,
    setAndPersistRecentAmounts,
    setAndPersistSkippedSerials,
  } = useMemesQuickVoteStorage({
    drops,
    contextProfile,
    memesWaveId,
  });

  const liveEligibleSerials = useMemo(
    () =>
      new Set(
        getMemesQuickVoteEligibleDrops(drops).map((drop) => drop.serial_no)
      ),
    [drops]
  );

  const isCurrentOptimisticState = optimisticState.resetKey === currentResetKey;
  const liveVotedSerials = useMemo(() => {
    if (!isCurrentOptimisticState) {
      return [];
    }

    return optimisticState.votedSerials.filter((serialNo) =>
      liveEligibleSerials.has(serialNo)
    );
  }, [
    isCurrentOptimisticState,
    liveEligibleSerials,
    optimisticState.votedSerials,
  ]);
  const hasPendingOptimisticVote = liveVotedSerials.length > 0;
  const activeOptimisticRemainingPower = hasPendingOptimisticVote
    ? optimisticState.optimisticRemainingPower
    : null;
  const effectiveDrops = useMemo(
    () =>
      deriveMemesQuickVoteEffectiveDrops(
        drops,
        liveVotedSerials,
        activeOptimisticRemainingPower
      ),
    [activeOptimisticRemainingPower, drops, liveVotedSerials]
  );

  const queue = useMemo(
    () => buildMemesQuickVoteQueue(effectiveDrops, liveSkippedSerials),
    [effectiveDrops, liveSkippedSerials]
  );

  const stats = useMemo(
    () => deriveMemesQuickVoteStats(effectiveDrops),
    [effectiveDrops]
  );
  const activeDrop = queue[0] ?? null;
  const recentAmounts = useMemo(
    () => getDisplayQuickVoteAmounts(recentAmountsByRecency),
    [recentAmountsByRecency]
  );
  const latestUsedAmount = recentAmountsByRecency.at(-1) ?? null;

  const handleVoteSuccess = useCallback(
    (drop: ExtendedDrop, nextRemainingPower: number) => {
      setOptimisticState((current) => {
        const baseVotedSerials =
          current.resetKey === currentResetKey ? current.votedSerials : [];
        const liveCurrent = baseVotedSerials.filter((serialNo) =>
          liveEligibleSerials.has(serialNo)
        );

        return {
          resetKey: currentResetKey,
          votedSerials: liveCurrent.includes(drop.serial_no)
            ? liveCurrent
            : [...liveCurrent, drop.serial_no],
          optimisticRemainingPower: nextRemainingPower,
        };
      });
    },
    [currentResetKey, liveEligibleSerials]
  );
  const { isVoting, submitVote } = useMemesQuickVoteSubmit({
    requestAuth,
    setToast,
    invalidateDrops,
    setAndPersistRecentAmounts,
    setAndPersistSkippedSerials,
    onVoteSuccess: handleVoteSuccess,
  });

  const skipDrop = useCallback(
    (drop: ExtendedDrop) => {
      setAndPersistSkippedSerials((current) =>
        appendSkippedSerial(current, drop.serial_no)
      );
    },
    [setAndPersistSkippedSerials]
  );

  return {
    activeDrop,
    queue,
    isReady: typeof stats.uncastPower === "number" && queue.length > 0,
    isLoading: isPending || isRefetching,
    isVoting,
    latestUsedAmount,
    recentAmounts,
    uncastPower: stats.uncastPower,
    votingLabel: stats.votingLabel,
    submitVote,
    skipDrop,
  };
};
