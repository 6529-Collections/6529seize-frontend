// The wave messages store keeps message caches for this many waves and evicts
// the least recently used ones beyond it. The active wave, waves with a
// mounted subscriber and waves awaiting a server seed are never evicted, so
// the store may briefly hold more while they stay protected.
const MAX_RESIDENT_WAVES = 5;
// Evicted wave ids are remembered so a late write from a request that was in
// flight during eviction cannot recreate a partial cache. A wave that loads
// again forgets its id; the oldest ids are dropped beyond this bound.
const MAX_EVICTED_WAVE_IDS = 50;

/**
 * Picks the least recently used unprotected waves to evict. Resident wave ids
 * iterate in insertion order, least recently used first.
 */
export const selectWavesToEvict = (
  residentWaveIds: ReadonlySet<string>,
  isProtected: (waveId: string) => boolean
): string[] => {
  const evictedWaveIds: string[] = [];
  let residentCount = residentWaveIds.size;
  for (const waveId of residentWaveIds) {
    if (residentCount <= MAX_RESIDENT_WAVES) {
      break;
    }
    if (isProtected(waveId)) {
      continue;
    }
    evictedWaveIds.push(waveId);
    residentCount -= 1;
  }
  return evictedWaveIds;
};

export const rememberEvictedWave = (
  evictedWaveIds: Set<string>,
  waveId: string
): void => {
  evictedWaveIds.add(waveId);
  if (evictedWaveIds.size > MAX_EVICTED_WAVE_IDS) {
    const oldestWaveId = evictedWaveIds.values().next().value;
    if (oldestWaveId !== undefined) {
      evictedWaveIds.delete(oldestWaveId);
    }
  }
};
