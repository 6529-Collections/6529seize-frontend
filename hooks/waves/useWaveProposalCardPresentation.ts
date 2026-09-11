"use client";

import { useSeizeSettings } from "@/contexts/SeizeSettingsContext";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";
import { useWaveProposalCardRecipe } from "./useWaveProposalCardRecipe";

export const useWaveProposalCardPresentation = (
  waveId: string | null | undefined
): DropContentPresentation => {
  const { isMemesWave, isCurationWave, isQuorumWave } = useSeizeSettings();
  const hasSpecializedPresentation =
    isMemesWave(waveId) || isCurationWave(waveId) || isQuorumWave(waveId);
  const recipe = useWaveProposalCardRecipe(waveId, {
    enabled: Boolean(waveId && !hasSpecializedPresentation),
  });

  if (!waveId || hasSpecializedPresentation || !recipe) {
    return "default";
  }

  return "proposalCard";
};
