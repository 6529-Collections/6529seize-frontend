"use client";

import { getWaveProposalCardRecipeFromMetadata } from "@/helpers/waves/wave-metadata.helpers";
import { useWaveDisplayMetadataOverride } from "@/contexts/WaveDisplayMetadataContext";
import type { WaveProposalCardRecipe } from "@/types/waves.types";
import { useMemo } from "react";
import { useWaveMetadata } from "./useWaveMetadata";

export const useWaveProposalCardRecipe = (
  waveId: string | null | undefined,
  { enabled = true }: { readonly enabled?: boolean | undefined } = {}
): WaveProposalCardRecipe | null => {
  const shouldLoad = Boolean(enabled && waveId);
  const override = useWaveDisplayMetadataOverride(waveId);
  const { data: waveMetadata } = useWaveMetadata(waveId, {
    enabled: shouldLoad && override === undefined,
  });
  const data = override ?? waveMetadata;

  return useMemo(() => {
    if (!shouldLoad) {
      return null;
    }

    return getWaveProposalCardRecipeFromMetadata(waveId, data);
  }, [data, shouldLoad, waveId]);
};
