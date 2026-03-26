"use client";

import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import {
  createInitialMemesQuickVoteDiscoveryState,
  deriveMemesQuickVoteDiscoverySnapshot,
  getMemesQuickVoteActiveCandidateId,
  getMemesQuickVoteNextCandidateId,
} from "@/hooks/memesQuickVote.queue.helpers";
import {
  fetchMemesQuickVoteDiscoveryBatch,
  fetchMemesQuickVoteDrop,
  fetchMemesQuickVoteSummary,
  getMemesQuickVoteDiscoveryQueryKey,
  getMemesQuickVoteDiscoveryStateKey,
  getMemesQuickVoteDropQueryKey,
  getMemesQuickVoteSummaryQueryKey,
} from "@/hooks/memesQuickVote.query";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { useMemesQuickVoteStorage } from "@/hooks/useMemesQuickVoteStorage";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

export const usePrefetchMemesQuickVote = () => {
  const queryClient = useQueryClient();
  const { contextProfile, isEnabled, memesWaveId, proxyId } =
    useMemesQuickVoteContext();
  const { skippedDropIds } = useMemesQuickVoteStorage({
    contextProfile,
    memesWaveId,
    proxyId,
  });

  return useCallback(
    async (sessionId: number) => {
      const waveId =
        typeof memesWaveId === "string" && memesWaveId.length > 0
          ? memesWaveId
          : null;

      if (!isEnabled || !contextProfile || !waveId) {
        return;
      }

      const discoveryState = createInitialMemesQuickVoteDiscoveryState();
      const discoveryStateKey = getMemesQuickVoteDiscoveryStateKey({
        contextProfile,
        enabled: true,
        memesWaveId: waveId,
        sessionId,
      });
      const summaryPromise = queryClient.prefetchQuery({
        queryKey: getMemesQuickVoteSummaryQueryKey({
          contextProfile,
          proxyId,
          waveId,
        }),
        queryFn: () => fetchMemesQuickVoteSummary(waveId),
        staleTime: 60_000,
        ...getDefaultQueryRetry(),
      });
      const discoveryData = await queryClient.fetchQuery({
        queryKey: getMemesQuickVoteDiscoveryQueryKey({
          discoveryStateKey,
          fetchVersion: 0,
          waveId,
        }),
        queryFn: () =>
          fetchMemesQuickVoteDiscoveryBatch({
            discoveryState,
            skippedDropIds,
            waveId,
          }),
        retry: false,
      });
      const discoverySnapshot = deriveMemesQuickVoteDiscoverySnapshot({
        enabled: true,
        pages: discoveryData.pages,
        skippedDropIds,
        state: discoveryState,
      });
      const activeCandidateId =
        getMemesQuickVoteActiveCandidateId(discoverySnapshot);
      const nextCandidateId =
        getMemesQuickVoteNextCandidateId(discoverySnapshot);
      const dropPrefetches = [activeCandidateId, nextCandidateId]
        .filter((dropId): dropId is string => !!dropId)
        .map((dropId) =>
          queryClient.prefetchQuery({
            queryKey: getMemesQuickVoteDropQueryKey({
              contextProfile,
              dropId,
              proxyId,
            }),
            queryFn: () => fetchMemesQuickVoteDrop(dropId),
            ...getDefaultQueryRetry(),
          })
        );

      await Promise.all([summaryPromise, ...dropPrefetches]);
    },
    [
      contextProfile,
      isEnabled,
      memesWaveId,
      proxyId,
      queryClient,
      skippedDropIds,
    ]
  );
};
