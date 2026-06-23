import type { ApiIdentity } from "@/generated/models/ApiIdentity";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCuration } from "@/generated/models/ApiWaveCuration";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getWaveRoute } from "@/helpers/navigation.helpers";
import {
  isPublicNonDirectMessageWave,
  isWaveDirectMessage,
} from "@/helpers/waves/wave.helpers";

type ApiErrorLike = {
  readonly status?: number | undefined;
  readonly response?: {
    readonly status?: number | undefined;
  };
};

type WavePickerViewState =
  | { readonly kind: "not_own_profile" }
  | { readonly kind: "proxy_mode" }
  | { readonly kind: "missing_profile" }
  | { readonly kind: "loading" }
  | { readonly kind: "error" }
  | { readonly kind: "no_public_waves"; readonly hasCreatedWaves: boolean }
  | { readonly kind: "ready"; readonly waves: ApiWave[] };

type EmptyStateConfig = {
  readonly title: string;
  readonly message: string;
};

type ProfileCurationViewState =
  | { readonly kind: "curations_error" }
  | { readonly kind: "loading_curations" }
  | { readonly kind: "no_curation"; readonly emptyState: EmptyStateConfig }
  | { readonly kind: "drops_error" }
  | { readonly kind: "loading_drops" }
  | { readonly kind: "empty_drops"; readonly emptyState: EmptyStateConfig }
  | {
      readonly kind: "ready";
      readonly curation: ApiWaveCuration;
      readonly drops: ExtendedDrop[];
      readonly fetchNextPage: () => Promise<void>;
      readonly hasNextPage: boolean | undefined;
      readonly isFetchingNextPage: boolean;
    };

export const CREATE_WAVE_HREF = "/waves?create=wave";

const getErrorStatus = (error: unknown): number | null => {
  if (error === null || error === undefined || typeof error !== "object") {
    return null;
  }

  const apiError = error as ApiErrorLike;
  return apiError.status ?? apiError.response?.status ?? null;
};

export const isUnavailableWaveError = (error: unknown): boolean => {
  const status = getErrorStatus(error);
  if (status === 403 || status === 404) {
    return true;
  }

  if (typeof error === "string") {
    return /not found|forbidden/i.test(error);
  }

  return error instanceof Error && /not found|forbidden/i.test(error.message);
};

export const getProfileIdentityKey = (profile: ApiIdentity): string | null => {
  const identity = profile.handle ?? profile.query ?? profile.primary_wallet;
  return identity.length > 0 ? identity : null;
};

export const getWaveHref = (
  wave: ApiWave,
  curationId?: string | null
): string => {
  const baseWaveHref = getWaveRoute({
    waveId: wave.id,
    isDirectMessage: isWaveDirectMessage(wave.id, wave),
    isApp: false,
  });

  if (!curationId) {
    return baseWaveHref;
  }

  return `${baseWaveHref}?${new URLSearchParams({
    curation: curationId,
  }).toString()}`;
};

export const resolveProfileCuration = (
  curations: readonly ApiWaveCuration[],
  profileCurationId?: string | null
): ApiWaveCuration | null => {
  if (profileCurationId) {
    const selectedCuration =
      curations.find((curation) => curation.id === profileCurationId) ?? null;
    if (selectedCuration) {
      return selectedCuration;
    }
  }

  return curations[0] ?? null;
};

export const getProfileCurationTitle = (
  profileCuration: ApiWaveCuration | null
): string => {
  const trimmedTitle = profileCuration?.name.trim() ?? "";
  return trimmedTitle.length > 0 ? trimmedTitle : "Curation";
};

export const getOfficialWaveMetadataLabel = (wave: ApiWave): string =>
  [
    `${wave.metrics.drops_count} posts`,
    `${wave.metrics.subscribers_count} joined`,
  ].join(" • ");

