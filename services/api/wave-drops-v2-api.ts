import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropAndWave } from "@/generated/models/ApiDropAndWave";
import type { ApiDropsLeaderboardPage } from "@/generated/models/ApiDropsLeaderboardPage";
import type { ApiDropsLeaderboardPageV2 } from "@/generated/models/ApiDropsLeaderboardPageV2";
import type { ApiDropMetadataResponse } from "@/generated/models/ApiDropMetadataResponse";
import type { ApiDropWithoutWave } from "@/generated/models/ApiDropWithoutWave";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type { ApiDropPartV2 } from "@/generated/models/ApiDropPartV2";
import type { ApiDropPoll } from "@/generated/models/ApiDropPoll";
import type { ApiDropPollVoteRequest } from "@/generated/models/ApiDropPollVoteRequest";
import type { ApiDropPollsPage } from "@/generated/models/ApiDropPollsPage";
import type { ApiDropPollVotersPage } from "@/generated/models/ApiDropPollVotersPage";
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
import type { ApiWavePoll } from "@/generated/models/ApiWavePoll";
import { ApiDropMainType } from "@/generated/models/ApiDropMainType";
import type { ApiPageSortDirection } from "@/generated/models/ApiPageSortDirection";
import {
  commonApiFetch,
  commonApiFetchWithRetry,
  commonApiPost,
} from "@/services/api/common-api";
import {
  createBasePart,
  getContextProfileContext,
  mapApiWaveOverviewToApiWaveMin,
  mapDropPartV2ToApiDropPart,
  mapDropReactionCountersV2,
  mapIdentityOverviewToProfileMin,
  mapMentionedWaves,
  mapPriorityMetadataV2ToDropMetadata,
  mapReplyToDrop,
  normalizeWaveMin,
} from "@/services/api/drop-v2-mappers";

type DropApprovalTiming = {
  readonly over_threshold_since_ms?: number | null;
};

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

