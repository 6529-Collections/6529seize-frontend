"use client";

import { useMemo, type FC } from "react";
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
import { useWaveProposalCardPresentation } from "@/hooks/waves/useWaveProposalCardPresentation";
import type {
  ResolvedWaveParticipationRendererSet,
  ParticipationDropProps,
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

const ProposalCardParticipationDrop: FC<ParticipationDropProps> = (props) => (
  <DefaultParticipationDrop {...props} contentPresentation="proposalCard" />
);

export const useWaveParticipationRendererSet = (
  waveId: string | null | undefined
): ResolvedWaveParticipationRendererSet => {
  const { isMemesWave, isCurationWave, isQuorumWave } = useSeizeSettings();
  const proposalCardPresentation = useWaveProposalCardPresentation(waveId);

  return useMemo(() => {
    const variant = resolveWaveParticipationVariant({
      waveId,
      overrides: WAVE_PARTICIPATION_VARIANT_OVERRIDES,
      isMemesWave,
      isCurationWave,
      isQuorumWave,
    });

    const rendererSet = WAVE_PARTICIPATION_RENDERERS[variant];

    if (variant === "default" && proposalCardPresentation === "proposalCard") {
      return {
        variant,
        ...rendererSet,
        ParticipationDrop: ProposalCardParticipationDrop,
      };
    }

    return {
      variant,
      ...rendererSet,
    };
  }, [
    isMemesWave,
    isCurationWave,
    isQuorumWave,
    proposalCardPresentation,
    waveId,
  ]);
};
