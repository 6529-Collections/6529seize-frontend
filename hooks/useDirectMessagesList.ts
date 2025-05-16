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

interface EnhancedWave extends ApiWave {
  isPinned: boolean;
}

function areWavesEqual(arrA: EnhancedWave[], arrB: EnhancedWave[]): boolean {
  if (arrA === arrB) return true;
  if (arrA.length !== arrB.length) return false;
  for (let i = 0; i < arrA.length; i++) {
    if (arrA[i].id !== arrB[i].id) return false;
    if (arrA[i].created_at !== arrB[i].created_at) return false;
    if (arrA[i].isPinned !== arrB[i].isPinned) return false;
  }
  return true;
}

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

const useDirectMessagesList = () => {
  const { connectedProfile, activeProfileProxy } = useContext(AuthContext);
  const { pinnedIds, addId, removeId } = usePinnedWaves();
  const [following] = useShowFollowingWaves();

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
    following: isConnectedIdentity && following, // This might need adjustment for DMs - DMs might not be "followed"
    directMessageType: "dms_only", 
  });

  const mainWavesMap = useMemo(() => {
    const map = new Map<string, ApiWave>();
    mainWaves.forEach((wave) => map.set(wave.id, wave));
    prevMainWavesRef.current = mainWaves;
    return map;
  }, [mainWaves]);

  const mainWaveIds = useMemo(() => {
    return new Set(mainWavesMap.keys());
  }, [mainWavesMap]);

  const missingPinnedIds = useMemo(() => {
    return pinnedIds.filter((id) => !mainWaveIds.has(id));
  }, [pinnedIds, mainWaveIds]);

  const removePinnedId = (id: string | null) => {
    if (id) {
      removeId(id);
    }
  };

  const wave1 = useIndividualWaveData(missingPinnedIds[0] ?? null, () => removePinnedId(missingPinnedIds[0]));
  const wave2 = useIndividualWaveData(missingPinnedIds[1] ?? null, () => removePinnedId(missingPinnedIds[1]));
  const wave3 = useIndividualWaveData(missingPinnedIds[2] ?? null, () => removePinnedId(missingPinnedIds[2]));
  const wave4 = useIndividualWaveData(missingPinnedIds[3] ?? null, () => removePinnedId(missingPinnedIds[3]));
  const wave5 = useIndividualWaveData(missingPinnedIds[4] ?? null, () => removePinnedId(missingPinnedIds[4]));
  const wave6 = useIndividualWaveData(missingPinnedIds[5] ?? null, () => removePinnedId(missingPinnedIds[5]));
  const wave7 = useIndividualWaveData(missingPinnedIds[6] ?? null, () => removePinnedId(missingPinnedIds[6]));
  const wave8 = useIndividualWaveData(missingPinnedIds[7] ?? null, () => removePinnedId(missingPinnedIds[7]));
  const wave9 = useIndividualWaveData(missingPinnedIds[8] ?? null, () => removePinnedId(missingPinnedIds[8]));
  const wave10 = useIndividualWaveData(missingPinnedIds[9] ?? null, () => removePinnedId(missingPinnedIds[9]));

  const waveDataArray = useMemo(() => [
    wave1, wave2, wave3, wave4, wave5, wave6, wave7, wave8, wave9, wave10
  ], [wave1, wave2, wave3, wave4, wave5, wave6, wave7, wave8, wave9, wave10]);

  const refetchAllWaves = useCallback(() => {
    mainWavesRefetch();
    waveDataArray.forEach(({ refetch }) => {
      if (refetch) refetch();
    });
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
      if (waveFromMain) {
        result.push({ ...waveFromMain, isPinned: true });
      }
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

    const pinnedWavesSet = new Set(pinnedIds);
    const allEnhancedWaves: EnhancedWave[] = [];

    const processedIds = new Set<string>();

    [...mainWaves, ...separatelyFetchedPinnedWaves].forEach((wave) => {
      if (processedIds.has(wave.id)) return;
      processedIds.add(wave.id);
      
      const isPinned = pinnedWavesSet.has(wave.id);
      allEnhancedWaves.push({
        ...wave,
        isPinned,
      });
    });

    allEnhancedWaves.sort(
      (a, b) => b.metrics.latest_drop_timestamp - a.metrics.latest_drop_timestamp
    );
    return allEnhancedWaves;
  }, [mainWaves, separatelyFetchedPinnedWaves, pinnedIds]);

  const returnValue = useMemo(() => ({
    waves: combinedWaves,
    isLoading: mainWavesStatus === "pending" || waveDataArray.some(w => w.isLoading),
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    status: mainWavesStatus,
    refetchWaves: refetchAllWaves,
    addPinnedId: addId,
    removePinnedId,
    pinnedIds,
    allPinnedWaves,
  }), [
    combinedWaves,
    mainWavesStatus,
    waveDataArray,
    isFetching,
    isFetchingNextPage,
    hasNextPage,
    fetchNextPage,
    refetchAllWaves,
    addId,
    removePinnedId,
    pinnedIds,
    allPinnedWaves,
  ]);

  return returnValue;
};

export { useDirectMessagesList }; 