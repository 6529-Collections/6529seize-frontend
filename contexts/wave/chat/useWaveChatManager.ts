import React, { useMemo, useReducer, useRef, useCallback, useEffect } from 'react';
import {
  DEFAULT_PREFETCH_LIMIT,
  DEFAULT_HISTORY_FETCH_LIMIT,
  DEFAULT_STALE_TIME_MS,
  DEFAULT_SYNC_INTERVAL_MS,
  DEFAULT_CONCURRENCY_LIMIT,
  DEFAULT_RECENT_THRESHOLD_MS
} from './config';
import { WaveChatOptions, WaveChatState, WaveChatStatus, ActivationPriority, ChatManagerInternals } from "./types"; // Assuming ExtendedDrop is imported where needed or globally available
import { ExtendedDrop } from '../../../helpers/waves/drop.helpers'; // Adjust path as necessary
import { WsMessageType, WsDropUpdateMessage } from '../../../helpers/Types'; // Adjust path as needed
import { useWebSocketMessage } from '../../../services/websocket/useWebSocketMessage'; // Adjust path as needed


// Define Action Types for the reducer
type CacheAction =
  | { type: 'SET_WAVE_STATE'; waveId: string; state: Partial<WaveChatState> } // Generic, use with caution
  | { type: 'SET_WAVE_STATUS'; waveId: string; status: WaveChatStatus }
  | { type: 'SET_WAVE_ERROR'; waveId: string; error: Error | null }
  | { type: 'PREPEND_DROPS'; waveId: string; drops: ExtendedDrop[]; newOldestSerialNo: number | null; hasReachedOldest: boolean }
  | { type: 'APPEND_DROPS'; waveId: string; drops: ExtendedDrop[]; newNewestSerialNo: number | null }
  | { type: 'REPLACE_DROPS'; waveId: string; drops: ExtendedDrop[]; newNewestSerialNo: number | null; newOldestSerialNo: number | null; hasReachedOldest: boolean }
  | { type: 'UPDATE_SYNC_TIME'; waveId: string; timestamp: number }
  | { type: 'DELETE_WAVE'; waveId: string }; // Optional: For cache eviction

// Initial State
const initialCacheState: ReadonlyMap<string, WaveChatState> = new Map();

// Helper to create initial state for a *new* wave being added to the cache
const createInitialWaveState = (): WaveChatState => ({
  drops: [],
  status: WaveChatStatus.Idle,
  hasReachedOldest: false,
  newestSerialNo: null,
  oldestSerialNo: null,
  lastSyncTime: null,
  error: null,
});

// Reducer function
function cacheReducer(
  state: ReadonlyMap<string, WaveChatState>,
  action: CacheAction
): ReadonlyMap<string, WaveChatState> {
  const newState = new Map(state); // Create a mutable copy
  const waveId = action.waveId;
   // Get existing or create initial state for the target wave
  const currentWaveState = newState.get(waveId) ?? createInitialWaveState();

  switch (action.type) {
    case 'SET_WAVE_STATUS': {
      newState.set(waveId, {
        ...currentWaveState,
        status: action.status,
        // Clear error if status is no longer Error
        error: action.status === WaveChatStatus.Error ? currentWaveState.error : null,
      });
      break;
    }
    case 'SET_WAVE_ERROR': {
      newState.set(waveId, {
        ...currentWaveState,
        status: WaveChatStatus.Error,
        error: action.error,
      });
      break;
    }
    case 'PREPEND_DROPS': {
      // Note: Assumes caller handles potential drop overlap/uniqueness if necessary
      const uniqueNewDrops = action.drops.filter(
        (newDrop) => !currentWaveState.drops.some((existingDrop) => existingDrop.id === newDrop.id)
      );
      newState.set(waveId, {
        ...currentWaveState,
        drops: [...uniqueNewDrops, ...currentWaveState.drops], // Prepend unique new drops
        oldestSerialNo: action.newOldestSerialNo,
        hasReachedOldest: action.hasReachedOldest,
        status: WaveChatStatus.Idle, // Assume operation succeeded
      });
      break;
    }
    case 'APPEND_DROPS': {
       // Note: Assumes caller handles potential drop overlap/uniqueness if necessary
       const uniqueNewDrops = action.drops.filter(
         (newDrop) => !currentWaveState.drops.some((existingDrop) => existingDrop.id === newDrop.id)
       );
      newState.set(waveId, {
        ...currentWaveState,
        drops: [...currentWaveState.drops, ...uniqueNewDrops], // Append unique new drops
        newestSerialNo: action.newNewestSerialNo,
        status: WaveChatStatus.Idle, // Assume operation succeeded
      });
      break;
    }
     case 'REPLACE_DROPS': {
       // Used by activateWave to set the latest N drops
       newState.set(waveId, {
         ...createInitialWaveState(), // Start fresh for replace, but keep existing non-drop state if needed? Let's start fresh.
         drops: action.drops,
         newestSerialNo: action.newNewestSerialNo,
         oldestSerialNo: action.newOldestSerialNo,
         hasReachedOldest: action.hasReachedOldest,
         status: WaveChatStatus.Idle,
         // Inherit lastSyncTime? Maybe not needed if we're replacing latest.
       });
       break;
     }
     case 'UPDATE_SYNC_TIME': {
       newState.set(waveId, {
         ...currentWaveState,
         lastSyncTime: action.timestamp,
       });
       break;
     }
     // Generic state update - use sparingly
      case 'SET_WAVE_STATE': {
        newState.set(waveId, {
          ...currentWaveState,
          ...action.state,
        });
        break;
      }
     case 'DELETE_WAVE': { // Optional
       newState.delete(waveId);
       break;
     }
    default:
      // If the action type is unrecognized, return the original state
      // It's good practice to handle this explicitly.
      // You could also throw an error here if preferred.
      return state;
  }

  // Return the updated, immutable state map
  return newState;
}


