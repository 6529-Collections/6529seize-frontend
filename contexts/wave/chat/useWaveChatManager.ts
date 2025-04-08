import React, { useMemo, useReducer, useRef, useCallback, useEffect, useState } from 'react';
import {
  DEFAULT_PREFETCH_LIMIT,
  DEFAULT_HISTORY_FETCH_LIMIT,
  DEFAULT_STALE_TIME_MS,
  DEFAULT_SYNC_INTERVAL_MS,
  DEFAULT_CONCURRENCY_LIMIT,
  DEFAULT_RECENT_THRESHOLD_MS
} from './config';
import {
  WaveChatOptions,
  WaveChatState,
  WaveChatStatus,
  ActivationPriority,
  ChatManagerInternals,
  createInitialWaveState
} from "./types";
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
    apiPageSize: options?.historyFetchLimit ?? DEFAULT_HISTORY_FETCH_LIMIT,
  }), [options]);

  // Initialize cache state using the reducer
  const [cache, dispatchCacheAction] = useReducer(cacheReducer, initialCacheState);

  // Initialize internal refs for queue/processing management
  const processingRef = useRef<ChatManagerInternals['processing']>(new Map());
  const pendingRef = useRef<ChatManagerInternals['pending']>(new Map());

  // State variable solely to trigger the queue worker useEffect
  const [queueTrigger, setQueueTrigger] = useState(0);

  // --- Phase 5: Queueing and Prioritization (Step 13) ---
  const queueActivation = useCallback((waveId: string, priority: ActivationPriority) => {
    // 1. Check if already processing
    if (processingRef.current.has(waveId)) {
      console.log(`[ChatManager] Activation request ignored: ${waveId} already processing.`);
      return; // Don't queue if actively being fetched
    }

    // 2. Check if already pending
    const currentPendingPriority = pendingRef.current.get(waveId);
    if (currentPendingPriority !== undefined) {
      // Already pending, update priority only if the new one is higher (lower number)
      if (priority < currentPendingPriority) {
        console.log(`[ChatManager] Upgrading priority for pending ${waveId} to ${priority}`);
        pendingRef.current.set(waveId, priority);
        // No need to trigger worker explicitly here, priority change will be picked up
      }
       // else: new priority is not higher, do nothing
      return; 
    }

    // 3. Not processing and not pending: Add to pending queue
    console.log(`[ChatManager] Adding ${waveId} to pending queue with priority ${priority}`);
    pendingRef.current.set(waveId, priority);

    // 4. Trigger the worker loop to check the queue
    setQueueTrigger(c => c + 1);

  }, []); // No dependencies needed as it only interacts with refs and a state setter
  // --- End of Phase 5 / Step 13 ---

  // --- Phase 5: Queueing and Prioritization (Step 14) ---
  const loadActiveWave = useCallback((waveId: string) => {
    // 1. Check if pending, remove if so (will be re-added with Immediate priority)
    if (pendingRef.current.has(waveId)) {
      console.log(`[ChatManager] Removing ${waveId} from pending to prioritize as active.`);
      pendingRef.current.delete(waveId);
    }

    // 2. Check if currently processing
    if (processingRef.current.has(waveId)) {
       // Simple strategy: Log that it's already processing.
       // The existing process will complete. If priority needs upgrading,
       // that requires more complex abort/restart logic.
      console.log(`[ChatManager] ${waveId} is already processing, will load as active once current fetch completes.`);
       // Optionally, we could still queue it as Immediate, and the worker
       // might pick it up *after* the current one finishes if nothing else has higher priority.
       // Let's queue it to ensure it runs soon, even if already processing.
    }

    // 3. Queue with Immediate priority
    console.log(`[ChatManager] Queuing ${waveId} with Immediate priority.`);
    // Directly call queueActivation, which handles adding to pending and triggering worker
    queueActivation(waveId, ActivationPriority.Immediate);

  }, [queueActivation]); // Dependency on queueActivation
  // --- End of Phase 5 / Step 14 ---

  // --- Phase 4 implementations: syncWave, fetchAndProcessLatestDrops, fetchOlderDrops ---
  // Need to declare fetchAndProcessLatestDrops *before* the worker loop useEffect
  const fetchAndProcessLatestDrops = useCallback(async (waveId: string, abortSignal: AbortSignal) => {
     // ... implementation from Step 10 ...
     // Note: Ensure fetchAndProcessLatestDrops uses dispatchCacheAction from the reducer
     // and references config correctly.
     // Example placeholder structure:
      console.log(`Worker: Fetching latest for ${waveId}`);
      try {
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1500)); 
          if(abortSignal.aborted) throw new Error('Aborted');
          console.log(`Worker: Finished fetching ${waveId}`);
          // dispatchCacheAction({...}); // Dispatch REPLACE_DROPS on success
      } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
               console.log(`Worker: Aborted fetch for ${waveId}`);
           } else {
                console.error(`Worker: Error fetching ${waveId}`, error);
               // dispatchCacheAction({...}); // Dispatch SET_WAVE_ERROR
           }
      }
  }, [config, dispatchCacheAction]); // Add dependencies like config, dispatchCacheAction

  const syncWave = useCallback(async (waveId: string) => {
     // ... implementation from Step 11 ...
  }, [cache, config, dispatchCacheAction, queueActivation]);

  const fetchOlderDrops = useCallback(async (waveId: string): Promise<void> => {
    // ... implementation from Step 12 ...
  }, [cache, config, dispatchCacheAction]);
  // --- End of Phase 4 --- 

  // --- Phase 5: Queueing and Prioritization (Step 15 - Worker Loop) ---
  useEffect(() => {
    const processQueue = () => {
      // Check if we have slots available and items pending
      while (
        processingRef.current.size < config.concurrencyLimit &&
        pendingRef.current.size > 0
      ) {
        // Find the highest priority item (lowest priority number)
        let nextWaveId: string | null = null;
        let highestPriority = Infinity;

        // Fix: Convert Map entries to array for iteration
        const pendingEntries = Array.from(pendingRef.current.entries());
        
        for (const [waveId, priority] of pendingEntries) {
          if (priority < highestPriority) {
            highestPriority = priority;
            nextWaveId = waveId;
          }
          // If priority is Immediate, process it right away
          if (priority === ActivationPriority.Immediate) break;
        }

        if (!nextWaveId) {
          break; // Should not happen if pendingRef.current.size > 0, but safety check
        }

        // Move from pending to processing
        const priority = pendingRef.current.get(nextWaveId)!;
        pendingRef.current.delete(nextWaveId);
        const abortController = new AbortController();
        processingRef.current.set(nextWaveId, { priority, abortController });

        console.log(`[ChatWorker] Starting fetch for ${nextWaveId} (Priority: ${priority})`);

        // Start the async fetch operation - DO NOT await here
        fetchAndProcessLatestDrops(nextWaveId, abortController.signal)
          .finally(() => {
             // Regardless of success/error/abort, remove from processing
             processingRef.current.delete(nextWaveId!);
             console.log(`[ChatWorker] Finished processing ${nextWaveId}`);
             // Trigger the effect again to check if more items can be processed
             setQueueTrigger(c => c + 1); 
          });
      }
    };

    processQueue();

    // This effect runs when the trigger changes or the limit changes.
    // No cleanup needed here as AbortController handles cancellation if the component unmounts.
  }, [queueTrigger, config, fetchAndProcessLatestDrops]);
  // --- End of Phase 5 / Step 15 ---

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
    syncWave,
    fetchOlderDrops,
    queueActivation,
    loadActiveWave,
  };
}
