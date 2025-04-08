import { useCallback, useContext } from 'react';
import { MyStreamContext } from '../MyStreamContext'; // Adjust path if necessary
import { WaveChatState, createInitialWaveState } from '../chat/types'; // Adjust path if necessary

/**
 * Hook to access the chat feed state and actions for a specific wave ID
 * from the MyStreamContext.
 *
 * @param waveId The ID of the wave whose chat feed is needed, or null.
 * @returns An object containing the wave's chat state and a function to fetch older drops.
 */
export function useWaveChatFeed(waveId: string | null): {
    waveState: Readonly<WaveChatState>;
    fetchOlderDrops: () => Promise<void>;
} {
    const context = useContext(MyStreamContext);

    if (!context) {
        throw new Error("useWaveChatFeed must be used within a MyStreamProvider");
    }

    const { chat } = context;

    // Select the state for the specific waveId, or use initial state if null/not found
    // NOTE: This direct selection will cause re-renders whenever *any* part of the cache changes.
    // Optimization using useSyncExternalStore is recommended for production.
    const waveState = waveId ? (chat.cache.get(waveId) ?? createInitialWaveState()) : createInitialWaveState();

    // Create a stable callback reference for fetching older drops for *this specific* wave
    const boundFetchOlderDrops = useCallback(async (): Promise<void> => {
        if (waveId) {
            try {
                await chat.fetchOlderDrops(waveId);
            } catch (error) {
                 // Error is already logged in the manager, but component might want to know.
                 // Re-throwing or returning status might be useful depending on UI needs.
                console.error(`[useWaveChatFeed] Error calling fetchOlderDrops for ${waveId}:`, error);
                 // Optionally re-throw if the component needs to handle it
                 // throw error;
            }
        } else {
             console.warn("[useWaveChatFeed] fetchOlderDrops called with null waveId");
            return Promise.resolve(); // Or reject if preferred
        }
    }, [chat.fetchOlderDrops, waveId]); // Depends on the context function and waveId

    return {
        waveState,
        fetchOlderDrops: boundFetchOlderDrops,
    };
}
