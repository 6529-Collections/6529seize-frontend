import { useCallback } from 'react';
import { useVirtualizedWaveMessages } from './useVirtualizedWaveMessages';
import { useMyStream } from '../contexts/wave/MyStreamContext';

/**
 * Hook that adapts the useVirtualizedWaveMessages hook to match the
 * interface expected by the WaveDropsAll component
 * 
 * @param waveId - The ID of the wave to get messages for
 * @param pageSize - Number of drops to load at a time (default: 50)
 */
export function useVirtualizedWaveDrops(
  waveId: string | null | undefined,
  pageSize: number = 50
) {
  // Original implementation - would be imported from useMyStream
  const { fetchNextPageForWave: originalFetchNextPage } = useMyStream();
  
  // Get virtualized wave messages
  const virtualizedWaveMessages = useVirtualizedWaveMessages(waveId, pageSize);

  // Create a wrapper for fetchNextPageForWave that first tries to get data locally
  const fetchNextPageForWave = useCallback(async (id: string) => {
    if (waveId === id && virtualizedWaveMessages) {
      // First try to load more from cache if available
      if (virtualizedWaveMessages.hasMoreLocal) {
        virtualizedWaveMessages.loadMoreLocally();
        return Promise.resolve();
      }
    }
    
    // If no more local data or different waveId, use the original function
    return await originalFetchNextPage(id);
  }, [waveId, virtualizedWaveMessages, originalFetchNextPage]);

  return {
    waveMessages: virtualizedWaveMessages,
    fetchNextPageForWave
  };
}
