import type { QueryClient } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiUndiscoveredDrops } from "@/generated/models/ApiUndiscoveredDrops";
import type { ApiUndiscoveredDrop } from "@/generated/models/ApiUndiscoveredDrop";
import { commonApiFetch } from "@/services/api/common-api";

export const MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY =
  "MEMES_QUICK_VOTE_UNDISCOVERED_DROP" as const;
export const MEMES_QUICK_VOTE_LOOKAHEAD_COUNT = 4 as const;
export const MEMES_QUICK_VOTE_CACHE_TIME_MS = 60_000;

export const getMemesQuickVoteUndiscoveredDropQueryKey = ({
  contextProfile,
  proxyId,
  sessionId,
  skip,
  waveId,
}: {
  readonly contextProfile: string | null | undefined;
  readonly proxyId: string | null | undefined;
  readonly sessionId: number;
  readonly skip: number;
  readonly waveId: string | null;
}) =>
  [
    MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY,
    {
      context_profile: contextProfile?.trim() ?? null,
      proxyId: proxyId ?? null,
      sessionId,
      skip,
      waveId,
    },
  ] as const;

export const fetchMemesQuickVoteUndiscoveredDrop = async ({
  skip,
  waveId,
  signal,
}: {
  readonly skip: number;
  readonly waveId: string | null;
  readonly signal?: AbortSignal | undefined;
}): Promise<ApiUndiscoveredDrop> => {
  if (waveId === null) {
    throw new Error("Memes quick vote undiscovered drop requires a wave id");
  }

  return await commonApiFetch<ApiUndiscoveredDrop>({
    endpoint: `waves/${waveId}/undiscovered-drop`,
    params: skip > 0 ? { skip: `${skip}` } : undefined,
    signal,
  });
};

// Keep quick-vote's cached candidates consistent with votes cast elsewhere.
export const updateMemesQuickVoteCachedDrop = (
  queryClient: QueryClient,
  drop: ApiDrop,
  contextProfile: string | null | undefined
): void => {
  if (!contextProfile?.trim()) return;
  const footerKey = getMemesQuickVoteUndiscoveredDropQueryKey({
    contextProfile,
    proxyId: null,
    sessionId: 0,
    skip: 0,
    waveId: drop.wave.id,
  });
  const replacesFooter =
    queryClient.getQueryData<ApiUndiscoveredDrop>(footerKey)?.drop?.id ===
    drop.id;
  // Quick vote is unavailable to proxy sessions; never update their cache.
  queryClient.setQueriesData<ApiUndiscoveredDrop>(
    {
      queryKey: [
        MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY,
        {
          context_profile: contextProfile.trim(),
          proxyId: null,
        },
      ],
    },
    (current) =>
      current?.drop?.id === drop.id ? { ...current, drop } : current
  );
  if (replacesFooter) {
    void queryClient
      .invalidateQueries(
        { queryKey: footerKey, exact: true, refetchType: "active" },
        { cancelRefetch: false }
      )
      .catch(() => undefined);
  }
};

export const fetchMemesQuickVoteUndiscoveredDrops = async ({
  skip,
  limit,
  waveId,
  signal,
}: {
  readonly skip: number;
  readonly limit: number;
  readonly waveId: string;
  readonly signal?: AbortSignal | undefined;
}): Promise<ApiUndiscoveredDrops> =>
  await commonApiFetch<ApiUndiscoveredDrops>({
    endpoint: `waves/${waveId}/undiscovered-drops`,
    params: { skip: `${skip}`, limit: `${limit}` },
    signal,
  });