export function useWaveChatManager(options?: WaveChatOptions) {
  const config = useMemo(() => ({
    prefetchLimit: options?.prefetchLimit ?? DEFAULT_PREFETCH_LIMIT,
    historyFetchLimit: options?.historyFetchLimit ?? DEFAULT_HISTORY_FETCH_LIMIT,
    staleTimeMs: options?.staleTimeMs ?? DEFAULT_STALE_TIME_MS,
    syncIntervalMs: options?.syncIntervalMs ?? DEFAULT_SYNC_INTERVAL_MS,
    concurrencyLimit: options?.concurrencyLimit ?? DEFAULT_CONCURRENCY_LIMIT,
    recentThresholdMs: options?.recentThresholdMs ?? DEFAULT_RECENT_THRESHOLD_MS,

  }), [options]);

  // Initialize cache state using the reducer
  const [cache, dispatchCacheAction] = useReducer(cacheReducer, initialCacheState);

  // Initialize internal refs for queue/processing management
  const processingRef = useRef<ChatManagerInternals['processing']>(new Map());
  const pendingRef = useRef<ChatManagerInternals['pending']>(new Map());

  // Placeholder for queueActivation - to be implemented in Phase 5
  const queueActivation = useCallback((waveId: string, priority: ActivationPriority) => {
    // TODO: Implement queueing logic in Phase 5
    console.log(`Placeholder: Queueing activation for ${waveId} with priority ${priority}`);
  }, []);

  // Placeholder for syncWave - to be implemented in Phase 4 (Step 11)
  // This function will fetch drops newer than the last known serial number for a wave.
  const syncWave = useCallback(async (waveId: string) => {
      // TODO: Implement sync logic in Phase 4 (Step 11)
      console.log(`Placeholder: Syncing wave ${waveId}`);
      // Simulating async operation for placeholder
      await new Promise(resolve => setTimeout(resolve, 100)); 
  }, []); // Dependencies will be added when implemented (e.g., dispatchCacheAction, cache)

  // WebSocket message handler
  const handleWebSocketMessage = useCallback((message: WsDropUpdateMessage["data"]) => {
    if (!message?.wave?.id || !message?.serial_no) {
      console.warn('Received invalid DROP_UPDATE message', message);
      return;
    }

    const { wave: { id: waveId }, serial_no: serialNo, ...dropData } = message;
    const currentWaveState = cache.get(waveId);
    const currentNewestSerialNo = currentWaveState?.newestSerialNo ?? -1; // Use -1 if no state exists

    // Check if wave is inactive/uncached (using simple check for now)
    const isInactiveOrUncached = !currentWaveState;

    if (serialNo > currentNewestSerialNo) {
      // Drop is newer than cached state
      const newDrop: ExtendedDrop = {
        // Assuming WsDropUpdateMessage structure matches ExtendedDrop needs
        // You might need mapping logic here if structures differ significantly
        ...message,
        // TODO: what about these?
        is_signed: false,
        stableKey: '',
        stableHash: '',
      };

      dispatchCacheAction({
        type: 'APPEND_DROPS',
        waveId,
        drops: [newDrop],
        newNewestSerialNo: serialNo,
      });

      // If the wave wasn't actively cached, queue it for prefetching latest
      if (isInactiveOrUncached) {
        queueActivation(waveId, ActivationPriority.High);
      }

    } else {
      // Drop is old or duplicate relative to cache, ignore it
      console.log(`Ignoring old/duplicate WS message for wave ${waveId}, serial ${serialNo}`);
    }
  }, [cache, dispatchCacheAction, queueActivation]); // Dependencies: cache state, dispatcher, queue function

  // Subscribe to WebSocket messages
  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    handleWebSocketMessage
  );

  // NOTE: The useEffect hook to handle visibility changes and call syncWave(activeWaveId)
  // should be implemented in the MyStreamProvider (Phase 7), as this hook
  // does not have direct access to the activeWaveId.

  // ... rest of the hook logic ...

  return {
    cache,
    // Expose syncWave placeholder for now (will be needed by provider)
    syncWave,
    // ... other functions ...
  };
}
