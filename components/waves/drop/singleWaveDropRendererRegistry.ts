"use client";

import type { WaveSingleWaveDropRendererSet } from "@/components/waves/drops/participation/participationRenderer.types";
import type { ApiCompetitionCapability } from "@/generated/models/ApiCompetitionCapability";
import type { WaveParticipationVariant } from "@/helpers/waves/wave-participation-presentation.helpers";
import { useWaveParticipationVariant } from "@/hooks/waves/useWaveParticipationVariant";
import { DefaultSingleWaveDrop } from "./DefaultSingleWaveDrop";
import { MemesSingleWaveDrop } from "./MemesSingleWaveDrop";
import { QuorumSingleWaveDrop } from "./QuorumSingleWaveDrop";

// Single drop view renderers. They carry the chat composer, so only the
// surfaces that open a single drop import this registry. Lists of drops use
// `participationRendererRegistry` instead.
const SINGLE_WAVE_DROP_RENDERERS: Readonly<
  Record<WaveParticipationVariant, WaveSingleWaveDropRendererSet>
> = {
  default: { SingleWaveDrop: DefaultSingleWaveDrop },
  memes: { SingleWaveDrop: MemesSingleWaveDrop },
  curation: { SingleWaveDrop: DefaultSingleWaveDrop },
  quorum: { SingleWaveDrop: QuorumSingleWaveDrop },
};

export const useWaveSingleWaveDropRendererSet = (
  waveId: string | null | undefined,
  capabilities?: readonly ApiCompetitionCapability[]
): WaveSingleWaveDropRendererSet => {
  const variant = useWaveParticipationVariant(waveId, capabilities);

  return SINGLE_WAVE_DROP_RENDERERS[variant];
};
