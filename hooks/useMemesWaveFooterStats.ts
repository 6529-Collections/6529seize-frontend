"use client";

import {
  deriveMemesQuickVoteStats,
  type MemesQuickVoteStats,
} from "@/hooks/memesQuickVote.helpers";
import { useMemesWaveParticipatoryDrops } from "@/hooks/useMemesWaveParticipatoryDrops";
import { useMemo } from "react";

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
  const { drops } = useMemesWaveParticipatoryDrops();
  const stats = useMemo(() => deriveMemesQuickVoteStats(drops), [drops]);

  if (typeof stats.uncastPower !== "number") {
    return EMPTY_STATS;
  }

  return {
    ...stats,
    isReady: true,
  };
};
