"use client";

import type { MemesQuickVoteStats } from "@/hooks/memesQuickVote.helpers";
import { useMemesQuickVoteSummary } from "@/hooks/useMemesQuickVoteSummary";

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
  const { stats } = useMemesQuickVoteSummary();

  if (typeof stats.uncastPower !== "number" || stats.unratedCount <= 0) {
    return EMPTY_STATS;
  }

  return {
    ...stats,
    isReady: true,
  };
};
