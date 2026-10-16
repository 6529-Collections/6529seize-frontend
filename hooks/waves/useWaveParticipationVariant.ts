"use client";

import { useMemo } from "react";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import {
  resolveWaveParticipationVariant,
  type WaveParticipationVariant,
} from "@/helpers/waves/wave-participation-presentation.helpers";

// Use this for one-off waves that should opt into a custom renderer before
// the API exposes a presentation variant.
const WAVE_PARTICIPATION_VARIANT_OVERRIDES: Readonly<
  Partial<Record<string, WaveParticipationVariant>>
> = {};

// Shared by the list renderer registry and the single drop renderer registry,
// which stay in separate modules so a list of drops never has to load the
// single drop view (its chat composer and GIF picker).
export const useWaveParticipationVariant = (
  waveId: string | null | undefined
): WaveParticipationVariant => {
  const { isMemesWave, isCurationWave, isQuorumWave } = useSeizeSettings();

  return useMemo(
    () =>
      resolveWaveParticipationVariant({
        waveId,
        overrides: WAVE_PARTICIPATION_VARIANT_OVERRIDES,
        isMemesWave,
        isCurationWave,
        isQuorumWave,
      }),
    [isMemesWave, isCurationWave, isQuorumWave, waveId]
  );
};
