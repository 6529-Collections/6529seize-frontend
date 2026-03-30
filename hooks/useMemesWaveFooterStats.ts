"use client";

import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import {
  isMemesQuickVoteVoteableDrop,
  type MemesQuickVoteStats,
} from "@/hooks/memesQuickVote.helpers";
import {
  fetchMemesQuickVoteUndiscoveredDrop,
  getMemesQuickVoteUndiscoveredDropQueryKey,
} from "@/hooks/memesQuickVote.query";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useQuery } from "@tanstack/react-query";

type MemesWaveFooterStats = MemesQuickVoteStats & {
  readonly isAvailable: boolean;
  readonly isReady: boolean;
};

const EMPTY_STATS: MemesWaveFooterStats = {
  isAvailable: false,
  isReady: false,
  uncastPower: null,
  unratedCount: 0,
  votingLabel: null,
};

export const useMemesWaveFooterStats = (): MemesWaveFooterStats => {
  const { contextProfile, isEnabled, memesWaveId, proxyId } =
    useMemesQuickVoteContext();
  const waveId =
    typeof memesWaveId === "string" && memesWaveId.length > 0
      ? memesWaveId
      : null;
  const query = useQuery({
    queryKey: getMemesQuickVoteUndiscoveredDropQueryKey({
      contextProfile,
      proxyId,
      sessionId: 0,
      skip: 0,
      waveId,
    }),
    enabled: isEnabled && waveId !== null,
    queryFn: ({ signal }) =>
      fetchMemesQuickVoteUndiscoveredDrop({
        skip: 0,
        signal,
        waveId,
      }),
    staleTime: 60_000,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...getDefaultQueryRetry(),
  });
  const activeDrop = query.data?.drop ?? null;
  const uncastPower = activeDrop?.context_profile_context?.max_rating ?? null;
  const isAvailable =
    isEnabled &&
    waveId !== null &&
    (!query.isSuccess || isMemesQuickVoteVoteableDrop(activeDrop));

  if (
    !query.isSuccess ||
    !activeDrop ||
    !isMemesQuickVoteVoteableDrop(activeDrop) ||
    typeof uncastPower !== "number"
  ) {
    return {
      ...EMPTY_STATS,
      isAvailable,
    };
  }

  return {
    isAvailable,
    uncastPower,
    unratedCount: query.data.total_count,
    votingLabel: WAVE_VOTING_LABELS[activeDrop.wave.voting_credit_type],
    isReady: true,
  };
};
