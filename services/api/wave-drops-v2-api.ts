import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropAndWave } from "@/generated/models/ApiDropAndWave";
import type { ApiDropsLeaderboardPage } from "@/generated/models/ApiDropsLeaderboardPage";
import type { ApiDropsLeaderboardPageV2 } from "@/generated/models/ApiDropsLeaderboardPageV2";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type { ApiDropPartV2 } from "@/generated/models/ApiDropPartV2";
import type { ApiDropRater } from "@/generated/models/ApiDropRater";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import type { ApiDropReactionV2 } from "@/generated/models/ApiDropReactionV2";
import type { ApiDropSearchStrategy } from "@/generated/models/ApiDropSearchStrategy";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ApiDropV2 } from "@/generated/models/ApiDropV2";
import type { ApiDropV2Page } from "@/generated/models/ApiDropV2Page";
import type { ApiDropV2PageWithoutCount } from "@/generated/models/ApiDropV2PageWithoutCount";
import type { ApiDropVotersPage } from "@/generated/models/ApiDropVotersPage";
import type { ApiDropWithoutWavesPageWithoutCount } from "@/generated/models/ApiDropWithoutWavesPageWithoutCount";
import { ApiSubmissionDropStatus } from "@/generated/models/ApiSubmissionDropStatus";
import type { ApiWaveDropsFeed } from "@/generated/models/ApiWaveDropsFeed";
import type { ApiWaveMin } from "@/generated/models/ApiWaveMin";
import type { ApiWaveDropsFeedV2 } from "@/generated/models/ApiWaveDropsFeedV2";
import type { ApiWave } from "@/generated/models/ApiWave";
import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import {
  commonApiFetch,
  commonApiFetchWithRetry,
} from "@/services/api/common-api";
import {
  createBasePart,
  getContextProfileContext,
  mapApiWaveOverviewToApiWaveMin,
  mapDropPartV2ToApiDropPart,
  mapDropReactionCountersV2,
  mapIdentityOverviewToProfileMin,
  mapMentionedWaves,
  mapReplyToDrop,
  normalizeWaveMin,
} from "@/services/api/drop-v2-mappers";

const DEFAULT_RETRY_OPTIONS = {
  maxRetries: 2,
  initialDelayMs: 300,
  backoffFactor: 1.5,
  jitter: 0.1,
} as const;

interface FetchWaveDropsV2Props {
  readonly waveId: string;
  readonly limit: number;
  readonly serialNoLimit?: number | null | undefined;
  readonly searchStrategy?: ApiDropSearchStrategy | undefined;
  readonly dropType?: ApiDropType | undefined;
  readonly signal?: AbortSignal | undefined;
  readonly headers?: Record<string, string> | undefined;
  readonly withRetry?: boolean | undefined;
}

interface FetchBoostedDropsV2Props {
  readonly waveId: string;
  readonly wave: ApiWave | ApiWaveMin;
  readonly limit: number;
  readonly sortDirection?: string | undefined;
  readonly sort?: string | undefined;
  readonly countOnlyBoostsAfter?: number | undefined;
}

interface FetchDropRepliesV2Props {
  readonly parentDropId: string;
  readonly page: number;
  readonly pageSize: number;
  readonly wave?: ApiWave | ApiWaveMin | undefined;
  readonly signal?: AbortSignal | undefined;
}

interface FetchWaveLeaderboardV2Props {
  readonly waveId: string;
  readonly params: Record<string, string>;
  readonly signal?: AbortSignal | undefined;
}

interface FetchWaveDropsSearchV2Props {
  readonly wave: ApiWave | ApiWaveMin;
  readonly term: string;
  readonly page: number;
  readonly size: number;
  readonly signal?: AbortSignal | undefined;
}

export type ApiWaveDropsV2PageFeed = ApiWaveDropsFeed & {
  readonly count: number;
  readonly page: number;
  readonly next: boolean;
};

const getDropEndpointId = (dropId: string): string =>
  encodeURIComponent(dropId);

const isAbortFetchError = (error: unknown): boolean => {
  if (error instanceof DOMException && error.name === "AbortError") {
    return true;
  }

  if (error instanceof Error && error.name === "AbortError") {
    return true;
  }

  const maybeAbortError = error as
    | { readonly code?: unknown; readonly name?: unknown }
    | null
    | undefined;

  return (
    maybeAbortError?.name === "AbortError" ||
    maybeAbortError?.code === "ERR_CANCELED"
  );
};

const rethrowAbortFetchError = (error: unknown) => {
  if (isAbortFetchError(error)) {
    throw error;
  }
};

