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
};

const getSubwaveActivityTimestamp = (wave: SortableSubwaveActivity) => {
  // Raw SidebarWave data uses latestDropTimestamp; enhanced sidebar rows fold
  // API and websocket activity into newDropsCount.latestDropTimestamp.
  return (
    wave.newDropsCount?.latestDropTimestamp ?? wave.latestDropTimestamp ?? 0
  );
};

export const compareSubwavesByLatestActivity = <
  T extends SortableSubwaveActivity,
>(
  a: T,
  b: T
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
