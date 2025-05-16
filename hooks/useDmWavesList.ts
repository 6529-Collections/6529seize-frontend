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
 * Direct-message variant of useWavesList – identical logic but fetches only DM waves.
 */
const useDmWavesList = () => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { pinnedIds, addId, removeId } = usePinnedWaves();
  const [following] = useShowFollowingWaves();
  const [allWaves, setAllWaves] = useState<EnhancedWave[]>([]);

  const prevMainWavesRef = useRef<ApiWave[]>([]);
  const prevPinnedWavesRef = useRef<EnhancedWave[]>([]);

  const isConnectedIdentity = useMemo(() => {
    return !!connectedProfile?.handle && !activeProfileProxy;
  }, [connectedProfile?.handle, activeProfileProxy]);

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
    directMessage: true,
  });

  const mainWavesMap = useMemo(() => {
    const map = new Map<string, ApiWave>();
    mainWaves.forEach((wave) => map.set(wave.id, wave));
    prevMainWavesRef.current = mainWaves;
    return map;
  }, [mainWaves]);

  const mainWaveIds = useMemo(() => new Set(mainWavesMap.keys()), [mainWavesMap]);

  const missingPinnedIds = useMemo(
    () => pinnedIds.filter((id) => !mainWaveIds.has(id)),
    [pinnedIds, mainWaveIds]
  );

  const removePinnedId = (id: string | null) => {
    if (id) removeId(id);
  };

  const waveDataArray = [
    useIndividualWaveData(missingPinnedIds[0] ?? null, () => removePinnedId(missingPinnedIds[0])),
    useIndividualWaveData(missingPinnedIds[1] ?? null, () => removePinnedId(missingPinnedIds[1])),
    useIndividualWaveData(missingPinnedIds[2] ?? null, () => removePinnedId(missingPinnedIds[2])),
    useIndividualWaveData(missingPinnedIds[3] ?? null, () => removePinnedId(missingPinnedIds[3])),
    useIndividualWaveData(missingPinnedIds[4] ?? null, () => removePinnedId(missingPinnedIds[4])),
    useIndividualWaveData(missingPinnedIds[5] ?? null, () => removePinnedId(missingPinnedIds[5])),
    useIndividualWaveData(missingPinnedIds[6] ?? null, () => removePinnedId(missingPinnedIds[6])),
    useIndividualWaveData(missingPinnedIds[7] ?? null, () => removePinnedId(missingPinnedIds[7])),
    useIndividualWaveData(missingPinnedIds[8] ?? null, () => removePinnedId(missingPinnedIds[8])),
    useIndividualWaveData(missingPinnedIds[9] ?? null, () => removePinnedId(missingPinnedIds[9])),
  ];

  const refetchAllWaves = useCallback(() => {
    mainWavesRefetch();
    waveDataArray.forEach(({ refetch }) => refetch && refetch());
  }, [mainWavesRefetch, waveDataArray]);

  const separatelyFetchedPinnedWaves = useMemo(() => {
    const result: ApiWave[] = [];
    missingPinnedIds.forEach((id, index) => {
      if (index < 10 && waveDataArray[index].data) {
        result.push(waveDataArray[index].data as ApiWave);
      }
    });
    return result;
  }, [missingPinnedIds, waveDataArray]);

  const allPinnedWaves = useMemo(() => {
    const result: EnhancedWave[] = [];
    pinnedIds.forEach((id) => {
      const waveFromMain = mainWavesMap.get(id);
      if (waveFromMain) result.push({ ...waveFromMain, isPinned: true });
    });
    separatelyFetchedPinnedWaves.forEach((wave) => {
      result.push({ ...wave, isPinned: true });
    });
    if (!areWavesEqual(result, prevPinnedWavesRef.current)) {
      prevPinnedWavesRef.current = result;
    }
    return result;
  }, [pinnedIds, mainWavesMap, separatelyFetchedPinnedWaves]);

  const combinedWaves = useMemo(() => {
    const allWavesMap = new Map<string, ApiWave>();
    mainWaves.forEach((wave) => allWavesMap.set(wave.id, wave));
    separatelyFetchedPinnedWaves.forEach((wave) => allWavesMap.set(wave.id, wave));
    const pinnedSet = new Set(pinnedIds);
    const arr: EnhancedWave[] = [];
    [...mainWaves, ...separatelyFetchedPinnedWaves].forEach((wave) => {
      if (!allWavesMap.has(wave.id)) return;
      allWavesMap.delete(wave.id);
      arr.push({ ...wave, isPinned: pinnedSet.has(wave.id) });
    });
    arr.sort((a, b) => b.metrics.latest_drop_timestamp - a.metrics.latest_drop_timestamp);
    return arr;
  }, [mainWaves, separatelyFetchedPinnedWaves, pinnedIds]);

  useEffect(() => {
    setAllWaves((prev) => (areWavesEqual(prev, combinedWaves) ? prev : combinedWaves));
  }, [combinedWaves]);

  const isPinnedWavesLoading = missingPinnedIds.some((_, idx) => idx < 10 && waveDataArray[idx].isLoading);
  const hasPinnedWavesError = missingPinnedIds.some((_, idx) => idx < 10 && waveDataArray[idx].isError);

  const fetchNextPageStable = useCallback(() => fetchNextPage(), [fetchNextPage]);

  return useMemo(
    () => ({
      waves: allWaves,
      isFetching,
      isFetchingNextPage,
      hasNextPage,
      fetchNextPage: fetchNextPageStable,
      status: mainWavesStatus,
      pinnedWaves: allPinnedWaves,
      isPinnedWavesLoading,
      hasPinnedWavesError,
      addPinnedWave: addId,
      removePinnedWave: removeId,
      mainWaves: prevMainWavesRef.current,
      missingPinnedIds,
      mainWavesRefetch,
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

export default useDmWavesList; 