const fetchDropPartV2 = async ({
  dropId,
  partNo,
  signal,
}: {
  readonly dropId: string;
  readonly partNo: number;
  readonly signal?: AbortSignal | undefined;
}): Promise<ApiDropPartV2 | null> => {
  try {
    return await commonApiFetch<ApiDropPartV2>({
      endpoint: `v2/drops/${getDropEndpointId(dropId)}/parts/${partNo}`,
      signal,
    });
  } catch (error) {
    rethrowAbortFetchError(error);
    return null;
  }
};

const hydrateDropParts = async (
  drop: ApiDropV2,
  signal?: AbortSignal
): Promise<ApiDropPart[]> => {
  const basePart = createBasePart(drop);
  const partsCount = Math.max(1, drop.parts_count || 1);

  if (partsCount <= 1) {
    return [basePart];
  }

  const fetchedParts = await Promise.all(
    Array.from({ length: partsCount - 1 }, (_, index) => {
      const partNo = index + 2;
      return fetchDropPartV2({ dropId: drop.id, partNo, signal });
    })
  );

  const extraParts = fetchedParts
    .map((part) => (part ? mapDropPartV2ToApiDropPart(part) : null))
    .filter((part): part is ApiDropPart => !!part);

  return [basePart, ...extraParts];
};

export const fetchDropReactionDetailsV2 = async (
  dropId: string,
  signal?: AbortSignal
): Promise<ApiDropReaction[]> => {
  const normalizedDropId = dropId.trim();
  if (!normalizedDropId) {
    return [];
  }

  try {
    const reactions = await commonApiFetch<ApiDropReactionV2[]>({
      endpoint: `v2/drops/${getDropEndpointId(normalizedDropId)}/reactions`,
      signal,
    });

    return reactions.map((reaction) => ({
      reaction: reaction.reaction,
      profiles: reaction.reactors.map(mapIdentityOverviewToProfileMin),
    }));
  } catch (error) {
    rethrowAbortFetchError(error);
    return [];
  }
};

const fetchDropMetadataV2 = async (
  drop: ApiDropV2,
  signal?: AbortSignal
): Promise<ApiDropMetadataResponse[]> => {
  if (!drop.submission_context?.has_metadata) {
    return [];
  }

  try {
    return await commonApiFetch<ApiDropMetadataResponse[]>({
      endpoint: `v2/drops/${getDropEndpointId(drop.id)}/metadata`,
      signal,
    });
  } catch (error) {
    rethrowAbortFetchError(error);
    return [];
  }
};

const fetchTopRatersV2 = async (
  drop: ApiDropV2,
  signal?: AbortSignal
): Promise<ApiDropRater[]> => {
  const votersCount = drop.submission_context?.voting.voters_count ?? 0;
  if (votersCount <= 0) {
    return [];
  }

  try {
    const voters = await commonApiFetch<ApiDropVotersPage>({
      endpoint: `v2/drops/${getDropEndpointId(drop.id)}/votes`,
      params: {
        page_size: "5",
        page: "1",
        sort_direction: "DESC",
      },
      signal,
    });

    return voters.data.map((voter) => ({
      profile: mapIdentityOverviewToProfileMin(voter.voter),
      rating: voter.vote,
    }));
  } catch (error) {
    rethrowAbortFetchError(error);
    return [];
  }
};

const getDropType = (drop: ApiDropV2): ApiDropType => {
  if (drop.drop_type === ApiDropMainType.Chat) {
    return ApiDropType.Chat;
  }

  if (drop.submission_context?.status === ApiSubmissionDropStatus.Winner) {
    return ApiDropType.Winner;
  }

  return ApiDropType.Participatory;
};

const getWinningContext = (drop: ApiDropV2) => {
  const voting = drop.submission_context?.voting;
  if (drop.submission_context?.status !== ApiSubmissionDropStatus.Winner) {
    return undefined;
  }

  return {
    place: voting?.place ?? 0,
    awards: [],
    decision_time: 0,
    sale_time: null,
    sale_price: null,
    sale_price_currency: null,
  };
};

