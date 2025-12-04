"use client";

import {
  useContext,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import { AuthContext } from "@/components/auth/Auth";
import { useWavesOverview } from "./useWavesOverview";
import { WAVE_FOLLOWING_WAVES_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import { usePinnedWavesServer } from "./usePinnedWavesServer";
import { useWaveData } from "./useWaveData";
import { ApiWave } from "@/generated/models/ApiWave";
import { useShowFollowingWaves } from "./useShowFollowingWaves";
import { ApiWaveType } from "@/generated/models/ApiWaveType";

// Enhanced wave interface with isPinned field and newDropsCount
interface EnhancedWave extends ApiWave {
  isPinned: boolean;
}

// Helper function for deep comparison of wave arrays
function areWavesEqual(arrA: EnhancedWave[], arrB: EnhancedWave[]): boolean {
  if (arrA === arrB) return true;
  if (arrA.length !== arrB.length) return false;

  // Compare each wave by ID, updatedAt, and isPinned status
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i].id !== arrB[i].id) return false;
    if (arrA[i].created_at !== arrB[i].created_at) return false;
    if (arrA[i].isPinned !== arrB[i].isPinned) return false;
  }

  return true;
}

// Custom hook to handle individual wave data
const useIndividualWaveData = (
  waveId: string | null,
  onWaveNotFound: () => void = () => {}
) => {
  const { data, isLoading, isError, refetch } = useWaveData({
    waveId,
    onWaveNotFound,
  });
  return { data, isLoading, isError, refetch };
};

/**
 * Hook for managing and fetching waves list including pinned waves
 * @returns Wave list data and loading states
 */
