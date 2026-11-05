"use client";

import type { ApiWave } from "@/generated/models/ApiWave";
import { useCompetitionHub } from "@/hooks/competitions/useCompetitionQueries";

/** Configuration belongs to the shared wave, independent of its competitions. */
export function useWaveConfiguration(wave: ApiWave): ApiWave {
  const { data } = useCompetitionHub(wave.id);
  return data?.configuration ?? wave;
}
