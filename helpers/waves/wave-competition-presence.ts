/**
 * Whether each wave has any competition, as last reported by the API.
 *
 * A drop can only be a competition entry in a wave that has a competition, so
 * drops in a wave known to have none never need a per-drop competition lookup.
 * Drop responses carry a slim wave without this flag, and chat rows swap in the
 * full wave object, so the answer is kept by wave id rather than on the drop.
 *
 * This module has no React imports: API helpers that also run in server
 * components record into it. The hook lives in
 * `hooks/competitions/useWaveMayHaveCompetitionEntries.ts`.
 *
 * The flag is the same for every viewer, so it is not reset on profile switch.
 * Entries are never removed: one boolean per wave seen this session, and each
 * feed page re-asserts the current value.
 */
const presenceByWaveId = new Map<string, boolean>();
const listeners = new Set<() => void>();

export const subscribeToWaveCompetitionPresence = (
  listener: () => void
): (() => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

export const recordWaveCompetitionPresence = (
  waveId: string,
  hasCompetition: boolean | undefined
): void => {
  // Server renders share this module across requests; only browsers keep it.
  if (
    typeof window === "undefined" ||
    hasCompetition === undefined ||
    presenceByWaveId.get(waveId) === hasCompetition
  ) {
    return;
  }
  presenceByWaveId.set(waveId, hasCompetition);
  for (const listener of listeners) {
    listener();
  }
};

/** False only when the API has said this wave has no competition. */
export const waveMayHaveCompetitionEntries = (waveId: string): boolean =>
  presenceByWaveId.get(waveId) !== false;
