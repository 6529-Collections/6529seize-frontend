"use client";

import {
  getMemesQuickVoteRemainingCount,
  type MemesQuickVoteStats,
} from "@/hooks/memesQuickVote.helpers";
import {
  createInitialMemesQuickVoteDiscoveryState,
  deriveMemesQuickVoteDiscoverySnapshot,
  getMemesQuickVoteDiscoveredQueue,
} from "@/hooks/memesQuickVote.queue.helpers";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { fetchMemesQuickVoteDiscoveryBatch } from "@/hooks/memesQuickVote.query";
import { useMemesQuickVoteSkippedDropIds } from "@/hooks/useMemesQuickVoteStorage";
import { useMemesQuickVoteSummary } from "@/hooks/useMemesQuickVoteSummary";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";

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
  const { contextProfile, isEnabled, memesWaveId, proxyId } =
    useMemesQuickVoteContext();
  const { setAndPersistSkippedDropIds, skippedDropIds } =
    useMemesQuickVoteSkippedDropIds({
      contextProfile,
      memesWaveId,
      proxyId,
    });
  const { isSuccess, stats } = useMemesQuickVoteSummary();
  const rawUnratedCount = getMemesQuickVoteRemainingCount({
    count: stats.unratedCount,
    hiddenCount: skippedDropIds.length,
  });
  const shouldRecoverVisibility =
    isEnabled &&
    isSuccess &&
    stats.unratedCount > 0 &&
    skippedDropIds.length > 0 &&
    rawUnratedCount <= 0 &&
    typeof memesWaveId === "string" &&
    memesWaveId.length > 0;
  const recoveredFooterCount = useQuery({
    queryKey: [
      "memes-quick-vote-footer-recovery",
      {
        contextProfile,
        proxyId,
        skippedSignature: skippedDropIds.join(","),
        waveId: memesWaveId,
      },
    ],
    enabled: shouldRecoverVisibility,
    queryFn: async () => {
      const waveId = memesWaveId;

      if (typeof waveId !== "string" || waveId.length === 0) {
        return 0;
      }

      const discoveryState = createInitialMemesQuickVoteDiscoveryState();
      const discoveryData = await fetchMemesQuickVoteDiscoveryBatch({
        discoveryState,
        skippedDropIds,
        waveId,
      });
      const snapshot = deriveMemesQuickVoteDiscoverySnapshot({
        enabled: true,
        pages: discoveryData.pages,
        skippedDropIds,
        state: discoveryState,
      });

      return getMemesQuickVoteDiscoveredQueue(snapshot).length;
    },
    retry: false,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    staleTime: 60_000,
  });
  let unratedCount = rawUnratedCount;

  if (shouldRecoverVisibility) {
    if (typeof recoveredFooterCount.data === "number") {
      unratedCount = recoveredFooterCount.data;
    } else if (recoveredFooterCount.isError) {
      unratedCount = stats.unratedCount;
    } else {
      unratedCount = 0;
    }
  }

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

  if (shouldRecoverVisibility && recoveredFooterCount.isPending) {
    return EMPTY_STATS;
  }

  if (typeof stats.uncastPower !== "number" || unratedCount <= 0) {
    return EMPTY_STATS;
  }

  return {
    ...stats,
    unratedCount,
    isReady: true,
  };
};
