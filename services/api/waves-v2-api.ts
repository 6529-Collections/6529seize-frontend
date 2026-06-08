import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiDropMedia } from "@/generated/models/ApiDropMedia";
import type { ApiWaveOverview } from "@/generated/models/ApiWaveOverview";
import type { ApiWaveOverviewPage } from "@/generated/models/ApiWaveOverviewPage";
import { ApiSubwavesSort } from "@/generated/models/ApiSubwavesSort";
import { ApiWaveType } from "@/generated/models/ApiWaveType";
import { ApiWavesV2ListType } from "@/generated/models/ApiWavesV2ListType";
import type { ApiWavesOverviewType } from "@/generated/models/ApiWavesOverviewType";
import type { ApiWavesPinFilter } from "@/generated/models/ApiWavesPinFilter";
import type { SidebarWave, SidebarWavesPage } from "@/types/waves.types";
import { commonApiFetch } from "./common-api";

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
}

export interface WavesV2OverviewQueryKeyParams {
  readonly view: ApiWavesV2ListType.Overview;
  readonly page_size: number;
  readonly overview_type: ApiWavesOverviewType;
  readonly only_waves_followed_by_authenticated_user: boolean;
  readonly direct_message?: boolean | undefined;
  readonly pinned?: ApiWavesPinFilter | undefined;
  readonly viewer_identity?: string | undefined;
}

export function getWavesV2OverviewQueryKeyParams({
  overviewType,
  pageSize,
  following = false,
  directMessage,
  pinned,
  viewerIdentityKey,
}: {
  readonly overviewType: ApiWavesOverviewType;
  readonly pageSize: number;
  readonly following?: boolean | undefined;
  readonly directMessage?: boolean | undefined;
  readonly pinned?: ApiWavesPinFilter | undefined;
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

  if (excludeFollowed !== undefined) {
    params["exclude_followed"] = `${excludeFollowed}`;
  }

  if (identity !== undefined) {
    params["identity"] = identity;
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
