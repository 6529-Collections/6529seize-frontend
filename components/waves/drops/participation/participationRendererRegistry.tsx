"use client";

import { useMemo, type FC } from "react";
import type { WaveParticipationVariant } from "@/helpers/waves/wave-participation-presentation.helpers";
import MemeParticipationDrop from "@/components/memes/drops/MemeParticipationDrop";
import QuorumParticipationDrop from "@/components/waves/quorum/QuorumParticipationDrop";
import DefaultParticipationDrop from "./DefaultParticipationDrop";
import { useWaveParticipationVariant } from "@/hooks/waves/useWaveParticipationVariant";
import { useWaveProposalCardPresentation } from "@/hooks/waves/useWaveProposalCardPresentation";
import type {
  ResolvedWaveParticipationRendererSet,
  ParticipationDropProps,
  WaveParticipationRendererSet,
} from "./participationRenderer.types";

// List renderers only. The single drop view renderers live in
// `components/waves/drop/singleWaveDropRendererRegistry`, so importing this
// registry (every drop in a list, every link preview) does not pull in the
// single drop view's chat composer and GIF picker.
const WAVE_PARTICIPATION_RENDERERS: Readonly<
  Record<WaveParticipationVariant, WaveParticipationRendererSet>
> = {
  default: {
    ParticipationDrop: DefaultParticipationDrop,
  },
  memes: {
    ParticipationDrop: MemeParticipationDrop,
  },
  curation: {
    ParticipationDrop: DefaultParticipationDrop,
  },
  quorum: {
    ParticipationDrop: QuorumParticipationDrop,
  },
};

const ProposalCardParticipationDrop: FC<ParticipationDropProps> = (props) => (
  <DefaultParticipationDrop {...props} contentPresentation="proposalCard" />
);

export const useWaveParticipationRendererSet = (
  waveId: string | null | undefined
): ResolvedWaveParticipationRendererSet => {
  const variant = useWaveParticipationVariant(waveId);
  const proposalCardPresentation = useWaveProposalCardPresentation(waveId);

  return useMemo(() => {
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
  }, [variant, proposalCardPresentation]);
};
