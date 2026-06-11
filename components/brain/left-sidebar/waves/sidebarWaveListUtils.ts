import type { MinimalWave } from "@/contexts/wave/hooks/useEnhancedWavesListCore";
import type { SidebarWaveTreeRow } from "@/hooks/useSidebarWaveTree";

export interface SidebarWaveGroups {
  readonly announcementWaves: MinimalWave[];
  readonly officialWaves: MinimalWave[];
  readonly pinnedWaves: MinimalWave[];
  readonly regularWaves: MinimalWave[];
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
    typeof w.isPinned === "boolean"
  );
};

export const validateSidebarWaveDetailed = (
  wave: unknown
): wave is MinimalWave => {
  if (!isValidSidebarWave(wave)) {
    return false;
  }

  return (
    typeof wave.type === "string" &&
    typeof wave.newDropsCount === "object" &&
    typeof wave.newDropsCount.count === "number" &&
    (wave.newDropsCount.latestDropTimestamp === null ||
      typeof wave.newDropsCount.latestDropTimestamp === "number") &&
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
  const officialWaves: MinimalWave[] = [];
  const pinnedWaves: MinimalWave[] = [];
  const regularWaves: MinimalWave[] = [];

  for (const wave of waves) {
    if (isAnnouncementsWave?.(wave.id) === true) {
      announcementWaves.push(wave);
    } else if (wave.isOfficial) {
      officialWaves.push(wave);
    } else if (wave.isPinned) {
      pinnedWaves.push(wave);
    } else {
      regularWaves.push(wave);
    }
  }

  return {
    announcementWaves,
    officialWaves,
    pinnedWaves,
    regularWaves,
  };
};

export const hasExpandableTopLevelRows = (
  rows: readonly SidebarWaveTreeRow[]
) => rows.some((row) => row.depth === 0 && row.canExpand);
