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
 * Entries are never removed: one boolean per wave seen this session.
 *
 * Once a wave is known to have a competition it stays so for the session. A
 * feed page requested before a competition was created can arrive after the
 * event that announced it, and must not turn lookups back off. The cost is
 * that a wave which loses its last competition keeps looking up until reload.
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
  const known = presenceByWaveId.get(waveId);
  if (
    typeof window === "undefined" ||
    hasCompetition === undefined ||
    known === hasCompetition ||
    known === true
  ) {
    return;
  }
  presenceByWaveId.set(waveId, hasCompetition);
  for (const listener of listeners) {
    listener();
  }
};

/** False only while every report for this wave has said it has no competition. */
export const waveMayHaveCompetitionEntries = (waveId: string): boolean =>
  presenceByWaveId.get(waveId) !== false;
