import { useWaveById } from "./useWaveById";

// Every tab that shows the sidebar observes the announcement wave. Its row
// takes new drops from live updates, and its name and image rarely change,
// so remounts and re-enables within ten minutes reuse the cached wave.
const ANNOUNCEMENTS_WAVE_STALE_TIME_MS = 10 * 60 * 1000;

/** The sidebar's announcement wave, while the loaded lists don't carry it. */
export function useAnnouncementsWave(waveId: string | null, enabled: boolean) {
  return useWaveById(waveId, {
    enabled,
    staleTime: ANNOUNCEMENTS_WAVE_STALE_TIME_MS,
  });
}
