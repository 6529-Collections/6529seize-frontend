const nearViewportDropIdsByWave = new Map<string, Set<string>>();

export const setWaveDropNearViewport = ({
  waveId,
  dropId,
  isNearViewport,
}: {
  readonly waveId: string;
  readonly dropId: string;
  readonly isNearViewport: boolean;
}): void => {
  if (!isNearViewport) {
    clearWaveDropNearViewport(waveId, dropId);
    return;
  }

  const visibleDrops =
    nearViewportDropIdsByWave.get(waveId) ?? new Set<string>();
  visibleDrops.add(dropId);
  nearViewportDropIdsByWave.set(waveId, visibleDrops);
};

export const clearWaveDropNearViewport = (
  waveId: string,
  dropId: string
): void => {
  const visibleDrops = nearViewportDropIdsByWave.get(waveId);
  if (!visibleDrops) {
    return;
  }

  visibleDrops.delete(dropId);
  if (visibleDrops.size === 0) {
    nearViewportDropIdsByWave.delete(waveId);
  }
};

export const isWaveDropNearViewport = (
  waveId: string,
  dropId: string
): boolean => nearViewportDropIdsByWave.get(waveId)?.has(dropId) ?? false;
