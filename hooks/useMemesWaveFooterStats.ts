"use client";

import {
  getMemesQuickVoteRemainingCount,
  type MemesQuickVoteStats,
} from "@/hooks/memesQuickVote.helpers";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { useMemesQuickVoteSkippedDropIds } from "@/hooks/useMemesQuickVoteStorage";
import { useMemesQuickVoteSummary } from "@/hooks/useMemesQuickVoteSummary";
import { useEffect } from "react";

type MemesWaveFooterStats = MemesQuickVoteStats & {
  readonly isReady: boolean;
};

const EMPTY_STATS: MemesWaveFooterStats = {
  uncastPower: null,
  unratedCount: 0,
  votingLabel: null,
  isReady: false,
};

export const useMemesWaveFooterStats = (): MemesWaveFooterStats => {
  const { contextProfile, memesWaveId } = useMemesQuickVoteContext();
  const { setAndPersistSkippedDropIds, skippedDropIds } =
    useMemesQuickVoteSkippedDropIds({
      contextProfile,
      memesWaveId,
    });
  const { isSuccess, stats } = useMemesQuickVoteSummary();
  const unratedCount = getMemesQuickVoteRemainingCount({
    count: stats.unratedCount,
    hiddenCount: skippedDropIds.length,
  });

  useEffect(() => {
    if (!isSuccess || stats.unratedCount > 0 || skippedDropIds.length === 0) {
      return;
    }

    setAndPersistSkippedDropIds(() => []);
  }, [
    isSuccess,
    setAndPersistSkippedDropIds,
    skippedDropIds.length,
    stats.unratedCount,
  ]);

  if (typeof stats.uncastPower !== "number" || unratedCount <= 0) {
    return EMPTY_STATS;
  }

  return {
    ...stats,
    unratedCount,
    isReady: true,
  };
};
