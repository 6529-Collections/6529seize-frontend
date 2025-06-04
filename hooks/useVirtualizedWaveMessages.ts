import { useState, useEffect, useCallback, useRef, useReducer } from "react";
import { useMyStreamWaveMessages } from "../contexts/wave/MyStreamContext";

import { Drop } from "../helpers/waves/drop.helpers";
import { WaveMessages } from "../contexts/wave/hooks/types";
import { useDropMessages } from "./useDropMessages";

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

const getShouldRefresh = (old: Drop[], newDrops: Drop[]) => {
  // loop throught new, find corresponding old, if found, compare reactions, if they are different, return true
  for (const newDrop of newDrops) {
    const oldDrop = old.find(
      (oldDrop) => oldDrop.serial_no === newDrop.serial_no
    );
    if (oldDrop && "reactions" in oldDrop && "reactions" in newDrop) {
      if (oldDrop.reactions !== newDrop.reactions) {
        return true;
      }
    }
  }
  return false;
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Hook that provides virtualized pagination for wave messages
 * Instead of returning all cached messages at once, it returns them in chunks
 *
 * @param waveId - The ID of the wave to get messages for
 * @param dropId - The ID of the drop to get messages for
 * @param pageSize - Number of drops to load at a time (default: 50)
 * @returns VirtualizedWaveMessages with pagination controls
 */
export function useVirtualizedWaveMessages(
  waveId: string,
  dropId: string | null,
  pageSize: number = 50
): VirtualizedWaveMessages | undefined {
  // Get the original data from the real hooks
  const fullWaveMessages = useMyStreamWaveMessages(waveId);

  const fullWaveMessagesRef = useRef<WaveMessages | null>(null);

  const [, forceRefresh] = useReducer((prev: number) => prev + 1, 0);

  useEffect(() => {
    const shouldRefresh = getShouldRefresh(
      fullWaveMessagesRef.current?.drops ?? [],
      fullWaveMessages?.drops ?? []
    );

    fullWaveMessagesRef.current = fullWaveMessages ?? null;
    if (shouldRefresh) {
      forceRefresh();
    }
  }, [fullWaveMessages]);

  const fullWaveMessagesForDrop = useDropMessages(waveId, dropId);

  // Track the number of items to show from the cache
  const [virtualLimit, setVirtualLimit] = useState<number>(pageSize);

  // Track whether we have more local items to load
  const [hasMoreLocal, setHasMoreLocal] = useState<boolean>(false);

  // Keep track of whether we've initialized with the first batch
  const hasInitialized = useRef<boolean>(false);

  // Update hasMoreLocal when fullWaveMessages changes
  useEffect(() => {
    if (dropId) {
      if (fullWaveMessagesForDrop) {
        const totalDrops = fullWaveMessagesForDrop.drops.length;
        setHasMoreLocal(totalDrops > virtualLimit);

        // If we haven't initialized yet and we have drops, set the flag
        if (!hasInitialized.current && totalDrops > 0) {
          hasInitialized.current = true;
        }
      } else {
        setHasMoreLocal(false);
        hasInitialized.current = false;
      }
    }

    if (fullWaveMessagesRef.current) {
      const totalDrops = fullWaveMessagesRef.current.drops.length;
      setHasMoreLocal(totalDrops > virtualLimit);

      // If we haven't initialized yet and we have drops, set the flag
      if (!hasInitialized.current && totalDrops > 0) {
        hasInitialized.current = true;
      }
    } else {
      setHasMoreLocal(false);
      hasInitialized.current = false;
    }
  }, [
    dropId,
    fullWaveMessagesRef.current,
    virtualLimit,
    fullWaveMessagesForDrop,
  ]);

  // Reset virtualLimit when the waveId changes
  useEffect(() => {
    setVirtualLimit(pageSize);
    hasInitialized.current = false;
  }, [waveId, pageSize, dropId]);

  // Function to load more messages from local cache
  const loadMoreLocally = useCallback(() => {
    if (dropId) {
      if (
        fullWaveMessagesForDrop &&
        fullWaveMessagesForDrop.drops.length > virtualLimit
      ) {
        setVirtualLimit((prevLimit) => prevLimit + pageSize);
      }
    } else if (
      fullWaveMessagesRef.current &&
      fullWaveMessagesRef.current.drops.length > virtualLimit
    ) {
      setVirtualLimit((prevLimit) => prevLimit + pageSize);
    }
  }, [
    fullWaveMessagesRef.current,
    virtualLimit,
    pageSize,
    fullWaveMessagesForDrop,
    dropId,
  ]);

  const revealDrop = useCallback(
    (serialNo: number) => {
      if (fullWaveMessagesRef.current) {
        const index = fullWaveMessagesRef.current.drops.findIndex(
          (drop) => drop.serial_no === serialNo
        );

        if (index !== -1) {
          const maxIndex = fullWaveMessagesRef.current.drops.length - 1;
          const targetIndex = Math.min(index + 30, maxIndex);
          setVirtualLimit(targetIndex + 1);
        }
      }
    },
    [fullWaveMessagesRef.current]
  );

  const waitAndRevealDrop = useCallback(
    async (
      serialNo: number,
      maxWaitTimeMs: number = 3000,
      pollIntervalMs: number = 100
    ) => {
      const startTime = Date.now();
      while (Date.now() - startTime < maxWaitTimeMs) {
        // Check if the specific drop is present in the *currently loaded full list*
        if (
          fullWaveMessagesRef?.current?.drops?.some(
            (drop) => drop.serial_no === serialNo
          )
        ) {
          revealDrop(serialNo); // Call the hook's revealDrop to update virtualLimit
          return true;
        }
        await delay(pollIntervalMs);
      }
      console.warn(
        `useVirtualizedWaveMessages: Timed out after ${maxWaitTimeMs}ms waiting for serialNo ${serialNo} in wave ${waveId}`
      );
      return false;
    },
    [revealDrop, fullWaveMessagesRef.current]
  );

  if (dropId && !fullWaveMessagesForDrop) {
    return undefined;
  }

  // If no full wave messages, return undefined
  if (!fullWaveMessagesRef.current) {
    return undefined;
  }

  // Get the virtualized subset of drops
  const virtualizedDrops = dropId
    ? fullWaveMessagesForDrop.drops.slice(0, virtualLimit)
    : fullWaveMessagesRef.current.drops.slice(0, virtualLimit);

  const hasNextPage = dropId
    ? fullWaveMessagesForDrop.hasNextPage
    : fullWaveMessagesRef.current.hasNextPage;

  const isLoading = dropId
    ? fullWaveMessagesForDrop.isFetching
    : fullWaveMessagesRef.current.isLoading;

  const isLoadingNextPage = dropId
    ? fullWaveMessagesForDrop.isFetchingNextPage
    : fullWaveMessagesRef.current.isLoadingNextPage;

  const latestFetchedSerialNo = dropId
    ? fullWaveMessagesForDrop.drops.at(-1)?.serial_no ?? null
    : fullWaveMessagesRef.current.latestFetchedSerialNo;

  const allDropsCount = dropId
    ? fullWaveMessagesForDrop.drops.length
    : fullWaveMessagesRef.current.drops.length;

  // Return the virtualized data with the same shape as the original
  return {
    hasNextPage,
    id: waveId,
    isLoading,
    isLoadingNextPage,
    latestFetchedSerialNo,
    drops: virtualizedDrops,
    allDropsCount,
    loadMoreLocally,
    hasMoreLocal,
    fetchNextPageForDrop: fullWaveMessagesForDrop.fetchNextPage,
    waitAndRevealDrop,
  };
}