const hydrateDropV2 = async ({
  drop,
  wave,
  signal,
  includeTopRaters = true,
}: {
  readonly drop: ApiDropV2;
  readonly wave: ApiWaveMin;
  readonly signal?: AbortSignal | undefined;
  readonly includeTopRaters?: boolean | undefined;
}): Promise<ApiDrop> => {
  const [parts, metadata, topRaters] = await Promise.all([
    hydrateDropParts(drop, signal),
    fetchDropMetadataV2(drop, signal),
    includeTopRaters ? fetchTopRatersV2(drop, signal) : Promise.resolve([]),
  ]);
  const voting = drop.submission_context?.voting;
  const dropType = getDropType(drop);
  const winningContext = getWinningContext(drop);
  const replyTo = mapReplyToDrop(drop);

  return {
    id: drop.id,
    serial_no: drop.serial_no,
    drop_type: dropType,
    rank: voting?.place ?? null,
    ...(winningContext ? { winning_context: winningContext } : {}),
    wave,
    ...(replyTo ? { reply_to: replyTo } : {}),
    author: mapIdentityOverviewToProfileMin(drop.author),
    created_at: drop.created_at,
    updated_at: drop.updated_at ?? null,
    title: drop.title ?? null,
    parts,
    parts_count: drop.parts_count,
    referenced_nfts: drop.referenced_nfts ?? [],
    mentioned_users: drop.mentioned_users ?? [],
    mentioned_groups: drop.mentioned_groups ?? [],
    mentioned_waves: mapMentionedWaves(drop, wave),
    metadata,
    rating: voting?.current_calculated_vote ?? 0,
    realtime_rating: voting?.current_calculated_vote ?? 0,
    rating_prediction: voting?.predicted_final_vote ?? 0,
    top_raters: topRaters,
    raters_count: voting?.voters_count ?? 0,
    context_profile_context: getContextProfileContext(drop),
    subscribed_actions: [],
    is_signed: drop.is_signed,
    reactions: mapDropReactionCountersV2(drop),
    boosts: drop.boosts,
    hide_link_preview: drop.hide_link_preview,
    nft_links: drop.nft_links ?? [],
  };
};

export const mapLeaderboardDropV2 = ({
  drop,
  wave,
}: {
  readonly drop: ApiDropV2;
  readonly wave: ApiWaveMin;
}): ApiDropWithoutWave => {
  const voting = drop.submission_context?.voting;
  const dropType = getDropType(drop);
  const winningContext = getWinningContext(drop);
  const replyTo = mapReplyToDrop(drop);

  return {
    id: drop.id,
    serial_no: drop.serial_no,
    drop_type: dropType,
    rank: voting?.place ?? null,
    ...(winningContext ? { winning_context: winningContext } : {}),
    ...(replyTo ? { reply_to: replyTo } : {}),
    author: mapIdentityOverviewToProfileMin(drop.author),
    created_at: drop.created_at,
    updated_at: drop.updated_at ?? null,
    title: drop.title ?? null,
    parts: [createBasePart(drop)],
    parts_count: 1,
    referenced_nfts: drop.referenced_nfts ?? [],
    mentioned_users: drop.mentioned_users ?? [],
    mentioned_groups: drop.mentioned_groups ?? [],
    mentioned_waves: mapMentionedWaves(drop, wave),
    metadata: [],
    rating: voting?.current_calculated_vote ?? 0,
    realtime_rating: voting?.current_calculated_vote ?? 0,
    rating_prediction: voting?.predicted_final_vote ?? 0,
    top_raters: [],
    raters_count: voting?.voters_count ?? 0,
    context_profile_context: getContextProfileContext(drop),
    subscribed_actions: [],
    is_signed: drop.is_signed,
    reactions: mapDropReactionCountersV2(drop),
    boosts: drop.boosts,
    hide_link_preview: drop.hide_link_preview,
    nft_links: drop.nft_links ?? [],
  };
};

const hydrateDropsV2 = async ({
  drops,
  wave,
  signal,
}: {
  readonly drops: ApiDropV2[];
  readonly wave: ApiWaveMin;
  readonly signal?: AbortSignal | undefined;
}): Promise<ApiDrop[]> =>
  Promise.all(drops.map((drop) => hydrateDropV2({ drop, wave, signal })));

const getNormalizedDropId = (dropId: string): string => {
  const normalizedDropId = dropId.trim();
  if (!normalizedDropId) {
    throw new Error("Cannot fetch drop without a drop id");
  }
  return normalizedDropId;
};

const fetchDropAndWaveV2 = async (
  dropId: string,
  signal?: AbortSignal
): Promise<ApiDropAndWave> =>
  commonApiFetch<ApiDropAndWave>({
    endpoint: `v2/drops/${getDropEndpointId(getNormalizedDropId(dropId))}`,
    signal,
  });