const useWavesList = () => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { 
    pinnedIds, 
    pinnedWaves: serverPinnedWaves, 
    pinWave, 
    unpinWave, 
    isLoading: isPinnedWavesLoadingServer,
    isError: hasPinnedWavesErrorServer,
    refetch: refetchPinnedWaves
  } = usePinnedWavesServer();
  const [following] = useShowFollowingWaves();
  // Use state for allWaves instead of ref to ensure reactivity
  const [allWaves, setAllWaves] = useState<EnhancedWave[]>([]);

  // Use ref to avoid too many re-renders for derived values
  const prevMainWavesRef = useRef<ApiWave[]>([]);
  const prevPinnedWavesRef = useRef<EnhancedWave[]>([]);

  // Track connected identity state - memoize to prevent re-renders
  const isConnectedIdentity = useMemo(() => {
    return !!connectedProfile?.handle && !activeProfileProxy;
  }, [connectedProfile?.handle, activeProfileProxy]);

  // Fetch main waves list
  const {
    waves: mainWaves,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    status: mainWavesStatus,
    refetch: mainWavesRefetch,
  } = useWavesOverview({
    type: WAVE_FOLLOWING_WAVES_PARAMS.initialWavesOverviewType,
    limit: WAVE_FOLLOWING_WAVES_PARAMS.limit,
    following: isConnectedIdentity && following,
  });

  // Create a map of mainWaves by ID for easy lookup
  const mainWavesMap = useMemo(() => {
    const map = new Map<string, ApiWave>();
    mainWaves.forEach((wave) => map.set(wave.id, wave));
    prevMainWavesRef.current = mainWaves;
    return map;
  }, [mainWaves]);

  // Set of wave IDs in the main list for quick checking
  const mainWaveIds = useMemo(() => {
    return new Set(mainWavesMap.keys());
  }, [mainWavesMap]);

  // Server provides full pinned waves data, so no individual fetching needed
  const missingPinnedIds: string[] = [];
  // Function to refetch all waves (main and pinned)
  const refetchAllWaves = useCallback(() => {
    // Refetch main waves overview
    mainWavesRefetch();
    // Refetch server-side pinned waves
    refetchPinnedWaves();
  }, [mainWavesRefetch, refetchPinnedWaves]);

  // Use server-provided pinned waves
  const separatelyFetchedPinnedWaves = useMemo(() => {
    // Filter out pinned waves that are already in mainWaves to avoid duplicates
    return serverPinnedWaves.filter(wave => !mainWaveIds.has(wave.id));
  }, [serverPinnedWaves, mainWaveIds]);

  // Collect ALL pinned waves (both from mainWaves and server-provided)
  const allPinnedWaves = useMemo(() => {
    const result: EnhancedWave[] = [];

    // Add all server-provided pinned waves, filtering out DMs
    serverPinnedWaves.forEach((wave) => {
      if (!waveIsDm(wave)) {
        result.push({ ...wave, isPinned: true });
      }
    });

    // Update the ref if content changed - still useful for comparison and memoization
    if (!areWavesEqual(result, prevPinnedWavesRef.current)) {
      prevPinnedWavesRef.current = result;
    }

    return result; // Return the actual result, not the ref
  }, [serverPinnedWaves]);

  // New drops counts are now managed externally

  // Combine main waves with separately fetched pinned waves using useMemo
  // Simplified order: All waves sorted by latest_drop_timestamp (most recent first)
  const combinedWaves = useMemo(() => {
    // Create a Map of all waves by ID for easy lookup
    const allWavesMap = new Map<string, ApiWave>();

    // Add main waves to the map
    mainWaves.forEach((wave) => {
      allWavesMap.set(wave.id, wave);
    });

    // Add separately fetched pinned waves to the map
    separatelyFetchedPinnedWaves.forEach((wave) => {
      allWavesMap.set(wave.id, wave);
    });

    // Process pinned waves first to mark them accordingly
    const pinnedWavesSet = new Set(pinnedIds);

    // Create array of all waves
    const allWavesArray: EnhancedWave[] = [];

    // Process all waves and add them to the array
    [...mainWaves, ...separatelyFetchedPinnedWaves].forEach((wave) => {
      // Skip duplicates (waves that appear in both collections)
      if (!allWavesMap.has(wave.id)) return;

      // Remove from map to avoid processing twice
      allWavesMap.delete(wave.id);

      const isPinned = pinnedWavesSet.has(wave.id);

      if (!waveIsDm(wave)) {
        allWavesArray.push({
          ...wave,
          isPinned,
        });
      }
    });

    // Sort all waves by latest_drop_timestamp (most recent first)
    allWavesArray.sort(
      (a, b) =>
        b.metrics.latest_drop_timestamp - a.metrics.latest_drop_timestamp
    );

    return allWavesArray;
  }, [mainWaves, separatelyFetchedPinnedWaves, pinnedIds]);

  // New drops counting logic has been removed and will be managed by context

  // Update allWaves state when the combined waves change
  useEffect(() => {
    // Using a functional update and removing the allWaves dependency
    // to break the infinite update cycle
    setAllWaves((prevWaves) => {
      return !areWavesEqual(combinedWaves, prevWaves)
        ? combinedWaves
        : prevWaves;
    });
  }, [combinedWaves]);

  // Use server-side loading and error states
  const isPinnedWavesLoading = isPinnedWavesLoadingServer;
  const hasPinnedWavesError = hasPinnedWavesErrorServer;

  // Memoize the fetchNextPage function to ensure it doesn't change on every render
  const fetchNextPageStable = useCallback(() => {
    return fetchNextPage();
  }, [fetchNextPage]);

  // Memoize the entire return object to prevent unnecessary re-renders in consumer components
  // Components using this hook will only re-render when the values they use actually change
  return useMemo(
    () => ({
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
      addPinnedWave: pinWave,
      removePinnedWave: unpinWave,

      // Additional data that might be useful
      mainWaves: prevMainWavesRef.current,
      missingPinnedIds,
      mainWavesRefetch,
      // Refetch all waves including main and pinned
      refetchAllWaves,
    }),
    [
      allWaves,
      isFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPageStable,
      mainWavesStatus,
      allPinnedWaves,
      isPinnedWavesLoading,
      hasPinnedWavesError,
      pinWave,
      unpinWave,
      prevMainWavesRef.current,
      missingPinnedIds,
      mainWavesRefetch,
      refetchAllWaves,
    ]
  );
};

const waveIsDm = (w: ApiWave) =>
  w.wave.type === ApiWaveType.Chat &&
   
  (w.chat as any)?.scope?.group?.is_direct_message === true;

export default useWavesList;
