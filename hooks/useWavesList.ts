import { useContext, useMemo, useCallback, useRef, useEffect } from "react";
import { AuthContext } from "../components/auth/Auth";
import { useWavesOverview } from "./useWavesOverview";
import { WAVE_FOLLOWING_WAVES_PARAMS } from "../components/react-query-wrapper/utils/query-utils";
import { usePinnedWaves } from "./usePinnedWaves";
import { useWaveData } from "./useWaveData";
import { ApiWave } from "../generated/models/ApiWave";

// Custom hook to handle individual wave data
const useIndividualWaveData = (
  waveId: string | null,
  refetchInterval: number
) => {
  const { data, isLoading, isError } = useWaveData(waveId, refetchInterval);
  return { data, isLoading, isError };
};

/**
 * Hook for managing and fetching waves list including pinned waves
 * @returns Wave list data and loading states
 */
export const useWavesList = (refetchInterval = 10000) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { pinnedIds } = usePinnedWaves();
  
  // Use ref to avoid too many re-renders for derived values
  const prevMainWavesRef = useRef<ApiWave[]>([]);
  const prevPinnedWavesRef = useRef<ApiWave[]>([]);
  const allWavesRef = useRef<ApiWave[]>([]);
  
  // Track connected identity state - memoize to prevent re-renders
  const isConnectedIdentity = useMemo(() => {
    return !!connectedProfile?.profile?.handle && !activeProfileProxy;
  }, [connectedProfile?.profile?.handle, activeProfileProxy]);

  // Fetch main waves list
  const {
    waves: mainWaves,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    status: mainWavesStatus,
  } = useWavesOverview({
    type: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
    limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
    following: isConnectedIdentity,
    refetchInterval,
  });

  // Create a set of wave IDs from main waves for efficient lookup - use ref comparison to stabilize
  const mainWaveIds = useMemo(() => {
    // Only recalculate if mainWaves has actually changed
    if (mainWaves !== prevMainWavesRef.current) {
      prevMainWavesRef.current = mainWaves;
      return new Set(mainWaves.map(wave => wave.id));
    }
    return new Set(prevMainWavesRef.current.map(wave => wave.id));
  }, [mainWaves]);

  // Determine which pinned waves need individual fetching - use stable reference
  const missingPinnedIds = useMemo(() => {
    return pinnedIds.filter(id => !mainWaveIds.has(id));
  }, [pinnedIds, mainWaveIds]);

  // We'll use fixed variables for the first 10 possible pinned waves
  // This avoids React Hooks rules violation by ensuring hooks are always called in the same order
  const wave1 = useIndividualWaveData(missingPinnedIds[0] || null, refetchInterval);
  const wave2 = useIndividualWaveData(missingPinnedIds[1] || null, refetchInterval);
  const wave3 = useIndividualWaveData(missingPinnedIds[2] || null, refetchInterval);
  const wave4 = useIndividualWaveData(missingPinnedIds[3] || null, refetchInterval);
  const wave5 = useIndividualWaveData(missingPinnedIds[4] || null, refetchInterval);
  const wave6 = useIndividualWaveData(missingPinnedIds[5] || null, refetchInterval);
  const wave7 = useIndividualWaveData(missingPinnedIds[6] || null, refetchInterval);
  const wave8 = useIndividualWaveData(missingPinnedIds[7] || null, refetchInterval);
  const wave9 = useIndividualWaveData(missingPinnedIds[8] || null, refetchInterval);
  const wave10 = useIndividualWaveData(missingPinnedIds[9] || null, refetchInterval);

  // Collect all wave data in an array for easier processing - use stable references
  const waveDataArray = [wave1, wave2, wave3, wave4, wave5, wave6, wave7, wave8, wave9, wave10];
  
  // Extract the pinned waves data
  const pinnedWaves = useMemo(() => {
    const result: ApiWave[] = [];
    
    // Loop through missing pinned IDs and corresponding wave data
    missingPinnedIds.forEach((id, index) => {
      if (index < 10 && waveDataArray[index].data) {
        result.push(waveDataArray[index].data as ApiWave);
      }
    });
    
    if (JSON.stringify(result) !== JSON.stringify(prevPinnedWavesRef.current)) {
      prevPinnedWavesRef.current = result;
    }
    
    return prevPinnedWavesRef.current;
  }, [missingPinnedIds, waveDataArray]);

  // Combine main waves with pinned waves - update ref but maintain stability
  useEffect(() => {
    const newAllWaves = [...mainWaves, ...pinnedWaves];
    
    // Only update if the arrays have actually changed in content
    if (JSON.stringify(newAllWaves) !== JSON.stringify(allWavesRef.current)) {
      allWavesRef.current = newAllWaves;
    }
  }, [mainWaves, pinnedWaves]);

  // Determine if any pinned waves are still loading
  const isPinnedWavesLoading = missingPinnedIds.some((_, index) => 
    index < 10 && waveDataArray[index].isLoading
  );

  // Determine if any pinned waves had errors
  const hasPinnedWavesError = missingPinnedIds.some((_, index) => 
    index < 10 && waveDataArray[index].isError
  );

  // Memoize the fetchNextPage function to ensure it doesn't change on every render
  const fetchNextPageStable = useCallback(() => {
    return fetchNextPage();
  }, [fetchNextPage]);

  // Create a stable waves reference
  const waves = allWavesRef.current;

  return {
    // Main data
    waves,
    
    // Original waves pagination and loading
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage: fetchNextPageStable,
    status: mainWavesStatus,
    
    // Pinned waves metadata
    pinnedWaves: prevPinnedWavesRef.current,
    isPinnedWavesLoading,
    hasPinnedWavesError,
    
    // Additional data that might be useful
    mainWaves: prevMainWavesRef.current,
    missingPinnedIds,
  };
};

export default useWavesList;