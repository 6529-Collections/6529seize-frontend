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

export const useMemesQuickVoteQueue = (): UseMemesQuickVoteQueueResult => {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const { drops, contextProfile, isPending, isRefetching, memesWaveId } =
    useMemesWaveParticipatoryDrops();

  const [votedSerials, setVotedSerials] = useState<number[]>([]);
  const [optimisticRemainingPower, setOptimisticRemainingPower] = useState<
    number | null
  >(null);
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

  const liveVotedSerials = useMemo(
    () => votedSerials.filter((serialNo) => liveEligibleSerials.has(serialNo)),
    [liveEligibleSerials, votedSerials]
  );
  const hasPendingOptimisticVote = liveVotedSerials.length > 0;
  const activeOptimisticRemainingPower = hasPendingOptimisticVote
    ? optimisticRemainingPower
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
      setVotedSerials((current) => {
        const liveCurrent = current.filter((serialNo) =>
          liveEligibleSerials.has(serialNo)
        );

        return liveCurrent.includes(drop.serial_no)
          ? liveCurrent
          : [...liveCurrent, drop.serial_no];
      });
      setOptimisticRemainingPower(nextRemainingPower);
    },
    [liveEligibleSerials]
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
