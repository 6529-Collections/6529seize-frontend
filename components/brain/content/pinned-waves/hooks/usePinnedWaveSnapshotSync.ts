import { useCallback, useEffect, useRef } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import {
  isPinnedWaveSnapshotStale,
  usePinnedWaves,
} from "@/hooks/usePinnedWaves";
import { commonApiFetch } from "@/services/api/common-api";

const MAX_CONCURRENT_PINNED_WAVE_REFRESHES = 2;

interface UsePinnedWaveSnapshotSyncProps {
  readonly currentWaveId: string | null;
  readonly currentWave: ApiWave | undefined;
  readonly currentWaveIsDirectMessage: boolean;
}

export function usePinnedWaveSnapshotSync({
  currentWaveId,
  currentWave,
  currentWaveIsDirectMessage,
}: UsePinnedWaveSnapshotSyncProps) {
  const { pinnedWaves, upsertWave, upsertWaveSnapshot, removeId } =
    usePinnedWaves();
  const isMountedRef = useRef(true);
  const pinnedWavesRef = useRef(pinnedWaves);
  const queuedRefreshIdsRef = useRef<Set<string>>(new Set());
  const refreshQueueRef = useRef<string[]>([]);
  const refreshingIdsRef = useRef<Set<string>>(new Set());
  const activeRefreshCountRef = useRef(0);

  useEffect(() => {
    pinnedWavesRef.current = pinnedWaves;
  }, [pinnedWaves]);

  useEffect(() => {
    const queuedRefreshIds = queuedRefreshIdsRef.current;
    const refreshingIds = refreshingIdsRef.current;

    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      queuedRefreshIds.clear();
      refreshQueueRef.current = [];
      refreshingIds.clear();
      activeRefreshCountRef.current = 0;
    };
  }, []);

  const flushPinnedWaveRefreshQueue = useCallback(() => {
    while (
      activeRefreshCountRef.current < MAX_CONCURRENT_PINNED_WAVE_REFRESHES &&
      refreshQueueRef.current.length > 0
    ) {
      const waveId = refreshQueueRef.current.shift();
      if (!waveId) {
        continue;
      }

      queuedRefreshIdsRef.current.delete(waveId);
      refreshingIdsRef.current.add(waveId);
      activeRefreshCountRef.current += 1;

      const refreshPinnedWave = async () => {
        try {
          const wave = await commonApiFetch<ApiWave>({
            endpoint: `waves/${waveId}`,
          });

          if (!isMountedRef.current) {
            return;
          }

          const isStillPinned = pinnedWavesRef.current.some(
            (snapshot) => snapshot.id === wave.id
          );
          if (!isStillPinned) {
            return;
          }

          upsertWave(wave, { moveToFront: false });
        } catch (error: unknown) {
          console.warn("Failed to refresh pinned wave snapshot", {
            waveId,
            error,
          });
        } finally {
          refreshingIdsRef.current.delete(waveId);
          activeRefreshCountRef.current = Math.max(
            0,
            activeRefreshCountRef.current - 1
          );

          if (isMountedRef.current) {
            flushPinnedWaveRefreshQueue();
          }
        }
      };

      void refreshPinnedWave();
    }
  }, [upsertWave]);

  const schedulePinnedWaveRefresh = useCallback(
    (waveId: string) => {
      if (
        queuedRefreshIdsRef.current.has(waveId) ||
        refreshingIdsRef.current.has(waveId)
      ) {
        return;
      }

      queuedRefreshIdsRef.current.add(waveId);
      refreshQueueRef.current.push(waveId);
      flushPinnedWaveRefreshQueue();
    },
    [flushPinnedWaveRefreshQueue]
  );

  const cancelRefresh = useCallback((waveId: string) => {
    queuedRefreshIdsRef.current.delete(waveId);
    refreshQueueRef.current = refreshQueueRef.current.filter(
      (queuedWaveId) => queuedWaveId !== waveId
    );
  }, []);

  useEffect(() => {
    if (!currentWaveId) {
      return;
    }

    if (currentWave) {
      upsertWave(currentWave, { moveToFront: true });
      return;
    }

    const existingWave =
      pinnedWaves.find((wave) => wave.id === currentWaveId) ?? null;

    if (existingWave) {
      upsertWaveSnapshot(existingWave, { moveToFront: true });
      return;
    }

    upsertWaveSnapshot(
      {
        id: currentWaveId,
        name: null,
        picture: null,
        contributors: [],
        isDirectMessage: currentWaveIsDirectMessage,
        fetchedAt: 0,
      },
      { moveToFront: true }
    );
  }, [
    currentWave,
    currentWaveId,
    currentWaveIsDirectMessage,
    pinnedWaves,
    upsertWave,
    upsertWaveSnapshot,
  ]);

  useEffect(() => {
    for (const wave of pinnedWaves) {
      if (wave.id === currentWaveId) {
        continue;
      }

      if (!isPinnedWaveSnapshotStale(wave)) {
        continue;
      }

      schedulePinnedWaveRefresh(wave.id);
    }
  }, [currentWaveId, pinnedWaves, schedulePinnedWaveRefresh]);

  return { cancelRefresh, pinnedWaves, removeId };
}
