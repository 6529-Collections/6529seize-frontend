import { useContext, useMemo, useCallback, useRef, useEffect, useState } from "react";
import { AuthContext } from "../components/auth/Auth";
import { useWavesOverview } from "./useWavesOverview";
import { WAVE_FOLLOWING_WAVES_PARAMS } from "../components/react-query-wrapper/utils/query-utils";
import { usePinnedWaves } from "./usePinnedWaves";
import { useWaveData } from "./useWaveData";
import { ApiWave } from "../generated/models/ApiWave";

// Enhanced wave interface with isPinned field and newDropsCount
export interface EnhancedWave extends ApiWave {
  isPinned: boolean;
  newDropsCount: number;
}

// Helper function for deep comparison of wave arrays
function areWavesEqual(arrA: EnhancedWave[], arrB: EnhancedWave[]): boolean {
  if (arrA === arrB) return true;
  if (arrA.length !== arrB.length) return false;
  
  // Compare each wave by ID, updatedAt, isPinned status, and newDropsCount
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i].id !== arrB[i].id) return false;
    if (arrA[i].updatedAt !== arrB[i].updatedAt) return false;
    if (arrA[i].isPinned !== arrB[i].isPinned) return false;
    if (arrA[i].newDropsCount !== arrB[i].newDropsCount) return false;
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
 * @param refetchInterval - Interval in ms to refetch waves
 * @param activeWaveId - ID of the currently active wave, to reset new drops count
 * @returns Wave list data and loading states
 */
