import { useContext, useMemo, useCallback, useRef, useEffect, useState } from "react";
import { AuthContext } from "../components/auth/Auth";
import { useWavesOverview } from "./useWavesOverview";
import { WAVE_FOLLOWING_WAVES_PARAMS } from "../components/react-query-wrapper/utils/query-utils";
import { usePinnedWaves } from "./usePinnedWaves";
import { useWaveData } from "./useWaveData";
import { ApiWave } from "../generated/models/ApiWave";

// Helper function for deep comparison of wave arrays
function areWavesEqual(arrA: ApiWave[], arrB: ApiWave[]): boolean {
  if (arrA === arrB) return true;
  if (arrA.length !== arrB.length) return false;
  
  // Compare each wave by ID and basic properties
  // This is more efficient than a full deep equality check
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i].id !== arrB[i].id) return false;
    if (arrA[i].updatedAt !== arrB[i].updatedAt) return false;
  }
  
  return true;
}

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
  const { pinnedIds, addId, removeId } = usePinnedWaves();
  
  // Use state for allWaves instead of ref to ensure reactivity
  const [allWaves, setAllWaves] = useState<ApiWave[]>([]);
  
  // Use ref to avoid too many re-renders for derived values
  const prevMainWavesRef = useRef<ApiWave[]>([]);
  const prevPinnedWavesRef = useRef<ApiWave[]>([]);
  
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
    
    // Update the ref if content changed - still useful for comparison and memoization
    if (!areWavesEqual(result, prevPinnedWavesRef.current)) {
      prevPinnedWavesRef.current = result;
    }
    
    return result; // Return the actual result, not the ref
  }, [pinnedIds, mainWavesMap, separatelyFetchedPinnedWaves]);

  // Combine main waves with separately fetched pinned waves using useMemo
  const combinedWaves = useMemo(() => {
    return [...mainWaves, ...separatelyFetchedPinnedWaves];
  }, [mainWaves, separatelyFetchedPinnedWaves]);

  // Update allWaves state when the combined waves change
  useEffect(() => {
    if (!areWavesEqual(combinedWaves, allWaves)) {
      setAllWaves(combinedWaves);
    }
  }, [combinedWaves, allWaves]);

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
    // Main data - now using state instead of ref
    waves: allWaves,
    
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
    
    // Pinned waves management functions
    addPinnedWave: addId,
    removePinnedWave: removeId,
    
    // Additional data that might be useful
    mainWaves: prevMainWavesRef.current,
    missingPinnedIds,
  };
};

export default useWavesList;
