type SortableSubwaveActivity = {
  readonly id: string;
  readonly name: string;
  readonly createdAt: number;
  readonly latestDropTimestamp?: number | null | undefined;
  readonly newDropsCount?:
    | {
        readonly latestDropTimestamp?: number | null | undefined;
      }
    | undefined;
  // Enhanced sidebar rows expose isMuted; raw SidebarWave data uses muted.
  readonly isMuted?: boolean | undefined;
  readonly muted?: boolean | undefined;
};

const getSubwaveActivityTimestamp = (wave: SortableSubwaveActivity) => {
  // Raw SidebarWave data uses latestDropTimestamp; enhanced sidebar rows fold
  // API and websocket activity into newDropsCount.latestDropTimestamp.
  return (
    wave.newDropsCount?.latestDropTimestamp ?? wave.latestDropTimestamp ?? 0
  );
};

const isSubwaveMuted = (wave: SortableSubwaveActivity) =>
  wave.isMuted ?? wave.muted ?? false;

const compareSubwavesByLatestActivity = (
  a: SortableSubwaveActivity,
  b: SortableSubwaveActivity
) => {
  const activityDelta =
    getSubwaveActivityTimestamp(b) - getSubwaveActivityTimestamp(a);

  if (activityDelta !== 0) {
    return activityDelta;
  }

  const createdAtDelta = b.createdAt - a.createdAt;
  if (createdAtDelta !== 0) {
    return createdAtDelta;
  }

  const nameDelta = a.name.localeCompare(b.name);
  if (nameDelta !== 0) {
    return nameDelta;
  }

  return a.id.localeCompare(b.id);
};

/**
 * Display order for subwaves under a parent: unmuted subwaves first, then
 * muted ones, each group newest activity first. Mirrors the muted-last rule
 * used for top-level sidebar rows.
 */
export const compareSubwavesForDisplay = <T extends SortableSubwaveActivity>(
  a: T,
  b: T
) => {
  const mutedDelta = Number(isSubwaveMuted(a)) - Number(isSubwaveMuted(b));

  if (mutedDelta !== 0) {
    return mutedDelta;
  }

  return compareSubwavesByLatestActivity(a, b);
};
