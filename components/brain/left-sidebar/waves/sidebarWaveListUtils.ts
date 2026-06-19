import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";

export interface SidebarWaveGroups {
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
    } else if (wave.isFollowing) {
      followingWaves.push(wave);
    } else if (wave.sidebarSection === "highly-rated") {
      highlyRatedWaves.push(wave);
    } else {
      allWaves.push(wave);
    }
  }

  return {
    announcementWaves,
    highlyRatedWaves,
    pinnedWaves,
    followingWaves,
    allWaves,
  };
};

export const groupDirectMessageSidebarWaves = (
  waves: readonly MinimalWave[]
): SidebarWaveGroups => ({
  announcementWaves: [],
  highlyRatedWaves: [],
  pinnedWaves: [],
  followingWaves: [],
  allWaves: [...waves],
});
