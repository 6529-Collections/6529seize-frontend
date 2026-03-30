import type { ApiUndiscoveredDrop } from "@/generated/models/ApiUndiscoveredDrop";
import { commonApiFetch } from "@/services/api/common-api";

export const MEMES_QUICK_VOTE_UNDISCOVERED_DROP_QUERY_KEY =
  "MEMES_QUICK_VOTE_UNDISCOVERED_DROP" as const;
export const MEMES_QUICK_VOTE_LOOKAHEAD_COUNT = 4 as const;

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
      context_profile: contextProfile ?? null,
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