export const useWavesList = (refetchInterval = 10000, activeWaveId: string | null = null) => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { pinnedIds, addId, removeId } = usePinnedWaves();
  
  // Use state for allWaves instead of ref to ensure reactivity
  const [allWaves, setAllWaves] = useState<EnhancedWave[]>([]);
  
  // State for tracking initial drops counts for waves
  const [initialDropsCounts, setInitialDropsCounts] = useState<Record<string, number>>({});
  
  // Use ref to avoid too many re-renders for derived values
  const prevMainWavesRef = useRef<ApiWave[]>([]);
  const prevPinnedWavesRef = useRef<EnhancedWave[]>([]);
  
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
    const result: EnhancedWave[] = [];
    
    // First add pinned waves from mainWaves
    pinnedIds.forEach(id => {
      const waveFromMain = mainWavesMap.get(id);
      if (waveFromMain) {
        // Add isPinned property
        result.push({ ...waveFromMain, isPinned: true });
      }
    });
    
    // Then add separately fetched pinned waves
    separatelyFetchedPinnedWaves.forEach(wave => {
      result.push({ ...wave, isPinned: true });
    });
    
    // Update the ref if content changed - still useful for comparison and memoization
    if (!areWavesEqual(result, prevPinnedWavesRef.current)) {
      prevPinnedWavesRef.current = result;
    }
    
    return result; // Return the actual result, not the ref
  }, [pinnedIds, mainWavesMap, separatelyFetchedPinnedWaves]);

  // Calculate new drops counts
  const newDropsCountsMap = useMemo(() => {
    const counts: Record<string, number> = {};
    [...mainWaves, ...separatelyFetchedPinnedWaves].forEach((wave) => {
      if (wave.id in initialDropsCounts) {
        counts[wave.id] = Math.max(0, wave.metrics.drops_count - initialDropsCounts[wave.id]);
      } else {
        counts[wave.id] = 0;
      }
    });
    return counts;
  }, [mainWaves, separatelyFetchedPinnedWaves, initialDropsCounts]);

  // Combine main waves with separately fetched pinned waves using useMemo
  // Order: pinned waves first (in pinnedIds order), then all other waves
  const combinedWaves = useMemo(() => {
    // Create a Map of all waves by ID for easy lookup
    const allWavesMap = new Map<string, ApiWave>();
    
    // Add main waves to the map
    mainWaves.forEach(wave => {
      allWavesMap.set(wave.id, wave);
    });
    
    // Add separately fetched pinned waves to the map
    separatelyFetchedPinnedWaves.forEach(wave => {
      allWavesMap.set(wave.id, wave);
    });
    
    // Result array to hold ordered waves
    const result: EnhancedWave[] = [];
    
    // First add pinned waves in the order they appear in pinnedIds
    pinnedIds.forEach(id => {
      const wave = allWavesMap.get(id);
      if (wave) {
        result.push({
          ...wave,
          isPinned: true,
          newDropsCount: newDropsCountsMap[wave.id] || 0
        });
      }
    });
    
    // Track which waves have already been added
    const addedWaveIds = new Set(result.map(w => w.id));
    
    // Add remaining mainWaves that aren't already in the result
    mainWaves.forEach(wave => {
      if (!addedWaveIds.has(wave.id)) {
        result.push({
          ...wave,
          isPinned: false, // These aren't pinned since we already added all pinned waves
          newDropsCount: newDropsCountsMap[wave.id] || 0
        });
      }
    });
    
    return result;
  }, [mainWaves, separatelyFetchedPinnedWaves, pinnedIds, newDropsCountsMap]);

  // Create a stable reference to track processed waves
  const processedWaveIds = useRef(new Set<string>());
  
  // Initialize initial drops counts for new waves - only run on waves changes, not on initialDropsCounts changes
  useEffect(() => {
    const allWavesArray = [...mainWaves, ...separatelyFetchedPinnedWaves];
    const newInitialCounts: Record<string, number> = {};
    
    // Check all waves from both sources
    allWavesArray.forEach((wave) => {
      // Only process waves we haven't seen before
      if (!processedWaveIds.current.has(wave.id)) {
        processedWaveIds.current.add(wave.id);
        newInitialCounts[wave.id] = wave.metrics.drops_count;
      }
    });
    
    if (Object.keys(newInitialCounts).length > 0) {
      // Use functional update to avoid dependency on initialDropsCounts
      setInitialDropsCounts(prev => ({
        ...prev,
        ...newInitialCounts
      }));
    }
  }, [mainWaves, separatelyFetchedPinnedWaves]); // Explicitly exclude initialDropsCounts

  // Track last active wave ID to prevent unnecessary resets
  const lastActiveWaveIdRef = useRef<string | null>(null);
  
  // Reset function for when a wave becomes active or upon manual reset
  const resetWaveNewDropsCount = useCallback((waveId: string) => {
    // Bail early if we don't have this wave or no waves at all
    if (!waveId || mainWaves.length === 0) return;
    
    const wave = [...mainWaves, ...separatelyFetchedPinnedWaves].find((w) => w.id === waveId);
    if (wave) {
      setInitialDropsCounts((prev) => ({
        ...prev,
        [waveId]: wave.metrics.drops_count,
      }));
    }
  }, [mainWaves, separatelyFetchedPinnedWaves]);

  // Auto-reset active wave count - with safeguards against infinite loops
  useEffect(() => {
    if (activeWaveId && activeWaveId !== lastActiveWaveIdRef.current) {
      lastActiveWaveIdRef.current = activeWaveId;
      
      // Find the wave first to make sure it exists
      const wave = [...mainWaves, ...separatelyFetchedPinnedWaves].find(
        (w) => w.id === activeWaveId
      );
      
      // Only reset if we actually found the wave
      if (wave) {
        // Use direct state update instead of calling the function
        setInitialDropsCounts((prev) => ({
          ...prev,
          [activeWaveId]: wave.metrics.drops_count,
        }));
      }
    }
  }, [activeWaveId, mainWaves, separatelyFetchedPinnedWaves]);

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
    // Main data - now using state instead of ref, with enhanced type
    waves: allWaves,
    
    // Original waves pagination and loading
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage: fetchNextPageStable,
    status: mainWavesStatus,
    
    // Pinned waves metadata - now includes ALL pinned waves with isPinned flag
    pinnedWaves: allPinnedWaves,
    isPinnedWavesLoading,
    hasPinnedWavesError,
    
    // Pinned waves management functions
    addPinnedWave: addId,
    removePinnedWave: removeId,
    
    // New drops count management
    resetWaveNewDropsCount,
    
    // Additional data that might be useful
    mainWaves: prevMainWavesRef.current,
    missingPinnedIds
  };
};

export default useWavesList;
