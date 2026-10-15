import { publicEnv } from "@/config/env";

/**
 * The Memes wave the app uses: the development override, else the API
 * setting. The settings context and the home server prefetch both resolve it
 * here, so they query the same wave.
 */
export const resolveMemesWaveId = (
  memesWaveId: string | null | undefined
): string | null => publicEnv.DEV_MODE_MEMES_WAVE_ID ?? memesWaveId ?? null;
