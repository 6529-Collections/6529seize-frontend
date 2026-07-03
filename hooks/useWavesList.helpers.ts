"use client";

import { ApiWavesPinFilter } from "@/generated/models/ApiWavesPinFilter";
import type { SidebarWave } from "@/types/waves.types";

export type SidebarDiscoverySection = "highly-rated" | "all";

export type SidebarWaveWithDiscoverySection = SidebarWave & {
  readonly sidebarSection?: SidebarDiscoverySection;
};

export const SIDEBAR_DISCOVERY_SECTION_HIGHLY_RATED: SidebarDiscoverySection =
  "highly-rated";
const SIDEBAR_DISCOVERY_SECTION_ALL: SidebarDiscoverySection = "all";

const HIGHLY_RATED_WAVE_LIMIT = 10;

export const isKnownWaveForCurrentViewer = (wave: SidebarWave) =>
  wave.subscribed || wave.followedSubwavesCount > 0;

const mapAllActivityWave = (
  wave: SidebarWave
): SidebarWaveWithDiscoverySection => ({
  ...wave,
  sidebarSection: SIDEBAR_DISCOVERY_SECTION_ALL,
});

const mapHighlyRatedWave = (
  wave: SidebarWave
): SidebarWaveWithDiscoverySection => ({
  ...wave,
  sidebarSection: SIDEBAR_DISCOVERY_SECTION_HIGHLY_RATED,
});

interface MainWavesSourceParams {
  readonly shouldLoadMainWaves: boolean;
  readonly isJoinedMode: boolean;
  readonly highlyRatedWaves: readonly SidebarWave[];
  readonly followedActivityWaves: readonly SidebarWave[];
  readonly allActivityWaves: readonly SidebarWave[];
}

export const buildMainWaves = ({
  shouldLoadMainWaves,
  isJoinedMode,
  highlyRatedWaves,
  followedActivityWaves,
  allActivityWaves,
}: MainWavesSourceParams): SidebarWaveWithDiscoverySection[] => {
  if (!shouldLoadMainWaves) {
    return [];
  }

  const highlyRatedDiscoveryWaves = highlyRatedWaves
    .filter((wave) => !isKnownWaveForCurrentViewer(wave))
    .slice(0, HIGHLY_RATED_WAVE_LIMIT)
    .map(mapHighlyRatedWave);
  const activityWaves = isJoinedMode
    ? followedActivityWaves
    : allActivityWaves.map(mapAllActivityWave);

  return [...highlyRatedDiscoveryWaves, ...activityWaves];
};

interface MainWavesFetchingParams {
  readonly shouldLoadMainWaves: boolean;
  readonly isJoinedMode: boolean;
  readonly isAllActivityWavesFetching: boolean;
  readonly isHighlyRatedWavesFetching: boolean;
  readonly isFollowedActivityWavesFetching: boolean;
}

export const getMainWavesFetching = ({
  shouldLoadMainWaves,
  isJoinedMode,
  isAllActivityWavesFetching,
  isHighlyRatedWavesFetching,
  isFollowedActivityWavesFetching,
}: MainWavesFetchingParams): boolean => {
  if (!shouldLoadMainWaves) {
    return false;
  }

  if (isJoinedMode) {
    return isFollowedActivityWavesFetching;
  }

  return isAllActivityWavesFetching || isHighlyRatedWavesFetching;
};

export const getModeValue = <T>({
  shouldLoadMainWaves,
  isJoinedMode,
  joinedValue,
  allValue,
  deferredValue,
}: {
  readonly shouldLoadMainWaves: boolean;
  readonly isJoinedMode: boolean;
  readonly joinedValue: T;
  readonly allValue: T;
  readonly deferredValue: T;
}): T => {
  if (!shouldLoadMainWaves) {
    return deferredValue;
  }

  if (isJoinedMode) {
    return joinedValue;
  }

  return allValue;
};

export const getConnectedIdentity = ({
  hasConnectedProfile,
  hasActiveProfileProxy,
  hasAuthenticatedProfile,
}: {
  readonly hasConnectedProfile: boolean;
  readonly hasActiveProfileProxy: boolean;
  readonly hasAuthenticatedProfile: boolean;
}): boolean =>
  hasConnectedProfile && !hasActiveProfileProxy && hasAuthenticatedProfile;

export const getHasAuthenticatedProfile = ({
  hasValidWalletAuthorization,
  isAuthenticated,
  hasConnectedProfile,
}: {
  readonly hasValidWalletAuthorization: boolean;
  readonly isAuthenticated: boolean | null | undefined;
  readonly hasConnectedProfile: boolean;
}): boolean =>
  hasValidWalletAuthorization && (isAuthenticated ?? hasConnectedProfile);

export const getShouldLoadMainWaves = ({
  isEnabled,
  address,
  hasValidWalletAuthorization,
  fetchingProfile,
}: {
  readonly isEnabled: boolean;
  readonly address: string | undefined;
  readonly hasValidWalletAuthorization: boolean;
  readonly fetchingProfile: boolean;
}): boolean => {
  if (!isEnabled) {
    return false;
  }

  if (address && (!hasValidWalletAuthorization || fetchingProfile)) {
    return false;
  }

  return true;
};

export const getNonPinnedFilter = (
  isConnectedIdentity: boolean
): ApiWavesPinFilter | undefined => {
  if (isConnectedIdentity) {
    return ApiWavesPinFilter.NotPinned;
  }

  return undefined;
};

export const getViewerIdentityKey = ({
  address,
  proxyId,
  hasValidWalletAuthorization,
  hasAuthenticatedProfile,
}: {
  readonly address: string | undefined;
  readonly proxyId: string | number | undefined;
  readonly hasValidWalletAuthorization: boolean;
  readonly hasAuthenticatedProfile: boolean;
}): string | null => {
  if (!address || !hasValidWalletAuthorization || !hasAuthenticatedProfile) {
    return null;
  }

  const normalizedAddress = address.toLowerCase();
  if (proxyId !== undefined) {
    return `${normalizedAddress}:proxy:${proxyId}`;
  }

  return `${normalizedAddress}:primary`;
};
