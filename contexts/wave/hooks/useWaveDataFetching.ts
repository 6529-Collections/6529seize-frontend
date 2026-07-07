"use client";

import { useCallback } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { markMobileLaunchStep } from "@/utils/monitoring/mobileLaunchTiming";
import { useWaveLoadingState } from "./useWaveLoadingState";
import { useWaveAbortController } from "./useWaveAbortController";
import type { WaveDataStoreUpdater } from "./types";
import {
  fetchWaveMessages,
  formatWaveMessages,
  createEmptyWaveMessages,
  fetchNewestWaveMessages,
} from "../utils/wave-messages-utils";
import {
  useWaveEligibility,
  type WaveEligibility,
} from "../WaveEligibilityContext";

// Define the limit constant used by the fetch utility
const FETCH_NEWEST_LIMIT = 50;

type UpdateWaveEligibility = (
  waveId: string,
  eligibility: Partial<WaveEligibility>
) => void;

type SyncNewestMessagesResult = {
  drops: ApiDrop[] | null;
  highestSerialNo: number | null;
};

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "AbortError";
}

function getHighestLoadedSerialNo(
  drops: readonly { readonly serial_no: number }[]
): number | null {
  if (drops.length === 0) {
    return null;
  }

  return Math.max(...drops.map((drop) => drop.serial_no));
}

function reportSyncNewestError(waveId: string, error: unknown): void {
  if (isAbortError(error)) {
    return;
  }

  console.error(
    `[WaveDataFetching] Error syncing newest messages for ${waveId}:`,
    error
  );
}

async function fetchAllNewestWaveMessages(
  waveId: string,
  initialSinceSerialNo: number,
  signal: AbortSignal,
  updateEligibility: UpdateWaveEligibility
): Promise<SyncNewestMessagesResult> {
  const allFetchedDrops: ApiDrop[] = [];
  let currentSinceSerialNo = initialSinceSerialNo;
  let overallHighestSerialNo = initialSinceSerialNo;

  try {
    while (!signal.aborted) {
      const { drops: fetchedChunk, highestSerialNo: chunkHighestSerial } =
        await fetchNewestWaveMessages(
          waveId,
          currentSinceSerialNo,
          FETCH_NEWEST_LIMIT,
          signal,
          updateEligibility
        );

      if (fetchedChunk === null) {
        return { drops: null, highestSerialNo: null };
      }

      if (fetchedChunk.length === 0 || chunkHighestSerial === null) {
        break;
      }

      allFetchedDrops.push(...fetchedChunk);
      overallHighestSerialNo = Math.max(
        overallHighestSerialNo,
        chunkHighestSerial
      );
      currentSinceSerialNo = chunkHighestSerial;

      if (fetchedChunk.length < FETCH_NEWEST_LIMIT) {
        break;
      }
    }
  } catch (error) {
    if (isAbortError(error)) {
      throw error;
    }

    console.error(
      `[WaveDataFetching] Error during fetchNewest loop for ${waveId}:`,
      error
    );
    return { drops: null, highestSerialNo: null };
  }

  if (signal.aborted) {
    throw new DOMException("Aborted", "AbortError");
  }

  return {
    drops: allFetchedDrops,
    highestSerialNo: overallHighestSerialNo,
  };
}

