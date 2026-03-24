"use client";

import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import {
  buildMemesQuickVoteApiDrop,
  deriveMemesQuickVoteStatsFromDrop,
} from "@/hooks/memesQuickVote.helpers";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import {
  fetchMemesQuickVoteSummary,
  getMemesQuickVoteSummaryQueryKey,
} from "@/hooks/memesQuickVote.query";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

export const useMemesQuickVoteSummary = ({
  enabled = true,
}: {
  readonly enabled?: boolean | undefined;
} = {}) => {
  const { contextProfile, isEnabled, memesWaveId, proxyId } =
    useMemesQuickVoteContext();
  const waveId =
    typeof memesWaveId === "string" && memesWaveId.length > 0
      ? memesWaveId
      : null;

  const queryKey = useMemo(
    () =>
      getMemesQuickVoteSummaryQueryKey({
        contextProfile,
        proxyId,
        waveId,
      }),
    [contextProfile, proxyId, waveId]
  );

  const query = useQuery({
    queryKey,
    enabled: enabled && isEnabled && waveId !== null,
    queryFn: () => fetchMemesQuickVoteSummary(waveId),
    staleTime: 60_000,
    refetchOnReconnect: false,
    refetchOnWindowFocus: false,
    ...getDefaultQueryRetry(),
  });

  const firstDrop = useMemo(() => {
    const drop = query.data?.drops[0];
    const wave = query.data?.wave;

    if (!drop || !wave) {
      return null;
    }

    return buildMemesQuickVoteApiDrop(drop, wave);
  }, [query.data?.drops, query.data?.wave]);

  const count = query.data?.count ?? 0;
  const stats = useMemo(
    () => deriveMemesQuickVoteStatsFromDrop({ count, drop: firstDrop }),
    [count, firstDrop]
  );

  return {
    ...query,
    count,
    firstDrop,
    isQuickVoteEnabled: isEnabled,
    stats,
  };
};
