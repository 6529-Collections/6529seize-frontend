"use client"

import { useCallback } from "react";
import { useVirtualizedWaveMessages } from "./useVirtualizedWaveMessages";
import { useMyStream } from "../contexts/wave/MyStreamContext";
import { NextPageProps } from "../contexts/wave/hooks/useWavePagination";
import { DropSize } from "../helpers/waves/drop.helpers";

/**
 * Hook that adapts the useVirtualizedWaveMessages hook to match the
 * interface expected by the WaveDropsAll component
 *
 * @param waveId - The ID of the wave to get messages for
 * @param dropId - The ID of the drop to get messages for
 * @param pageSize - Number of drops to load at a time (default: 50)
 */
export function useVirtualizedWaveDrops(
  waveId: string,
  dropId: string | null,
  pageSize: number = 50
) {
  // Original implementation - would be imported from useMyStream
  const { fetchNextPageForWave: originalFetchNextPage } = useMyStream();

  // Get virtualized wave messages
  const virtualizedWaveMessages = useVirtualizedWaveMessages(
    waveId,
    dropId,
    pageSize
  );
  // Create a wrapper for fetchNextPageForWave that first tries to get data locally
  const fetchNextPageForWave = useCallback(
    async (props: NextPageProps) => {
      if (
        waveId === props.waveId &&
        virtualizedWaveMessages &&
        props.type === DropSize.FULL
      ) {
        // First try to load more from cache if available
        if (virtualizedWaveMessages.hasMoreLocal) {
          virtualizedWaveMessages.loadMoreLocally();
          return Promise.resolve();
        }
      }

      // If no more local data or different waveId, use the original function
      return await originalFetchNextPage(props);
    },
    [waveId, virtualizedWaveMessages, originalFetchNextPage]
  );

  const fetchNextpageForDrop = useCallback(async () => {
    if (virtualizedWaveMessages) {
      return virtualizedWaveMessages.fetchNextPageForDrop();
    }
  }, [virtualizedWaveMessages]);

  const fetchNextPage = useCallback(
    async (props: NextPageProps, dropId: string | null) => {
      if (dropId) {
        return await fetchNextpageForDrop();
      } else {
        return await fetchNextPageForWave(props);
      }
    },
    [fetchNextPageForWave, fetchNextpageForDrop]
  );

  const waitAndRevealDrop = useCallback(
    async (
      serialNo: number,
      maxWaitTimeMs?: number,
      pollIntervalMs?: number
    ) => {
      if (virtualizedWaveMessages) {
        return await virtualizedWaveMessages.waitAndRevealDrop(
          serialNo,
          maxWaitTimeMs,
          pollIntervalMs
        );
      }
    },
    [virtualizedWaveMessages]
  );

  return {
    waveMessages: virtualizedWaveMessages,
    fetchNextPage,
    waitAndRevealDrop,
  };
}
