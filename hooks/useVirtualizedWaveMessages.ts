import { useState, useEffect, useCallback, useRef } from "react";
import { useMyStreamWaveMessages } from "../contexts/wave/MyStreamContext";

import { ExtendedDrop } from "../helpers/waves/drop.helpers";
import { WaveMessages } from "../contexts/wave/hooks/types";

interface VirtualizedWaveMessages extends Omit<WaveMessages, "drops"> {
  readonly drops: ExtendedDrop[];
  readonly allDropsCount: number; // Total number of available drops in cache
  readonly loadMoreLocally: () => void; // Function to load more from cache
  readonly hasMoreLocal: boolean; // Whether there are more items to load locally
}

/**
 * Hook that provides virtualized pagination for wave messages
 * Instead of returning all cached messages at once, it returns them in chunks
 *
 * @param waveId - The ID of the wave to get messages for
 * @param pageSize - Number of drops to load at a time (default: 50)
 * @returns VirtualizedWaveMessages with pagination controls
 */
export function useVirtualizedWaveMessages(
  waveId: string | null | undefined,
  pageSize: number = 50
): VirtualizedWaveMessages | undefined {
  // Get the original data from the real hooks
  const fullWaveMessages = useMyStreamWaveMessages(waveId);

  // Track the number of items to show from the cache
  const [virtualLimit, setVirtualLimit] = useState<number>(pageSize);

  // Track whether we have more local items to load
  const [hasMoreLocal, setHasMoreLocal] = useState<boolean>(false);

  // Keep track of whether we've initialized with the first batch
  const hasInitialized = useRef<boolean>(false);

  // Update hasMoreLocal when fullWaveMessages changes
  useEffect(() => {
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
  }, [fullWaveMessages, virtualLimit]);

  // Reset virtualLimit when the waveId changes
  useEffect(() => {
    setVirtualLimit(pageSize);
    hasInitialized.current = false;
  }, [waveId, pageSize]);

  // Function to load more messages from local cache
  const loadMoreLocally = useCallback(() => {
    if (fullWaveMessages && fullWaveMessages.drops.length > virtualLimit) {
      setVirtualLimit((prevLimit) => prevLimit + pageSize);
    }
  }, [fullWaveMessages, virtualLimit, pageSize]);

  // If no full wave messages, return undefined
  if (!fullWaveMessages) {
    return undefined;
  }

  // Get the virtualized subset of drops
  const virtualizedDrops = fullWaveMessages.drops.slice(0, virtualLimit);

  // Return the virtualized data with the same shape as the original
  return {
    ...fullWaveMessages,
    drops: virtualizedDrops,
    allDropsCount: fullWaveMessages.drops.length,
    loadMoreLocally,
    hasMoreLocal,
  };
}
