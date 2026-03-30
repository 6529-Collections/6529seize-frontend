import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropsLeaderboardPage } from "@/generated/models/ApiDropsLeaderboardPage";
import {
  buildMemesQuickVoteApiDrop,
  MEMES_QUICK_VOTE_DISCOVERY_PAGE_SIZE,
  MEMES_QUICK_VOTE_REPLENISH_THRESHOLD,
  MEMES_QUICK_VOTE_SUMMARY_PAGE_SIZE,
} from "@/hooks/memesQuickVote.helpers";
import {
  deriveMemesQuickVoteDiscoverySnapshot,
  shouldFetchMemesQuickVotePage,
  type MemesQuickVoteDiscoveryPage,
  type MemesQuickVoteDiscoveryState,
} from "@/hooks/memesQuickVote.queue.helpers";
import { commonApiFetch } from "@/services/api/common-api";

const MEMES_QUICK_VOTE_DISCOVERY_SORT = "CREATED_AT" as const;
const MEMES_QUICK_VOTE_DISCOVERY_SORT_DIRECTION = "DESC" as const;

export type MemesQuickVoteDiscoveryQueryData = {
  readonly pages: readonly MemesQuickVoteDiscoveryPage[];
};

export const getMemesQuickVoteDropQueryKey = ({
  contextProfile,
  dropId,
  proxyId,
}: {
  readonly contextProfile: string | null | undefined;
  readonly dropId: string;
  readonly proxyId: string | null | undefined;
}) =>
  [
    QueryKey.DROP,
    {
      context: "memes-quick-vote",
      context_profile: contextProfile ?? null,
      drop_id: dropId,
      proxyId: proxyId ?? null,
    },
  ] as const;

export const fetchMemesQuickVoteDrop = async (dropId: string) =>
  await commonApiFetch<ApiDrop>({
    endpoint: `drops/${dropId}`,
  });

export const getMemesQuickVoteSummaryQueryKey = ({
  contextProfile,
  proxyId,
  waveId,
}: {
  readonly contextProfile: string | null | undefined;
  readonly proxyId: string | null | undefined;
  readonly waveId: string | null;
}) =>
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
  ] as const;

export const fetchMemesQuickVoteSummary = async (waveId: string | null) => {
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
};

export const getMemesQuickVoteDiscoveryStateKey = ({
  contextProfile,
  enabled,
  memesWaveId,
  sessionId,
}: {
  readonly contextProfile: string | null | undefined;
  readonly enabled: boolean;
  readonly memesWaveId: string | null | undefined;
  readonly sessionId: number;
}): string =>
  `${sessionId}:${memesWaveId ?? ""}:${contextProfile ?? ""}:${enabled ? "1" : "0"}`;

export const getMemesQuickVoteDiscoveryQueryKey = ({
  discoveryStateKey,
  fetchVersion,
  waveId,
}: {
  readonly discoveryStateKey: string;
  readonly fetchVersion: number;
  readonly waveId: string | null;
}) =>
  [
    QueryKey.DROPS_LEADERBOARD,
    {
      context: "memes-quick-vote-discovery",
      fetchVersion,
      identity: discoveryStateKey,
      page_size: MEMES_QUICK_VOTE_DISCOVERY_PAGE_SIZE,
      sort: MEMES_QUICK_VOTE_DISCOVERY_SORT,
      sort_direction: MEMES_QUICK_VOTE_DISCOVERY_SORT_DIRECTION,
      unvoted_by_me: true,
      waveId,
    },
  ] as const;

export const fetchMemesQuickVoteDiscoveryBatch = async ({
  discoveryState,
  skippedDropIds,
  waveId,
}: {
  readonly discoveryState: MemesQuickVoteDiscoveryState;
  readonly skippedDropIds: readonly string[];
  readonly waveId: string | null;
}): Promise<MemesQuickVoteDiscoveryQueryData> => {
  if (waveId === null) {
    throw new Error("Memes quick vote discovery requires a wave id");
  }

  const pages: MemesQuickVoteDiscoveryPage[] = [];
  let nextPageToFetch: number | null = 1;

  while (nextPageToFetch !== null) {
    const page = await commonApiFetch<ApiDropsLeaderboardPage>({
      endpoint: `waves/${waveId}/leaderboard`,
      params: {
        page: `${nextPageToFetch}`,
        page_size: `${MEMES_QUICK_VOTE_DISCOVERY_PAGE_SIZE}`,
        sort: MEMES_QUICK_VOTE_DISCOVERY_SORT,
        sort_direction: MEMES_QUICK_VOTE_DISCOVERY_SORT_DIRECTION,
        unvoted_by_me: "true",
      },
    });

    pages.push({
      drops: page.drops.map((drop) =>
        buildMemesQuickVoteApiDrop(drop, page.wave)
      ),
      nextPage: page.next ? page.page + 1 : null,
      pageCount: page.count,
    });

    const snapshot = deriveMemesQuickVoteDiscoverySnapshot({
      enabled: true,
      pages,
      skippedDropIds,
      state: discoveryState,
    });

    if (
      !shouldFetchMemesQuickVotePage({
        replenishThreshold: MEMES_QUICK_VOTE_REPLENISH_THRESHOLD,
        state: snapshot,
      })
    ) {
      break;
    }

    nextPageToFetch = snapshot.nextPage;
  }

  return { pages };
};
