import {
  useContext,
  useMemo,
  useCallback,
  useRef,
  useEffect,
  useState,
} from "react";
import { AuthContext } from "../components/auth/Auth";
import { useWavesOverview } from "./useWavesOverview";
import { WAVE_FOLLOWING_WAVES_PARAMS } from "../components/react-query-wrapper/utils/query-utils";
import { usePinnedWaves } from "./usePinnedWaves";
import { useWaveData } from "./useWaveData";
import { ApiWave } from "../generated/models/ApiWave";
import { useShowFollowingWaves } from "./useShowFollowingWaves";

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
  const { pinnedIds, addId, removeId } = usePinnedWaves();
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

  // Determine which pinned waves need individual fetching
  const missingPinnedIds = useMemo(() => {
    return pinnedIds.filter((id) => !mainWaveIds.has(id));
  }, [pinnedIds, mainWaveIds]);

  const removePinnedId = (id: string | null) => {
    if (id) {
      removeId(id);
    }
  };

  // We'll use fixed variables for the first 10 possible pinned waves
  // This avoids React Hooks rules violation by ensuring hooks are always called in the same order
  const wave1 = useIndividualWaveData(missingPinnedIds[0] ?? null, () => {
    removePinnedId(missingPinnedIds[0]);
  });
  const wave2 = useIndividualWaveData(missingPinnedIds[1] ?? null, () => {
    removePinnedId(missingPinnedIds[1]);
  });
  const wave3 = useIndividualWaveData(missingPinnedIds[2] ?? null, () => {
    removePinnedId(missingPinnedIds[2]);
  });
  const wave4 = useIndividualWaveData(missingPinnedIds[3] ?? null, () => {
    removePinnedId(missingPinnedIds[3]);
  });
  const wave5 = useIndividualWaveData(missingPinnedIds[4] ?? null, () => {
    removePinnedId(missingPinnedIds[4]);
  });
  const wave6 = useIndividualWaveData(missingPinnedIds[5] ?? null, () => {
    removePinnedId(missingPinnedIds[5]);
  });
  const wave7 = useIndividualWaveData(missingPinnedIds[6] ?? null, () => {
    removePinnedId(missingPinnedIds[6]);
  });
  const wave8 = useIndividualWaveData(missingPinnedIds[7] ?? null, () => {
    removePinnedId(missingPinnedIds[7]);
  });
  const wave9 = useIndividualWaveData(missingPinnedIds[8] ?? null, () => {
    removePinnedId(missingPinnedIds[8]);
  });
  const wave10 = useIndividualWaveData(missingPinnedIds[9] ?? null, () => {
    removePinnedId(missingPinnedIds[9]);
  });

  // Collect all wave data in an array for easier processing
  const waveDataArray = [
    wave1,
    wave2,
    wave3,
    wave4,
    wave5,
    wave6,
    wave7,
    wave8,
    wave9,
    wave10,
  ];
  // Function to refetch all waves (main and pinned)
  const refetchAllWaves = useCallback(() => {
    // Refetch main waves overview
    mainWavesRefetch();
    // Refetch individually fetched pinned waves
    waveDataArray.forEach(({ refetch }) => {
      if (refetch) {
        refetch();
      }
    });
  }, [mainWavesRefetch, waveDataArray]);

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
    pinnedIds.forEach((id) => {
      const waveFromMain = mainWavesMap.get(id);
      if (waveFromMain) {
        // Add isPinned property
        result.push({ ...waveFromMain, isPinned: true });
      }
    });

    // Then add separately fetched pinned waves
    separatelyFetchedPinnedWaves.forEach((wave) => {
      result.push({ ...wave, isPinned: true });
    });

    // Update the ref if content changed - still useful for comparison and memoization
    if (!areWavesEqual(result, prevPinnedWavesRef.current)) {
      prevPinnedWavesRef.current = result;
    }

    return result; // Return the actual result, not the ref
  }, [pinnedIds, mainWavesMap, separatelyFetchedPinnedWaves]);

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

      allWavesArray.push({
        ...wave,
        isPinned,
      });
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

  // Determine if any pinned waves are still loading
  const isPinnedWavesLoading = missingPinnedIds.some(
    (_, index) => index < 10 && waveDataArray[index].isLoading
  );

  // Determine if any pinned waves had errors
  const hasPinnedWavesError = missingPinnedIds.some(
    (_, index) => index < 10 && waveDataArray[index].isError
  );

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
      addPinnedWave: addId,
      removePinnedWave: removeId,

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
      addId,
      removeId,
      prevMainWavesRef.current,
      missingPinnedIds,
      mainWavesRefetch,
      refetchAllWaves,
    ]
  );
};

export default useWavesList;
