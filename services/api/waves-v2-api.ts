import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiCreateWaveMetadataRequest } from "@/generated/models/ApiCreateWaveMetadataRequest";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import type { ApiWaveMetadata } from "@/generated/models/ApiWaveMetadata";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import type { ApiWaveOverviewPage } from "@/generated/models/ApiWaveOverviewPage";
import type { ApiWaveScoreSort } from "@/generated/models/ApiWaveScoreSort";
import type { ApiWaveVisibilityTier } from "@/generated/models/ApiWaveVisibilityTier";
import { ApiSubwavesSort } from "@/generated/models/ApiSubwavesSort";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWavesV2ListType } from "@/generated/models/ApiWavesV2ListType";
import type { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import type { ApiWavesPinFilter } from "@/generated/models/ApiWavesPinFilter";
import type { SidebarWave, SidebarWavesPage } from "@/types/waves.types";
import {
  commonApiDelete,
  commonApiFetch,
  commonApiPost,
} from "@/services/api/common-api";

interface FetchWavesV2PageProps {
  readonly page: number;
  readonly pageSize: number;
  readonly view?: ApiWavesV2ListType | undefined;
  readonly overviewType?: ApiWavesOverviewType | undefined;
  readonly following?: boolean | undefined;
  readonly directMessage?: boolean | undefined;
  readonly pinned?: ApiWavesPinFilter | undefined;
  readonly excludeFollowed?: boolean | undefined;
  readonly identity?: string | undefined;
  readonly scoreSort?: ApiWaveScoreSort | undefined;
  readonly minVisibilityScore?: number | undefined;
  readonly minQualityScore?: number | undefined;
  readonly minHotnessScore?: number | undefined;
  readonly minRepSortScore?: number | undefined;
  readonly visibilityTier?: ApiWaveVisibilityTier | undefined;
  readonly name?: string | undefined;
  readonly author?: string | undefined;
  readonly serialNoLessThan?: number | undefined;
  readonly groupId?: string | undefined;
  readonly headers?: Record<string, string> | undefined;
}

interface FetchWaveSubwavesPageProps {
  readonly parentWaveId: string;
  readonly page?: number | undefined;
  readonly pageSize?: number | undefined;
  readonly sort?: ApiSubwavesSort | undefined;
}

export interface WaveSubwavesQueryKeyParams {
  readonly parent_wave_id: string;
  readonly page: number;
  readonly page_size: number;
  readonly sort: ApiSubwavesSort;
  readonly viewer_identity?: string | undefined;
}

export interface WavesV2OverviewQueryKeyParams {
  readonly view: ApiWavesV2ListType.Overview;
  readonly page_size: number;
  readonly overview_type: ApiWavesOverviewType;
  readonly only_waves_followed_by_authenticated_user: boolean;
  readonly direct_message?: boolean | undefined;
  readonly pinned?: ApiWavesPinFilter | undefined;
  readonly exclude_followed?: boolean | undefined;
  readonly score_sort?: ApiWaveScoreSort | undefined;
  readonly min_visibility_score?: number | undefined;
  readonly min_quality_score?: number | undefined;
  readonly min_hotness_score?: number | undefined;
  readonly min_rep_sort_score?: number | undefined;
  readonly visibility_tier?: ApiWaveVisibilityTier | undefined;
  readonly viewer_identity?: string | undefined;
}

export function getWavesV2OverviewQueryKeyParams({
  overviewType,
  pageSize,
  following = false,
  directMessage,
  pinned,
  excludeFollowed,
  scoreSort,
  minVisibilityScore,
  minQualityScore,
  minHotnessScore,
  minRepSortScore,
  visibilityTier,
  viewerIdentityKey,
}: {
  readonly overviewType: ApiWavesOverviewType;
  readonly pageSize: number;
  readonly following?: boolean | undefined;
  readonly directMessage?: boolean | undefined;
  readonly pinned?: ApiWavesPinFilter | undefined;
  readonly excludeFollowed?: boolean | undefined;
  readonly scoreSort?: ApiWaveScoreSort | undefined;
  readonly minVisibilityScore?: number | undefined;
  readonly minQualityScore?: number | undefined;
  readonly minHotnessScore?: number | undefined;
  readonly minRepSortScore?: number | undefined;
  readonly visibilityTier?: ApiWaveVisibilityTier | undefined;
  readonly viewerIdentityKey?: string | null | undefined;
}): WavesV2OverviewQueryKeyParams {
  const normalizedViewerIdentityKey =
    viewerIdentityKey?.trim().toLowerCase() ?? null;

  return {
    view: ApiWavesV2ListType.Overview,
    page_size: pageSize,
    overview_type: overviewType,
    only_waves_followed_by_authenticated_user: following,
    ...(directMessage === undefined ? {} : { direct_message: directMessage }),
    ...(pinned === undefined ? {} : { pinned }),
    ...(excludeFollowed === undefined
      ? {}
      : { exclude_followed: excludeFollowed }),
    ...(scoreSort === undefined ? {} : { score_sort: scoreSort }),
    ...(minVisibilityScore === undefined
      ? {}
      : { min_visibility_score: minVisibilityScore }),
    ...(minQualityScore === undefined
      ? {}
      : { min_quality_score: minQualityScore }),
    ...(minHotnessScore === undefined
      ? {}
      : { min_hotness_score: minHotnessScore }),
    ...(minRepSortScore === undefined
      ? {}
      : { min_rep_sort_score: minRepSortScore }),
    ...(visibilityTier === undefined
      ? {}
      : { visibility_tier: visibilityTier }),
    ...(normalizedViewerIdentityKey
      ? { viewer_identity: normalizedViewerIdentityKey }
      : {}),
  };
}

const getWaveOverviewContext = (wave: ApiWaveOverview) =>
  wave.context_profile_context;

const mapApiWaveOverviewToSidebarWave = (
  wave: ApiWaveOverview
): SidebarWave => {
  const context = getWaveOverviewContext(wave);

  return {
    id: wave.id,
    name: wave.name,
    createdAt: wave.created_at,
    creator: wave.creator,
    type: wave.has_competition ? ApiWaveType.Rank : ApiWaveType.Chat,
    picture: wave.pfp ?? null,
    contributors:
      wave.contributors?.map((contributor) => ({
        pfp: contributor.pfp ?? "",
        identity: contributor.handle ?? null,
      })) ?? [],
    isDirectMessage: wave.is_dm_wave,
    hasCompetition: wave.has_competition,
    parentWaveId: wave.parent_wave?.id ?? null,
    hasSubwaves: wave.has_subwaves ?? false,
    descriptionDrop: {
      contents: wave.description_drop.contents ?? null,
      media: wave.description_drop.media ?? [],
    },
    totalDropsCount: wave.total_drops_count,
    isPrivate: wave.is_private,
    latestDropTimestamp: wave.last_drop_time,
    firstUnreadDropSerialNo: context?.first_unread_drop_serial_no ?? null,
    unreadDropsCount: context?.unread_drops ?? 0,
    latestReadTimestamp: 0,
    pinned: context?.pinned ?? false,
    muted: context?.muted ?? false,
    subscribed: context?.subscribed ?? false,
    waveRep: wave.wave_rep ?? null,
    waveScore: wave.wave_score ?? null,
  };
};

const getApiWaveDescriptionDrop = (
  wave: ApiWave
): { contents: string | null; media: ApiDropMedia[] } => {
  const descriptionParts = wave.description_drop.parts;
  const contents =
    descriptionParts
      .map((part) => part.content?.trim())
      .filter((content): content is string => Boolean(content))
      .join("\n\n") || null;

  return {
    contents,
    media: descriptionParts.flatMap((part) => part.media),
  };
};

export const mapApiWaveToSidebarWave = (wave: ApiWave): SidebarWave => {
  const isDirectMessage =
    wave.wave.type === ApiWaveType.Chat &&
    Boolean(wave.chat.scope.group?.is_direct_message);

  return {
    id: wave.id,
    name: wave.name,
    createdAt: wave.created_at,
    creator: null,
    type: wave.wave.type,
    picture: wave.picture,
    contributors: wave.contributors_overview.map((contributor) => ({
      pfp: contributor.contributor_pfp,
      identity: contributor.contributor_identity,
    })),
    isDirectMessage,
    hasCompetition: wave.wave.type !== ApiWaveType.Chat,
    parentWaveId: wave.parent_wave?.id ?? null,
    hasSubwaves: wave.has_subwaves ?? false,
    descriptionDrop: getApiWaveDescriptionDrop(wave),
    totalDropsCount: wave.metrics.drops_count,
    isPrivate: Boolean(wave.visibility.scope.group) && !isDirectMessage,
    latestDropTimestamp: wave.metrics.latest_drop_timestamp,
    firstUnreadDropSerialNo: wave.metrics.first_unread_drop_serial_no ?? null,
    unreadDropsCount: wave.metrics.your_unread_drops_count,
    latestReadTimestamp: wave.metrics.your_latest_read_timestamp,
    pinned: wave.pinned,
    muted: wave.metrics.muted,
    subscribed: wave.subscribed_actions.length > 0,
    waveRep: wave.wave_rep ?? null,
    waveScore: wave.wave_score ?? null,
  };
};

export async function fetchWavesV2Page({
  page,
  pageSize,
  view = ApiWavesV2ListType.Overview,
  overviewType,
  following = false,
  directMessage,
  pinned,
  excludeFollowed,
  identity,
  scoreSort,
  minVisibilityScore,
  minQualityScore,
  minHotnessScore,
  minRepSortScore,
  visibilityTier,
  name,
  author,
  serialNoLessThan,
  groupId,
  headers,
}: FetchWavesV2PageProps): Promise<SidebarWavesPage> {
  const params: Record<string, string> = {
    view,
    page: `${page}`,
    page_size: `${pageSize}`,
  };

  if (view === ApiWavesV2ListType.Overview && overviewType !== undefined) {
    params["overview_type"] = overviewType;
    params["only_waves_followed_by_authenticated_user"] = `${following}`;
  }

  if (directMessage !== undefined) {
    params["direct_message"] = `${directMessage}`;
  }

  if (pinned !== undefined) {
    params["pinned"] = pinned;
  }

  if (excludeFollowed === true) {
    params["exclude_followed"] = "true";
  }

  if (identity !== undefined) {
    params["identity"] = identity;
  }

  if (scoreSort !== undefined) {
    params["score_sort"] = scoreSort;
  }

  if (minVisibilityScore !== undefined) {
    params["min_visibility_score"] = `${minVisibilityScore}`;
  }

  if (minQualityScore !== undefined) {
    params["min_quality_score"] = `${minQualityScore}`;
  }

  if (minHotnessScore !== undefined) {
    params["min_hotness_score"] = `${minHotnessScore}`;
  }

  if (minRepSortScore !== undefined) {
    params["min_rep_sort_score"] = `${minRepSortScore}`;
  }

  if (visibilityTier !== undefined) {
    params["visibility_tier"] = visibilityTier;
  }

  if (name !== undefined) {
    params["name"] = name;
  }

  if (author !== undefined) {
    params["author"] = author;
  }

  if (serialNoLessThan !== undefined) {
    params["serial_no_less_than"] = `${serialNoLessThan}`;
  }

  if (groupId !== undefined) {
    params["group_id"] = groupId;
  }

  const response = await commonApiFetch<ApiWaveOverviewPage>({
    endpoint: "v2/waves",
    params,
    headers,
  });

  return {
    waves: response.data.map(mapApiWaveOverviewToSidebarWave),
    page: response.page,
    next: response.next,
  };
}

export async function fetchWaveById({
  waveId,
  headers,
}: {
  readonly waveId: string;
  readonly headers?: Record<string, string> | undefined;
}): Promise<ApiWave> {
  return await commonApiFetch<ApiWave>({
    endpoint: `waves/${waveId}`,
    headers,
  });
}

export async function searchWavesV2ByName({
  name,
  pageSize = 5,
  headers,
}: {
  readonly name: string;
  readonly pageSize?: number | undefined;
  readonly headers?: Record<string, string> | undefined;
}): Promise<SidebarWave[]> {
  const page = await fetchWavesV2Page({
    view: ApiWavesV2ListType.Search,
    page: 1,
    pageSize,
    directMessage: false,
    name,
    headers,
  });

  return page.waves;
}

async function searchLegacyWavesByName({
  endpoint,
  name,
  pageSize,
  headers,
}: {
  readonly endpoint: "waves" | "waves-public";
  readonly name: string;
  readonly pageSize: number;
  readonly headers?: Record<string, string> | undefined;
}): Promise<SidebarWave[]> {
  const waves = await commonApiFetch<ApiWave[]>({
    endpoint,
    params: {
      name,
      limit: `${pageSize}`,
      direct_message: "false",
    },
    headers,
  });

  return waves.map(mapApiWaveToSidebarWave);
}

const WAVE_SEARCH_UNAVAILABLE_MESSAGE =
  "Wave search is unavailable. Try a wave URL or id.";

function createWaveSearchUnavailableError(cause?: unknown): Error {
  if (cause === undefined) {
    return new Error(WAVE_SEARCH_UNAVAILABLE_MESSAGE);
  }
  return new Error(WAVE_SEARCH_UNAVAILABLE_MESSAGE, { cause });
}

export async function searchWavesByName({
  name,
  pageSize = 5,
  headers,
}: {
  readonly name: string;
  readonly pageSize?: number | undefined;
  readonly headers?: Record<string, string> | undefined;
}): Promise<SidebarWave[]> {
  let completedSearches = 0;
  let failedSearches = 0;
  let primarySearchError: unknown;
  let firstSearchError: unknown;

  try {
    return await searchWavesV2ByName({ name, pageSize, headers });
  } catch (error) {
    failedSearches += 1;
    primarySearchError = error;
    firstSearchError ??= error;
    // Fall back while older API deployments still reject v2 SEARCH by name.
  }

  try {
    const waves = await searchLegacyWavesByName({
      endpoint: "waves",
      name,
      pageSize,
      headers,
    });
    completedSearches += 1;
    if (waves.length > 0) {
      return waves;
    }
  } catch (error) {
    failedSearches += 1;
    firstSearchError ??= error;
    // Public search is the last fallback for unauthenticated sessions.
  }

  try {
    const waves = await searchLegacyWavesByName({
      endpoint: "waves-public",
      name,
      pageSize,
      headers,
    });
    completedSearches += 1;
    if (waves.length > 0) {
      return waves;
    }
  } catch (error) {
    failedSearches += 1;
    firstSearchError ??= error;
  }

  if (completedSearches === 0 || failedSearches > 0) {
    throw createWaveSearchUnavailableError(
      primarySearchError ?? firstSearchError
    );
  }

  return [];
}

export async function fetchWaveSubwavesPage({
  parentWaveId,
  page = 1,
  pageSize = 100,
  sort = ApiSubwavesSort.CreatedAt,
}: FetchWaveSubwavesPageProps): Promise<SidebarWavesPage> {
  const response = await commonApiFetch<ApiWaveOverviewPage>({
    endpoint: `waves/${parentWaveId}/subwaves`,
    params: {
      page: `${page}`,
      page_size: `${pageSize}`,
      sort,
    },
  });

  return {
    waves: response.data.map((wave) => ({
      ...mapApiWaveOverviewToSidebarWave(wave),
      parentWaveId,
      hasSubwaves: false,
    })),
    page: response.page,
    next: response.next,
  };
}

export async function fetchOfficialWaves(): Promise<SidebarWave[]> {
  const response = await commonApiFetch<ApiWaveOverview[]>({
    endpoint: "v2/official-waves",
  });

  return response.map(mapApiWaveOverviewToSidebarWave);
}

export async function fetchWaveMetadata({
  waveId,
  headers,
}: {
  readonly waveId: string;
  readonly headers?: Record<string, string> | undefined;
}): Promise<ApiWaveMetadata[]> {
  return await commonApiFetch<ApiWaveMetadata[]>({
    endpoint: `v2/waves/${waveId}/metadata`,
    headers,
  });
}

export async function createWaveMetadata({
  waveId,
  body,
  headers,
}: {
  readonly waveId: string;
  readonly body: ApiCreateWaveMetadataRequest;
  readonly headers?: Record<string, string> | undefined;
}): Promise<ApiWaveMetadata> {
  return await commonApiPost<ApiCreateWaveMetadataRequest, ApiWaveMetadata>({
    endpoint: `v2/waves/${waveId}/metadata`,
    body,
    headers,
  });
}

export async function deleteWaveMetadata({
  waveId,
  metadataId,
  headers,
}: {
  readonly waveId: string;
  readonly metadataId: number;
  readonly headers?: Record<string, string> | undefined;
}): Promise<void> {
  await commonApiDelete({
    endpoint: `v2/waves/${waveId}/metadata/${metadataId}`,
    headers,
  });
}
