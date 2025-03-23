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

  // Create a map of mainWaves by ID for easy lookup
  const mainWavesMap = useMemo(() => {
    const map = new Map<string, ApiWave>();
    mainWaves.forEach(wave => map.set(wave.id, wave));
    prevMainWavesRef.current = mainWaves;
    return map;
  }, [mainWaves]);

  // Set of wave IDs in the main list for quick checking
  const mainWaveIds = useMemo(() => {
    return new Set(mainWavesMap.keys());
  }, [mainWavesMap]);

  // Determine which pinned waves need individual fetching
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

  // Collect all wave data in an array for easier processing
  const waveDataArray = [wave1, wave2, wave3, wave4, wave5, wave6, wave7, wave8, wave9, wave10];
  
  // Get separately fetched pinned waves
  const separatelyFetchedPinnedWaves = useMemo(() => {
    const result: ApiWave[] = [];
    
    // Loop through missing pinned IDs and corresponding wave data
    missingPinnedIds.forEach((id, index) => {
      if (index < 10 && waveDataArray[index].data) {
        result.push(waveDataArray[index].data as ApiWave);
      }
    });
    
    return result;
  }, [missingPinnedIds, waveDataArray]);

  // Collect ALL pinned waves (both from mainWaves and separately fetched)
  const allPinnedWaves = useMemo(() => {
    const result: ApiWave[] = [];
    
    // First add pinned waves from mainWaves
    pinnedIds.forEach(id => {
      const waveFromMain = mainWavesMap.get(id);
      if (waveFromMain) {
        result.push(waveFromMain);
      }
    });
    
    // Then add separately fetched pinned waves
    result.push(...separatelyFetchedPinnedWaves);
    
    // Update the ref if content changed
    if (JSON.stringify(result) !== JSON.stringify(prevPinnedWavesRef.current)) {
      prevPinnedWavesRef.current = result;
    }
    
    return prevPinnedWavesRef.current;
  }, [pinnedIds, mainWavesMap, separatelyFetchedPinnedWaves]);

  // Combine main waves with separately fetched pinned waves
  useEffect(() => {
    const newAllWaves = [...mainWaves, ...separatelyFetchedPinnedWaves];
    
    // Only update if the arrays have actually changed in content
    if (JSON.stringify(newAllWaves) !== JSON.stringify(allWavesRef.current)) {
      allWavesRef.current = newAllWaves;
    }
  }, [mainWaves, separatelyFetchedPinnedWaves]);

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

  return {
    // Main data
    waves: allWavesRef.current,
    
    // Original waves pagination and loading
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage: fetchNextPageStable,
    status: mainWavesStatus,
    
    // Pinned waves metadata - now includes ALL pinned waves
    pinnedWaves: allPinnedWaves,
    isPinnedWavesLoading,
    hasPinnedWavesError,
    
    // Additional data that might be useful
    mainWaves: prevMainWavesRef.current,
    missingPinnedIds,
  };
};

export default useWavesList;