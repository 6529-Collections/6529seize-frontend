import { useState, useEffect, useCallback } from "react";
import { useMyStreamWaveMessages } from "../contexts/wave/MyStreamContext";
import { useDropMessages } from "./useDropMessages";

import { Drop } from "../helpers/waves/drop.helpers";
import { WaveMessages } from "../contexts/wave/hooks/types";

interface VirtualizedWaveMessages extends Omit<WaveMessages, "drops"> {
  readonly drops: Drop[];
  readonly allDropsCount: number; // Total number of available drops in cache
  readonly loadMoreLocally: () => void; // Function to load more from cache
  readonly hasMoreLocal: boolean; // Whether there are more items to load locally
  readonly fetchNextPageForDrop: () => void;
  readonly waitAndRevealDrop: (
    serialNo: number,
    maxWaitTimeMs?: number,
    pollIntervalMs?: number
  ) => Promise<boolean>;
}

const delay = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export function useVirtualizedWaveMessages(
  waveId: string,
  dropId: string | null,
  pageSize: number = 50
): VirtualizedWaveMessages | undefined {
  const fullWave = useMyStreamWaveMessages(waveId);
  const dropWave = useDropMessages(waveId, dropId);

  // fallback defaults
  const source = dropId ? dropWave : fullWave;

  const [virtualLimit, setVirtualLimit] = useState(pageSize);
  const [hasMoreLocal, setHasMoreLocal] = useState(false);

  useEffect(() => {
    setHasMoreLocal((source?.drops.length ?? 0) > virtualLimit);
  }, [source?.drops.length, virtualLimit]);

  useEffect(() => {
    setVirtualLimit(pageSize);
  }, [waveId, dropId, pageSize]);

  const loadMoreLocally = useCallback(() => {
    const total = source?.drops.length ?? 0;
    if (total > virtualLimit) {
      setVirtualLimit((prev) => Math.min(prev + pageSize, total));
    }
  }, [source?.drops.length, virtualLimit, pageSize]);

  const revealDrop = useCallback(
    (serialNo: number) => {
      const idx =
        source?.drops.findIndex((d) => d.serial_no === serialNo) ?? -1;
      if (idx !== -1) {
        const target = Math.min(
          idx + pageSize,
          (source?.drops.length ?? 1) - 1
        );
        setVirtualLimit(target + 1);
      }
    },
    [source?.drops, pageSize]
  );

  const waitAndRevealDrop = useCallback(
    async (
      serialNo: number,
      maxWaitTimeMs: number = 3000,
      pollIntervalMs: number = 100
    ): Promise<boolean> => {
      const start = Date.now();
      while (Date.now() - start < maxWaitTimeMs) {
        if (source?.drops?.some((d) => d.serial_no === serialNo)) {
          revealDrop(serialNo);
          return true;
        }
        await delay(pollIntervalMs);
      }
      console.warn(
        `useVirtualizedWaveMessages: timed out waiting for drop ${serialNo} in wave ${waveId}`
      );
      return false;
    },
    [source?.drops, revealDrop, waveId]
  );

  const fetchNextPageForDrop = useCallback(() => {
    dropWave?.fetchNextPage();
  }, [dropWave]);

  // Handle missing data
  if (!fullWave || (dropId && !dropWave)) return undefined;

  return {
    id: waveId,
    hasNextPage: source!.hasNextPage,
    isLoading: dropId ? dropWave.isFetching : fullWave.isLoading,
    isLoadingNextPage: dropId
      ? dropWave.isFetchingNextPage
      : fullWave.isLoadingNextPage,
    latestFetchedSerialNo: dropId
      ? dropWave.drops.at(-1)?.serial_no ?? null
      : fullWave.latestFetchedSerialNo,
    drops: source!.drops.slice(0, virtualLimit),
    allDropsCount: source!.drops.length,
    loadMoreLocally,
    hasMoreLocal,
    fetchNextPageForDrop,
    waitAndRevealDrop,
  };
}