export async function fetchWaveDropsFeedV2({
  waveId,
  limit,
  serialNoLimit,
  searchStrategy,
  dropType,
  signal,
  headers,
  withRetry = false,
}: FetchWaveDropsV2Props): Promise<ApiWaveDropsFeed> {
  const params: Record<string, string> = {
    limit: limit.toString(),
  };

  if (typeof serialNoLimit === "number") {
    params["serial_no_limit"] = `${serialNoLimit}`;
  }

  if (searchStrategy !== undefined) {
    params["search_strategy"] = searchStrategy;
  }

  if (dropType !== undefined) {
    params["drop_type"] = dropType;
  }

  const request = {
    endpoint: `v2/waves/${waveId}/drops`,
    params,
    signal,
    headers,
  };

  const data = withRetry
    ? await commonApiFetchWithRetry<ApiWaveDropsFeedV2>({
        ...request,
        retryOptions: DEFAULT_RETRY_OPTIONS,
      })
    : await commonApiFetch<ApiWaveDropsFeedV2>(request);

  const wave = mapApiWaveOverviewToApiWaveMin(data.wave);
  const drops = await hydrateDropsV2({
    drops: data.drops,
    wave,
    signal,
  });

  return {
    wave,
    drops,
  };
}

export async function fetchWaveLeaderboardV2({
  waveId,
  params,
  signal,
}: FetchWaveLeaderboardV2Props): Promise<ApiDropsLeaderboardPage> {
  const data = await commonApiFetch<ApiDropsLeaderboardPageV2>({
    endpoint: `v2/waves/${waveId}/leaderboard`,
    params,
    signal,
  });

  return {
    wave: data.wave,
    drops: data.drops.map((drop) =>
      mapLeaderboardDropV2({ drop, wave: data.wave })
    ),
    count: data.count,
    page: data.page,
    next: data.next,
  };
}

export async function fetchWaveDropsSearchV2({
  wave,
  term,
  page,
  size,
  signal,
}: FetchWaveDropsSearchV2Props): Promise<ApiDropWithoutWavesPageWithoutCount> {
  const waveMin = normalizeWaveMin(wave);
  const response = await commonApiFetch<ApiDropV2PageWithoutCount>({
    endpoint: `v2/waves/${waveMin.id}/search`,
    params: {
      term,
      page: page.toString(),
      size: size.toString(),
    },
    signal,
  });

  return {
    data: response.data.map((drop) =>
      mapLeaderboardDropV2({ drop, wave: waveMin })
    ),
    page: response.page,
    next: response.next,
  };
}

export async function fetchDropV2ById(
  dropId: string,
  signal?: AbortSignal,
  options?: { readonly includeTopRaters?: boolean | undefined }
): Promise<ApiDrop> {
  const data = await fetchDropAndWaveV2(dropId, signal);
  const wave = mapApiWaveOverviewToApiWaveMin(data.wave);
  return hydrateDropV2({
    drop: data.drop,
    wave,
    signal,
    includeTopRaters: options?.includeTopRaters,
  });
}

export async function fetchDropRepliesV2({
  parentDropId,
  page,
  pageSize,
  wave,
  signal,
}: FetchDropRepliesV2Props): Promise<ApiWaveDropsV2PageFeed> {
  const normalizedParentDropId = getNormalizedDropId(parentDropId);
  const response = await commonApiFetch<ApiDropV2Page>({
    endpoint: "v2/drops",
    params: {
      parent_drop_id: normalizedParentDropId,
      page: page.toString(),
      page_size: pageSize.toString(),
    },
    signal,
  });

  const waveMin = wave
    ? normalizeWaveMin(wave)
    : mapApiWaveOverviewToApiWaveMin(
        (await fetchDropAndWaveV2(normalizedParentDropId, signal)).wave
      );
  const drops = await hydrateDropsV2({
    drops: response.data,
    wave: waveMin,
    signal,
  });

  return {
    wave: waveMin,
    drops,
    count: response.count,
    page: response.page,
    next: response.next,
  };
}

export async function fetchBoostedDropsV2({
  waveId,
  wave,
  limit,
  sortDirection = "DESC",
  sort = "boosts",
  countOnlyBoostsAfter,
}: FetchBoostedDropsV2Props): Promise<ApiDrop[]> {
  const params: Record<string, string> = {
    wave_id: waveId,
    sort,
    sort_direction: sortDirection,
    page_size: limit.toString(),
  };

  if (countOnlyBoostsAfter !== undefined) {
    params["count_only_boosts_after"] = countOnlyBoostsAfter.toString();
  }

  const response = await commonApiFetch<ApiDropV2Page>({
    endpoint: "v2/boosted-drops",
    params,
  });

  return hydrateDropsV2({
    drops: response.data,
    wave: normalizeWaveMin(wave),
  });
}
