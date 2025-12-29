"use client";

import useDmWavesList from "@/hooks/useDmWavesList";
import useEnhancedWavesListCore from "./useEnhancedWavesListCore";

export type { MinimalWave } from "./useEnhancedWavesListCore";

function useEnhancedDmWavesList(activeWaveId: string | null) {
  const wavesData = useDmWavesList();

  return useEnhancedWavesListCore(activeWaveId, wavesData, {
    supportsPinning: false,
  });
}

export default useEnhancedDmWavesList;