interface FetchGlobalBoostedDropsV2Props {
  readonly limit: number;
  readonly sortDirection?: string | undefined;
  readonly sort?: string | undefined;
  readonly countOnlyBoostsAfter?: number | undefined;
  readonly minBoosts?: number | undefined;
  readonly signal?: AbortSignal | undefined;
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

export type WavePollsState = "OPEN" | "CLOSED";
export type WavePollsSort = "created_at" | "closing_time";
export type ApiWavePollDropRow = Partial<ApiWavePoll> & {
  readonly poll?: ApiDropPoll | undefined;
};
type ApiWavePollsPage = Omit<ApiDropPollsPage, "data"> & {
  readonly data: ApiWavePollDropRow[];
};

interface FetchWavePollsV2Props {
  readonly waveId: string;
  readonly page: number;
  readonly pageSize: number;
  readonly sortDirection: ApiPageSortDirection;
  readonly sort: WavePollsSort;
  readonly state?: WavePollsState | undefined;
  readonly signal?: AbortSignal | undefined;
}

interface FetchDropsV2ByIdsProps {
  readonly dropIds: readonly string[];
  readonly signal?: AbortSignal | undefined;
  readonly includeFullMetadata?: boolean | undefined;
  readonly includeTopRaters?: boolean | undefined;
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

const mergeMetadata = (
  priorityMetadata: readonly ApiDropMetadataResponse[],
  metadata: readonly ApiDropMetadataResponse[]
): ApiDropMetadataResponse[] => {
  const priorityKeys = new Set(
    priorityMetadata.map((item) => item.data_key.trim()).filter(Boolean)
  );

  return [
    ...priorityMetadata,
    ...metadata.filter((item) => !priorityKeys.has(item.data_key.trim())),
  ];
};

export const fetchDropMetadataByIdV2 = async ({
  dropId,
  priorityMetadata = [],
  signal,
}: {
  readonly dropId: string;
  readonly priorityMetadata?: readonly ApiDropMetadataResponse[] | undefined;
  readonly signal?: AbortSignal | undefined;
}): Promise<ApiDropMetadataResponse[]> => {
  try {
    const metadata = await commonApiFetch<ApiDropMetadataResponse[]>({
      endpoint: `v2/drops/${getDropEndpointId(getNormalizedDropId(dropId))}/metadata`,
      signal,
    });
    return mergeMetadata(priorityMetadata, metadata);
  } catch (error) {
    rethrowAbortFetchError(error);
    return [...priorityMetadata];
  }
};

const fetchDropMetadataV2 = async (
  drop: ApiDropV2,
  signal?: AbortSignal,
  includeFullMetadata = true
): Promise<ApiDropMetadataResponse[]> => {
  const priorityMetadata = mapPriorityMetadataV2ToDropMetadata(drop);

  if (!includeFullMetadata || !drop.submission_context?.has_metadata) {
    return priorityMetadata;
  }

  return fetchDropMetadataByIdV2({
    dropId: drop.id,
    priorityMetadata,
    signal,
  });
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

const getDropApprovalTiming = (drop: ApiDropV2): DropApprovalTiming => {
  const overThresholdSinceMs = drop.submission_context?.over_threshold_since_ms;

  return typeof overThresholdSinceMs === "number"
    ? { over_threshold_since_ms: overThresholdSinceMs }
    : {};
};

const hydrateDropV2 = async ({
  drop,
  wave,
  signal,
  includeFullMetadata = true,
  includeTopRaters = true,
}: {
  readonly drop: ApiDropV2;
  readonly wave: ApiWaveMin;
  readonly signal?: AbortSignal | undefined;
  readonly includeFullMetadata?: boolean | undefined;
  readonly includeTopRaters?: boolean | undefined;
}): Promise<ApiDrop> => {
  const [parts, metadata, topRaters] = await Promise.all([
    hydrateDropParts(drop, signal),
    fetchDropMetadataV2(drop, signal, includeFullMetadata),
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
    ...getDropApprovalTiming(drop),
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
    realtime_rating:
      voting?.total_votes_given ?? voting?.current_calculated_vote ?? 0,
    rating_prediction: voting?.predicted_final_vote ?? 0,
    top_raters: topRaters,
    raters_count: voting?.voters_count ?? 0,
    context_profile_context: getContextProfileContext(drop),
    subscribed_actions: [],
    is_signed: drop.is_signed,
    reactions: mapDropReactionCountersV2(drop),
    boosts: drop.boosts,
    is_additional_action_promised:
      drop.submission_context?.is_additional_action_promised ?? false,
    hide_link_preview: drop.hide_link_preview,
    ...(drop.poll ? { poll: drop.poll } : {}),
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
    ...getDropApprovalTiming(drop),
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
    metadata: mapPriorityMetadataV2ToDropMetadata(drop),
    rating: voting?.current_calculated_vote ?? 0,
    realtime_rating:
      voting?.total_votes_given ?? voting?.current_calculated_vote ?? 0,
    rating_prediction: voting?.predicted_final_vote ?? 0,
    top_raters: [],
    raters_count: voting?.voters_count ?? 0,
    context_profile_context: getContextProfileContext(drop),
    subscribed_actions: [],
    is_signed: drop.is_signed,
    reactions: mapDropReactionCountersV2(drop),
    boosts: drop.boosts,
    is_additional_action_promised:
      drop.submission_context?.is_additional_action_promised ?? false,
    hide_link_preview: drop.hide_link_preview,
    ...(drop.poll ? { poll: drop.poll } : {}),
    nft_links: drop.nft_links ?? [],
  };
};

const hydrateDropsV2 = async ({
  drops,
  wave,
  signal,
  includeFullMetadata = false,
  includeTopRaters = false,
}: {
  readonly drops: ApiDropV2[];
  readonly wave: ApiWaveMin;
  readonly signal?: AbortSignal | undefined;
  readonly includeFullMetadata?: boolean | undefined;
  readonly includeTopRaters?: boolean | undefined;
}): Promise<ApiDrop[]> =>
  Promise.all(
    drops.map((drop) =>
      hydrateDropV2({
        drop,
        wave,
        signal,
        includeFullMetadata,
        includeTopRaters,
      })
    )
  );

const hydrateDropsWithEmbeddedWavesV2 = async ({
  drops,
  signal,
  includeFullMetadata = false,
  includeTopRaters = false,
}: {
  readonly drops: ApiDropV2[];
  readonly signal?: AbortSignal | undefined;
  readonly includeFullMetadata?: boolean | undefined;
  readonly includeTopRaters?: boolean | undefined;
}): Promise<ApiDrop[]> => {
  const dropsWithWaves = drops
    .map((drop) => {
      if (!drop.wave) {
        return null;
      }

      return {
        drop,
        wave: mapApiWaveOverviewToApiWaveMin(drop.wave),
      };
    })
    .filter(
      (item): item is { readonly drop: ApiDropV2; readonly wave: ApiWaveMin } =>
        item !== null
    );

  const results = await Promise.allSettled(
    dropsWithWaves.map(({ drop, wave }) =>
      hydrateDropV2({
        drop,
        wave,
        signal,
        includeFullMetadata,
        includeTopRaters,
      })
    )
  );

  return results
    .filter(
      (result): result is PromiseFulfilledResult<ApiDrop> =>
        result.status === "fulfilled"
    )
    .map((result) => result.value);
};

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

export async function fetchWavePollsV2({
  waveId,
  page,
  pageSize,
  sortDirection,
  sort,
  state,
  signal,
}: FetchWavePollsV2Props): Promise<ApiWavePollsPage> {
  const params: Record<string, string> = {
    page: page.toString(),
    page_size: pageSize.toString(),
    sort_direction: sortDirection,
    sort,
  };

  if (state) {
    params["state"] = state;
  }

  return commonApiFetch<ApiWavePollsPage>({
    endpoint: `v2/waves/${waveId}/polls`,
    params,
    signal,
  });
}

export async function fetchDropV2ById(
  dropId: string,
  signal?: AbortSignal,
  options?: {
    readonly includeFullMetadata?: boolean | undefined;
    readonly includeTopRaters?: boolean | undefined;
  }
): Promise<ApiDrop> {
  const data = await fetchDropAndWaveV2(dropId, signal);
  const wave = mapApiWaveOverviewToApiWaveMin(data.wave);
  return hydrateDropV2({
    drop: data.drop,
    wave,
    signal,
    includeFullMetadata: options?.includeFullMetadata ?? false,
    includeTopRaters: options?.includeTopRaters ?? false,
  });
}

export async function voteDropPollV2({
  drop,
  options,
}: {
  readonly drop: ApiDrop;
  readonly options: readonly number[];
}): Promise<ApiDrop> {
  const response = await commonApiPost<ApiDropPollVoteRequest, ApiDropV2>({
    endpoint: `v2/drops/${getDropEndpointId(getNormalizedDropId(drop.id))}/poll/vote`,
    body: {
      options,
    } as unknown as ApiDropPollVoteRequest,
  });

  return hydrateDropV2({
    drop: response,
    wave: normalizeWaveMin(drop.wave),
    includeFullMetadata: false,
    includeTopRaters: false,
  });
}

export async function fetchDropPollOptionVotersV2({
  dropId,
  optionNo,
  page,
  pageSize,
  signal,
}: {
  readonly dropId: string;
  readonly optionNo: number;
  readonly page: number;
  readonly pageSize: number;
  readonly signal?: AbortSignal | undefined;
}): Promise<ApiDropPollVotersPage> {
  return commonApiFetch<ApiDropPollVotersPage>({
    endpoint: `v2/drops/${getDropEndpointId(
      getNormalizedDropId(dropId)
    )}/poll/${optionNo}/voters`,
    params: {
      page: page.toString(),
      page_size: pageSize.toString(),
    },
    signal,
  });
}

export async function fetchDropsV2ByIds({
  dropIds,
  signal,
  includeFullMetadata = false,
  includeTopRaters = false,
}: FetchDropsV2ByIdsProps): Promise<ApiDrop[]> {
  if (dropIds.length === 0) {
    return [];
  }

  const response = await commonApiFetch<ApiDropV2PageWithoutCount>({
    endpoint: "v2/drops",
    params: {
      ids: dropIds.map(getNormalizedDropId).join(","),
      page_size: dropIds.length.toString(),
    },
    signal,
  });

  return hydrateDropsWithEmbeddedWavesV2({
    drops: response.data,
    signal,
    includeFullMetadata,
    includeTopRaters,
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

export async function fetchGlobalBoostedDropsV2({
  limit,
  sortDirection = "DESC",
  sort = "boosts",
  countOnlyBoostsAfter,
  minBoosts,
  signal,
}: FetchGlobalBoostedDropsV2Props): Promise<ApiDrop[]> {
  const params: Record<string, string> = {
    sort,
    sort_direction: sortDirection,
    page_size: limit.toString(),
  };

  if (countOnlyBoostsAfter !== undefined) {
    params["count_only_boosts_after"] = countOnlyBoostsAfter.toString();
  }

  if (minBoosts !== undefined) {
    params["min_boosts"] = minBoosts.toString();
  }

  const response = await commonApiFetch<ApiDropV2Page>({
    endpoint: "v2/boosted-drops",
    params,
    signal,
  });

  return hydrateDropsWithEmbeddedWavesV2({
    drops: response.data,
    signal,
  });
}
