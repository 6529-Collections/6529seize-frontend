import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";

interface SidebarWaveGroups {
  readonly announcementWaves: MinimalWave[];
  readonly highlyRatedWaves: MinimalWave[];
  readonly pinnedWaves: MinimalWave[];
  readonly followingWaves: MinimalWave[];
  readonly allWaves: MinimalWave[];
}

export const isValidSidebarWave = (wave: unknown): wave is MinimalWave => {
  if (wave === null || wave === undefined || typeof wave !== "object") {
    return false;
  }

  const w = wave as MinimalWave;
  return (
    typeof w.id === "string" &&
    w.id.length > 0 &&
    typeof w.name === "string" &&
    typeof w.isPinned === "boolean" &&
    typeof w.isFollowing === "boolean"
  );
};

export const validateSidebarWaveDetailed = (
  wave: unknown
): wave is MinimalWave => {
  if (!isValidSidebarWave(wave)) {
    return false;
  }

  const newDropsCount = (
    wave as {
      readonly newDropsCount?: {
        readonly count?: unknown;
        readonly latestDropTimestamp?: unknown;
        readonly firstUnreadSerialNo?: unknown;
      } | null;
    }
  ).newDropsCount;

  return (
    typeof wave.type === "string" &&
    newDropsCount !== null &&
    typeof newDropsCount === "object" &&
    typeof newDropsCount.count === "number" &&
    (newDropsCount.latestDropTimestamp === null ||
      typeof newDropsCount.latestDropTimestamp === "number") &&
    (newDropsCount.firstUnreadSerialNo === null ||
      typeof newDropsCount.firstUnreadSerialNo === "number") &&
    Array.isArray(wave.contributors) &&
    (wave.picture === null || typeof wave.picture === "string")
  );
};

export const groupSidebarWaves = ({
  isAnnouncementsWave,
  waves,
}: {
  readonly isAnnouncementsWave?: ((waveId: string) => boolean) | undefined;
  readonly waves: readonly MinimalWave[];
}): SidebarWaveGroups => {
  const announcementWaves: MinimalWave[] = [];
  const highlyRatedWaves: MinimalWave[] = [];
  const pinnedWaves: MinimalWave[] = [];
  const followingWaves: MinimalWave[] = [];
  const allWaves: MinimalWave[] = [];

  for (const wave of waves) {
    if (isAnnouncementsWave?.(wave.id) === true) {
      announcementWaves.push(wave);
    } else if (wave.isPinned) {
      pinnedWaves.push(wave);
    } else {
      const isHighlyRated = wave.sidebarSection === "highly-rated";
      if (isHighlyRated) {
        highlyRatedWaves.push(wave);
      }
      if (!isHighlyRated || wave.isInAllWaves !== false) {
        allWaves.push(wave);
      }
    }

    if (wave.isFollowing || wave.isFollowedSubwaveContainer) {
      followingWaves.push(wave);
    }
  }

  allWaves.sort((left, right) => {
    if (left.isMuted !== right.isMuted) {
      return left.isMuted ? 1 : -1;
    }

    return (
      (right.sidebarActivityTimestamp ?? 0) -
      (left.sidebarActivityTimestamp ?? 0)
    );
  });

  return {
    announcementWaves,
    highlyRatedWaves,
    pinnedWaves,
    followingWaves,
    allWaves,
  };
};

const groupDirectMessageSidebarWaves = (
  waves: readonly MinimalWave[]
): SidebarWaveGroups => ({
  announcementWaves: [],
  highlyRatedWaves: [],
  pinnedWaves: [],
  followingWaves: [],
  allWaves: [...waves],
});

export const groupSidebarWavesForView = ({
  isAnnouncementsWave,
  isDirectMessage,
  waves,
}: {
  readonly isAnnouncementsWave?: ((waveId: string) => boolean) | undefined;
  readonly isDirectMessage: boolean;
  readonly waves: readonly MinimalWave[];
}): SidebarWaveGroups =>
  isDirectMessage
    ? groupDirectMessageSidebarWaves(waves)
    : groupSidebarWaves({
        isAnnouncementsWave,
        waves,
      });

export const prioritizeActiveWaveContainer = (
  waves: readonly MinimalWave[],
  activeContainerWaveId: string | null | undefined
): readonly MinimalWave[] => {
  if (!activeContainerWaveId) {
    return waves;
  }

  const activeContainerIndex = waves.findIndex(
    (wave) => wave.id === activeContainerWaveId
  );
  if (activeContainerIndex <= 0) {
    return waves;
  }

  const activeContainer = waves[activeContainerIndex];
  if (!activeContainer) {
    return waves;
  }

  return [
    activeContainer,
    ...waves.slice(0, activeContainerIndex),
    ...waves.slice(activeContainerIndex + 1),
  ];
};
