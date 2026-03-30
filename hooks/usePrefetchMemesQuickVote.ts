"use client";

import {
  fetchMemesQuickVoteUndiscoveredDrop,
  getMemesQuickVoteUndiscoveredDropQueryKey,
} from "@/hooks/memesQuickVote.query";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback } from "react";

const MEMES_QUICK_VOTE_LOOKAHEAD_COUNT = 4;

export const usePrefetchMemesQuickVote = () => {
  const queryClient = useQueryClient();
  const { contextProfile, isEnabled, memesWaveId, proxyId } =
    useMemesQuickVoteContext();

  return useCallback(
    async (sessionId: number) => {
      const waveId =
        typeof memesWaveId === "string" && memesWaveId.length > 0
          ? memesWaveId
          : null;

      if (!isEnabled || !contextProfile || !waveId) {
        return;
      }

      const undiscoveredPromises = Array.from(
        { length: MEMES_QUICK_VOTE_LOOKAHEAD_COUNT },
        (_, skip) =>
          queryClient.prefetchQuery({
            queryKey: getMemesQuickVoteUndiscoveredDropQueryKey({
              contextProfile,
              proxyId,
              sessionId,
              skip,
              waveId,
            }),
            queryFn: ({ signal }) =>
              fetchMemesQuickVoteUndiscoveredDrop({
                skip,
                signal,
                waveId,
              }),
            retry: false,
            staleTime: 0,
          })
      );

      await Promise.all(undiscoveredPromises);
    },
    [contextProfile, isEnabled, memesWaveId, proxyId, queryClient]
  );
};
