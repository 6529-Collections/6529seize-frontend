"use client";

import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { isMemesQuickVoteMissingDropError } from "@/hooks/memesQuickVote.errors";
import { isMemesQuickVoteDiscoverableDrop } from "@/hooks/memesQuickVote.helpers";
import {
  fetchMemesQuickVoteDrop,
  getMemesQuickVoteDropQueryKey,
} from "@/hooks/memesQuickVote.query";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

export const useMemesQuickVoteHiddenSummaryCleanup = ({
  activeCandidateId,
  enabled,
  isFetchingPage,
  isSummarySuccess,
  memesWaveId,
  onClearHiddenSummaryDrop,
  skippedDropIds,
  summaryFirstDrop,
}: {
  readonly activeCandidateId: string | null;
  readonly enabled: boolean;
  readonly isFetchingPage: boolean;
  readonly isSummarySuccess: boolean;
  readonly memesWaveId: string | null | undefined;
  readonly onClearHiddenSummaryDrop: (dropId: string) => void;
  readonly skippedDropIds: readonly string[];
  readonly summaryFirstDrop: ApiDrop | null;
}) => {
  const hiddenSummaryDropId = useMemo(() => {
    if (
      !enabled ||
      !isSummarySuccess ||
      !summaryFirstDrop ||
      !skippedDropIds.includes(summaryFirstDrop.id) ||
      activeCandidateId !== null ||
      isFetchingPage
    ) {
      return null;
    }

    return summaryFirstDrop.id;
  }, [
    activeCandidateId,
    enabled,
    isFetchingPage,
    isSummarySuccess,
    skippedDropIds,
    summaryFirstDrop,
  ]);

  useQuery({
    queryKey: hiddenSummaryDropId
      ? getMemesQuickVoteDropQueryKey(hiddenSummaryDropId)
      : ["memes-quick-vote-hidden-summary-drop", null],
    queryFn: async () => {
      const dropId = hiddenSummaryDropId;

      if (dropId === null) {
        return null;
      }

      try {
        const drop = await fetchMemesQuickVoteDrop(dropId);

        if (
          !isMemesQuickVoteDiscoverableDrop({
            drop,
            waveId: memesWaveId,
          })
        ) {
          onClearHiddenSummaryDrop(dropId);
          return null;
        }

        return drop;
      } catch (error) {
        if (isMemesQuickVoteMissingDropError(error)) {
          onClearHiddenSummaryDrop(dropId);
          return null;
        }

        throw error;
      }
    },
    enabled: hiddenSummaryDropId !== null,
    ...getDefaultQueryRetry(),
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    retry: false,
    staleTime: 0,
  });
};