export function useWaveDataFetching({
  updateData,
  getData,
}: WaveDataStoreUpdater) {
  // Compose with the smaller hooks
  const { getLoadingState, setLoadingState, setPromise, clearLoadingState } =
    useWaveLoadingState();

  const { cancelFetch, createController, cleanupController } =
    useWaveAbortController();

  const { updateEligibility } = useWaveEligibility();

  /**
   * Checks if a wave already has data, returns true if loading should continue
   */
  const hasWaveData = useCallback(
    (waveId: string): boolean => {
      const existingData = getData(waveId);
      return (existingData?.drops.length ?? 0) > 0;
    },
    [getData]
  );

  /**
   * Handles successful fetch results
   */
  const handleFetchSuccess = useCallback(
    (waveId: string, drops: ApiDrop[] | null) => {
      // Clear loading state when done
      clearLoadingState(waveId);
      // Update data in store if we got results
      if (drops) {
        markMobileLaunchStep("wave_messages_loaded");
        const update = formatWaveMessages(waveId, drops, { isLoading: false });
        updateData(update);
      }

      return drops;
    },
    [updateData, clearLoadingState]
  );

  /**
   * Handles fetch errors
   */
  const handleFetchError = useCallback(
    (waveId: string, error: unknown) => {
      // Handle abort errors differently than other errors
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      // Clear loading state on error
      clearLoadingState(waveId);

      // Update store with empty data
      updateData(createEmptyWaveMessages(waveId, { isLoading: false }));

      console.error(
        `[WaveDataManager] Error fetching messages for ${waveId}:`,
        error
      );
    },
    [updateData, clearLoadingState]
  );

  /**
   * Fetches ALL messages newer than a given serial number by potentially
   * looping internal API calls until caught up.
   * This is intended for background reconciliation after WebSocket updates.
   */
  const syncNewestMessages = useCallback(
    async (
      waveId: string,
      initialSinceSerialNo: number,
      signal: AbortSignal
    ): Promise<SyncNewestMessagesResult> => {
      const result = await fetchAllNewestWaveMessages(
        waveId,
        initialSinceSerialNo,
        signal,
        updateEligibility
      );

      if (result.drops !== null) {
        updateData(formatWaveMessages(waveId, result.drops));
      }

      return result;
    },
    [updateData, updateEligibility]
  );

  const syncNewestMessagesSafely = useCallback(
    async (
      waveId: string,
      initialSinceSerialNo: number,
      signal: AbortSignal
    ) => {
      try {
        await syncNewestMessages(waveId, initialSinceSerialNo, signal);
      } catch (error) {
        reportSyncNewestError(waveId, error);
      }
    },
    [syncNewestMessages]
  );

  /**
   * Main function to fetch and activate wave data
   */
  const activateWave = useCallback(
    async (waveId: string, syncNewest = false) => {
      // Check if we need to fetch data
      if (hasWaveData(waveId)) {
        if (syncNewest) {
          const wave = getData(waveId);
          if (wave) {
            const highestSerialNo = getHighestLoadedSerialNo(wave.drops);
            if (highestSerialNo !== null) {
              const syncSignal = new AbortController().signal;
              void syncNewestMessagesSafely(
                waveId,
                highestSerialNo,
                syncSignal
              ); // NOSONAR
            }
          }
        }
        return;
      }

      // Get or initialize loading state and check if we should continue
      const { state: loadingState, shouldContinue } = getLoadingState(waveId);
      if (!shouldContinue) {
        return loadingState.promise;
      }

      // Mark as loading
      setLoadingState(waveId, true);
      updateData(createEmptyWaveMessages(waveId, { isLoading: true }));

      // Setup abort controller
      const controller = createController(waveId);

      // Create a new promise with the abort signal
      const fetchPromise = (async (): Promise<ApiDrop[] | null> => {
        try {
          const drops = await fetchWaveMessages(
            waveId,
            null,
            controller.signal,
            updateEligibility
          );
          return handleFetchSuccess(waveId, drops);
        } catch (error) {
          handleFetchError(waveId, error);
          return null;
        } finally {
          cleanupController(waveId, controller);
        }
      })();

      // Store the promise
      setPromise(waveId, fetchPromise);

      return fetchPromise;
    },
    [
      hasWaveData,
      getLoadingState,
      setLoadingState,
      updateData,
      createController,
      handleFetchSuccess,
      handleFetchError,
      cleanupController,
      setPromise,
      getData,
      syncNewestMessagesSafely,
      updateEligibility,
    ]
  );

  /**
   * Simplified interface to activate a wave
   */
  const registerWave = useCallback(
    (waveId: string, syncNewest = false) => {
      void activateWave(waveId, syncNewest); // NOSONAR: intentional fire-and-forget registration.
    },
    [activateWave]
  );

  const cancelWaveDataFetch = cancelFetch;

  return {
    registerWave,
    cancelWaveDataFetch,
    syncNewestMessages,
  };
}
