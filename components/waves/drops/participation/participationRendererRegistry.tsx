"use client";

import { useMemo } from "react";
import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import {
  resolveWaveParticipationVariant,
  type WaveParticipationVariant,
} from "@/helpers/waves/wave-participation-presentation.helpers";
import MemeParticipationDrop from "@/components/memes/drops/MemeParticipationDrop";
import { DefaultSingleWaveDrop } from "@/components/waves/drop/DefaultSingleWaveDrop";
import { MemesSingleWaveDrop } from "@/components/waves/drop/MemesSingleWaveDrop";
import { QuorumSingleWaveDrop } from "@/components/waves/drop/QuorumSingleWaveDrop";
import QuorumParticipationDrop from "@/components/waves/quorum/QuorumParticipationDrop";
import DefaultParticipationDrop from "./DefaultParticipationDrop";
import type {
  ResolvedWaveParticipationRendererSet,
  WaveParticipationRendererSet,
} from "./participationRenderer.types";

// Use this for one-off waves that should opt into a custom renderer before
// the API exposes a presentation variant.
const WAVE_PARTICIPATION_VARIANT_OVERRIDES: Readonly<
  Partial<Record<string, WaveParticipationVariant>>
> = {};

const WAVE_PARTICIPATION_RENDERERS: Readonly<
  Record<WaveParticipationVariant, WaveParticipationRendererSet>
> = {
  default: {
    ParticipationDrop: DefaultParticipationDrop,
    SingleWaveDrop: DefaultSingleWaveDrop,
  },
  memes: {
    ParticipationDrop: MemeParticipationDrop,
    SingleWaveDrop: MemesSingleWaveDrop,
  },
  curation: {
    ParticipationDrop: DefaultParticipationDrop,
    SingleWaveDrop: DefaultSingleWaveDrop,
  },
  quorum: {
    ParticipationDrop: QuorumParticipationDrop,
    SingleWaveDrop: QuorumSingleWaveDrop,
  },
};

export const useWaveParticipationRendererSet = (
  waveId: string | null | undefined
): ResolvedWaveParticipationRendererSet => {
  const { isMemesWave, isCurationWave, isQuorumWave } = useSeizeSettings();

  return useMemo(() => {
    const variant = resolveWaveParticipationVariant({
      waveId,
      overrides: WAVE_PARTICIPATION_VARIANT_OVERRIDES,
      isMemesWave,
      isCurationWave,
      isQuorumWave,
    });

    return {
      variant,
      ...WAVE_PARTICIPATION_RENDERERS[variant],
    };
  }, [isMemesWave, isCurationWave, isQuorumWave, waveId]);
};
