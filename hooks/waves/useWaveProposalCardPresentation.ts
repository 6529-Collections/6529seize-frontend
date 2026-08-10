"use client";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";
import { getWaveProposalCardsEnabledFromMetadata } from "@/helpers/waves/wave-metadata.helpers";
import { useWaveMetadata } from "./useWaveMetadata";

export const useWaveProposalCardPresentation = (
  waveId: string | null | undefined
): DropContentPresentation => {
  const { isMemesWave, isCurationWave, isQuorumWave } = useSeizeSettings();
  const hasSpecializedPresentation =
    isMemesWave(waveId) || isCurationWave(waveId) || isQuorumWave(waveId);
  const { data } = useWaveMetadata(waveId, {
    enabled: Boolean(waveId && !hasSpecializedPresentation),
  });

  if (
    !waveId ||
    hasSpecializedPresentation ||
    !getWaveProposalCardsEnabledFromMetadata(waveId, data)
  ) {
    return "default";
  }

  return "proposalCard";
};