const getMissingCurationConfig = (
  canManageOwnOfficialWave: boolean
): EmptyStateConfig =>
  canManageOwnOfficialWave
    ? {
        title: "Nothing curated here yet",
        message: "Create a curation to start adding profile posts here.",
      }
    : {
        title: "No curations yet",
        message: "This identity hasn't curated anything here yet.",
      };

const getEmptyDropsConfig = (
  canManageOwnOfficialWave: boolean,
  curationTitle: string
): EmptyStateConfig => ({
  title: canManageOwnOfficialWave
    ? `Nothing in ${curationTitle} yet`
    : "No curated drops yet",
  message: canManageOwnOfficialWave
    ? `Add a post to start "${curationTitle}".`
    : "This identity hasn't added any drops to this curation yet.",
});

export const resolveWavePickerViewState = ({
  createdWaves,
  hasCreatedProfile,
  hasActiveProfileProxy,
  isOwnProfile,
  status,
}: {
  readonly createdWaves: ApiWave[];
  readonly hasCreatedProfile: boolean;
  readonly hasActiveProfileProxy: boolean;
  readonly isOwnProfile: boolean;
  readonly status: "pending" | "error" | "success";
}): WavePickerViewState => {
  if (!isOwnProfile) {
    return { kind: "not_own_profile" };
  }

  if (hasActiveProfileProxy) {
    return { kind: "proxy_mode" };
  }

  if (!hasCreatedProfile) {
    return { kind: "missing_profile" };
  }

  if (status === "pending") {
    return { kind: "loading" };
  }

  if (status === "error") {
    return { kind: "error" };
  }

  const eligibleWaves = createdWaves.filter((wave) =>
    isPublicNonDirectMessageWave(wave)
  );
  if (eligibleWaves.length === 0) {
    return {
      kind: "no_public_waves",
      hasCreatedWaves: createdWaves.length > 0,
    };
  }

  return {
    kind: "ready",
    waves: eligibleWaves,
  };
};

export const resolveProfileCurationViewState = ({
  areCurationsError,
  areCurationsLoading,
  canManageOwnOfficialWave,
  containerWidth,
  hasLoadedCurations,
  profileCuration,
  drops,
  dropsDataUpdatedAt,
  areDropsError,
  isDropsPlaceholderData,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
}: {
  readonly areCurationsError: boolean;
  readonly areCurationsLoading: boolean;
  readonly canManageOwnOfficialWave: boolean;
  readonly containerWidth: number;
  readonly hasLoadedCurations: boolean;
  readonly profileCuration: ApiWaveCuration | null;
  readonly drops: ExtendedDrop[];
  readonly dropsDataUpdatedAt: number;
  readonly areDropsError: boolean;
  readonly isDropsPlaceholderData: boolean;
  readonly fetchNextPage: () => Promise<void>;
  readonly hasNextPage: boolean | undefined;
  readonly isFetchingNextPage: boolean;
}): ProfileCurationViewState => {
  if (areCurationsError && !hasLoadedCurations) {
    return { kind: "curations_error" };
  }

  if (areCurationsLoading) {
    return { kind: "loading_curations" };
  }

  if (!profileCuration) {
    return {
      kind: "no_curation",
      emptyState: getMissingCurationConfig(canManageOwnOfficialWave),
    };
  }

  const hasResolvedDrops = dropsDataUpdatedAt > 0 && !isDropsPlaceholderData;
  if (!hasResolvedDrops && areDropsError) {
    return { kind: "drops_error" };
  }

  const isWaitingForDrops = !hasResolvedDrops;
  const isWaitingForWidth =
    hasResolvedDrops && drops.length > 0 && containerWidth === 0;
  if (isWaitingForDrops || isWaitingForWidth) {
    return { kind: "loading_drops" };
  }

  if (drops.length === 0) {
    return {
      kind: "empty_drops",
      emptyState: getEmptyDropsConfig(
        canManageOwnOfficialWave,
        getProfileCurationTitle(profileCuration)
      ),
    };
  }

  return {
    kind: "ready",
    curation: profileCuration,
    drops,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  };
};
