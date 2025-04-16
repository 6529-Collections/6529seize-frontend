import { useState, useEffect, useCallback, useRef } from "react";
import { useMyStreamWaveMessages } from "../contexts/wave/MyStreamContext";

import { ExtendedDrop } from "../helpers/waves/drop.helpers";
import { WaveMessages } from "../contexts/wave/hooks/types";
import { useDropMessages } from "./useDropMessages";

interface VirtualizedWaveMessages extends Omit<WaveMessages, "drops"> {
  readonly drops: ExtendedDrop[];
  readonly allDropsCount: number; // Total number of available drops in cache
  readonly loadMoreLocally: () => void; // Function to load more from cache
  readonly hasMoreLocal: boolean; // Whether there are more items to load locally
  readonly fetchNextPageForDrop: () => void;
}

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

    if (fullWaveMessages) {
      const totalDrops = fullWaveMessages.drops.length;
      setHasMoreLocal(totalDrops > virtualLimit);

      // If we haven't initialized yet and we have drops, set the flag
      if (!hasInitialized.current && totalDrops > 0) {
        hasInitialized.current = true;
      }
    } else {
      setHasMoreLocal(false);
      hasInitialized.current = false;
    }
  }, [dropId, fullWaveMessages, virtualLimit, fullWaveMessagesForDrop]);

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
    } else {
      if (fullWaveMessages && fullWaveMessages.drops.length > virtualLimit) {
        setVirtualLimit((prevLimit) => prevLimit + pageSize);
      }
    }
  }, [
    fullWaveMessages,
    virtualLimit,
    pageSize,
    fullWaveMessagesForDrop,
    dropId,
  ]);

  if (dropId && !fullWaveMessagesForDrop) {
    return undefined;
  }

  // If no full wave messages, return undefined
  if (!fullWaveMessages) {
    return undefined;
  }

  // Get the virtualized subset of drops
  const virtualizedDrops = dropId
    ? fullWaveMessagesForDrop.drops.slice(0, virtualLimit)
    : fullWaveMessages.drops.slice(0, virtualLimit);

  const hasNextPage = dropId
    ? fullWaveMessagesForDrop.hasNextPage
    : fullWaveMessages.hasNextPage;

  const isLoading = dropId
    ? fullWaveMessagesForDrop.isFetching
    : fullWaveMessages.isLoading;

  const isLoadingNextPage = dropId
    ? fullWaveMessagesForDrop.isFetchingNextPage
    : fullWaveMessages.isLoadingNextPage;

  const latestFetchedSerialNo = dropId
    ? fullWaveMessagesForDrop.drops.at(-1)?.serial_no ?? null
    : fullWaveMessages.latestFetchedSerialNo;

  const allDropsCount = dropId
    ? fullWaveMessagesForDrop.drops.length
    : fullWaveMessages.drops.length;

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
  };
}
