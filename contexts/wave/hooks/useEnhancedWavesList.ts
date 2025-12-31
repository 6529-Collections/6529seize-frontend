"use client";

import useWavesList from "@/hooks/useWavesList";
import useEnhancedWavesListCore from "./useEnhancedWavesListCore";

export type { MinimalWave } from "./useEnhancedWavesListCore";

function useEnhancedWavesList(activeWaveId: string | null) {
  const wavesData = useWavesList();

  return useEnhancedWavesListCore(activeWaveId, wavesData, {
    supportsPinning: true,
  });
}

export default useEnhancedWavesList;
