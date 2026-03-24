"use client";

import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { getDefaultQueryRetry } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDropsLeaderboardPage } from "@/generated/models/ApiDropsLeaderboardPage";
import {
  buildMemesQuickVoteApiDrop,
  deriveMemesQuickVoteStatsFromDrop,
  MEMES_QUICK_VOTE_SUMMARY_PAGE_SIZE,
} from "@/hooks/memesQuickVote.helpers";
import { useMemesQuickVoteContext } from "@/hooks/useMemesQuickVoteContext";
import { commonApiFetch } from "@/services/api/common-api";
import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";

const MEMES_QUICK_VOTE_DISCOVERY_SORT = "CREATED_AT" as const;
const MEMES_QUICK_VOTE_DISCOVERY_SORT_DIRECTION = "DESC" as const;

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
      [
        QueryKey.DROPS_LEADERBOARD,
        {
          context: "memes-quick-vote-summary",
          context_profile: contextProfile,
          page: 1,
          page_size: MEMES_QUICK_VOTE_SUMMARY_PAGE_SIZE,
          proxyId,
          sort: MEMES_QUICK_VOTE_DISCOVERY_SORT,
          sort_direction: MEMES_QUICK_VOTE_DISCOVERY_SORT_DIRECTION,
          unvoted_by_me: true,
          waveId,
        },
      ] as const,
    [contextProfile, proxyId, waveId]
  );

  const query = useQuery({
    queryKey,
    enabled: enabled && isEnabled && waveId !== null,
    queryFn: async () => {
      if (waveId === null) {
        throw new Error("Memes quick vote summary requires a wave id");
      }

      return await commonApiFetch<ApiDropsLeaderboardPage>({
        endpoint: `waves/${waveId}/leaderboard`,
        params: {
          page: "1",
          page_size: `${MEMES_QUICK_VOTE_SUMMARY_PAGE_SIZE}`,
          sort: MEMES_QUICK_VOTE_DISCOVERY_SORT,
          sort_direction: MEMES_QUICK_VOTE_DISCOVERY_SORT_DIRECTION,
          unvoted_by_me: "true",
        },
      });
    },
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
