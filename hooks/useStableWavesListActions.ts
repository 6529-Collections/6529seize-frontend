"use client";

import { useMemo } from "react";
import { useStableCallback } from "./useStableIdentity";

interface WavesListActions {
  readonly fetchNextPage: () => void;
  readonly retryLoading: () => void;
  readonly retryRecommendations: () => void;
  readonly addPinnedWave: (waveId: string) => Promise<void> | undefined;
  readonly removePinnedWave: (waveId: string) => Promise<void> | undefined;
  readonly mainWavesRefetch: () => void;
  readonly refetchAllWaves: () => void;
  readonly refreshActivityList: () => void;
  readonly refreshStaleWaves: () => void;
  readonly loadSubwavesForParent: (parentWaveId: string) => void;
  readonly prefetchSubwavesForParent: (parentWaveId: string) => void;
}

/**
 * The wave list's actions with identities that never change; each runs the
 * latest implementation. Query results hand back new functions on every
 * render, and the stream context should only change when data does.
 */
export function useStableWavesListActions(
  actions: WavesListActions
): WavesListActions {
  const fetchNextPage = useStableCallback(actions.fetchNextPage);
  const retryLoading = useStableCallback(actions.retryLoading);
  const retryRecommendations = useStableCallback(actions.retryRecommendations);
  const addPinnedWave = useStableCallback(actions.addPinnedWave);
  const removePinnedWave = useStableCallback(actions.removePinnedWave);
  const mainWavesRefetch = useStableCallback(actions.mainWavesRefetch);
  const refetchAllWaves = useStableCallback(actions.refetchAllWaves);
  const refreshActivityList = useStableCallback(actions.refreshActivityList);
  const refreshStaleWaves = useStableCallback(actions.refreshStaleWaves);
  const loadSubwavesForParent = useStableCallback(
    actions.loadSubwavesForParent
  );
  const prefetchSubwavesForParent = useStableCallback(
    actions.prefetchSubwavesForParent
  );
  return useMemo(
    () => ({
      fetchNextPage,
      retryLoading,
      retryRecommendations,
      addPinnedWave,
      removePinnedWave,
      mainWavesRefetch,
      refetchAllWaves,
      refreshActivityList,
      refreshStaleWaves,
      loadSubwavesForParent,
      prefetchSubwavesForParent,
    }),
    [
      fetchNextPage,
      retryLoading,
      retryRecommendations,
      addPinnedWave,
      removePinnedWave,
      mainWavesRefetch,
      refetchAllWaves,
      refreshActivityList,
      refreshStaleWaves,
      loadSubwavesForParent,
      prefetchSubwavesForParent,
    ]
  );
}
