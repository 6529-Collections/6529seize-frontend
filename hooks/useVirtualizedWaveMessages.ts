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
  // full-wave vs. drop-specific data
  const fullWave = useMyStreamWaveMessages(waveId);
  const dropWave = useDropMessages(waveId, dropId);

  // don’t proceed until we have base data
  if (!fullWave) return undefined;
  if (dropId && !dropWave) return undefined;

  const source = dropId ? dropWave! : fullWave;

  // how many messages to show
  const [virtualLimit, setVirtualLimit] = useState(pageSize);
  const [hasMoreLocal, setHasMoreLocal] = useState(false);

  // update local‐load flag whenever data or limit changes
  useEffect(() => {
    setHasMoreLocal(source.drops.length > virtualLimit);
  }, [source.drops.length, virtualLimit]);

  // reset limit on waveId / dropId / pageSize change
  useEffect(() => {
    setVirtualLimit(pageSize);
  }, [waveId, dropId, pageSize]);

  const loadMoreLocally = useCallback(() => {
    const total = source.drops.length;
    if (total > virtualLimit) {
      setVirtualLimit((prev) => Math.min(prev + pageSize, total));
    }
  }, [source.drops.length, virtualLimit, pageSize]);

  const revealDrop = useCallback(
    (serialNo: number) => {
      const idx = source.drops.findIndex((d) => d.serial_no === serialNo);
      if (idx !== -1) {
        const target = Math.min(idx + pageSize, source.drops.length - 1);
        setVirtualLimit(target + 1);
      }
    },
    [source.drops, pageSize]
  );

  const waitAndRevealDrop = useCallback(
    async (
      serialNo: number,
      maxWaitTimeMs: number = 3000,
      pollIntervalMs: number = 100
    ): Promise<boolean> => {
      const start = Date.now();
      while (Date.now() - start < maxWaitTimeMs) {
        if (source.drops.some((d) => d.serial_no === serialNo)) {
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
    [source.drops, revealDrop, waveId]
  );

  const fetchNextPageForDrop = useCallback(() => {
    if (dropWave) dropWave.fetchNextPage();
  }, [dropWave]);

  return {
    id: waveId,
    hasNextPage: source.hasNextPage,
    // pick the right loading flags:
    isLoading: dropId ? dropWave!.isFetching : fullWave.isLoading,
    isLoadingNextPage: dropId
      ? dropWave!.isFetchingNextPage
      : fullWave.isLoadingNextPage,
    latestFetchedSerialNo: dropId
      ? dropWave!.drops.at(-1)?.serial_no ?? null
      : fullWave.latestFetchedSerialNo,
    drops: source.drops.slice(0, virtualLimit),
    allDropsCount: source.drops.length,
    loadMoreLocally,
    hasMoreLocal,
    fetchNextPageForDrop,
    waitAndRevealDrop,
  };
}
