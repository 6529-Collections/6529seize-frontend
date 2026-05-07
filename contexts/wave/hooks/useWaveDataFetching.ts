"use client";

import { useCallback, useLayoutEffect, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/components/auth/Auth";
import { reconcileServerDropsForDisplay } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import { getReactionProfileId } from "@/components/waves/drops/reaction-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { DropSize, type ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { useWaveLoadingState } from "./useWaveLoadingState";
import { useWaveAbortController } from "./useWaveAbortController";
import type { WaveDataStoreUpdater, WaveMessages } from "./types";
import {
  fetchWaveMessages,
  formatWaveMessages,
  createEmptyWaveMessages,
  fetchNewestWaveMessages,
} from "../utils/wave-messages-utils";
import { useWaveEligibility } from "../WaveEligibilityContext";

// Define the limit constant used by the fetch utility
const FETCH_NEWEST_LIMIT = 50;

function getFullDrops(
  data: WaveMessages | undefined
): ExtendedDrop[] | undefined {
  if (data === undefined) {
    return undefined;
  }

  return data.drops.filter(
    (drop): drop is ExtendedDrop => drop.type === DropSize.FULL
  );
}

export function useWaveDataFetching({
  updateData,
  getData,
}: WaveDataStoreUpdater) {
  const { connectedProfile } = useAuth();
  const queryClient = useQueryClient();
  const activeProfileId = getReactionProfileId(connectedProfile);
  const activeProfileIdRef = useRef<string | null>(activeProfileId);
  useLayoutEffect(() => {
    activeProfileIdRef.current = activeProfileId;
  }, [activeProfileId]);

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

  const reconcileFetchedDrops = useCallback(
    (
      waveId: string,
      serverDrops: ApiDrop[],
      requestProfileId: string | null
    ): ApiDrop[] => {
      const latestData = getData(waveId);
      const latestWaveDrops = getFullDrops(latestData);

      return reconcileServerDropsForDisplay({
        requestProfileId,
        currentProfileId: activeProfileIdRef.current,
        queryClient,
        serverDrops,
        ...(latestWaveDrops !== undefined ? { latestWaveDrops } : {}),
        websocketStatus: WebSocketStatus.CONNECTED,
      });
    },
    [getData, queryClient]
  );

  /**
   * Handles successful fetch results
   */
  const handleFetchSuccess = useCallback(
    (
      waveId: string,
      drops: ApiDrop[] | null,
      requestProfileId: string | null
    ) => {
      // Clear loading state when done
      clearLoadingState(waveId);
      // Update data in store if we got results
      if (drops) {
        const displayDrops = reconcileFetchedDrops(
          waveId,
          drops,
          requestProfileId
        );
        const update = formatWaveMessages(waveId, displayDrops, {
          isLoading: false,
        });
        updateData(update);
      }

      return drops;
    },
    [updateData, clearLoadingState, reconcileFetchedDrops]
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
   * Main function to fetch and activate wave data
   */
  const activateWave = useCallback(
    async (waveId: string, syncNewest = false) => {
      // Check if we need to fetch data
      if (hasWaveData(waveId)) {
        if (syncNewest) {
          const wave = getData(waveId);
          if (wave) {
            const highestSerialNo = Math.max(
              ...wave.drops.map((drop) => drop.serial_no)
            );
            if (highestSerialNo > 0) {
              void (async () => {
                try {
                  await syncNewestMessages(
                    waveId,
                    highestSerialNo,
                    new AbortController().signal
                  );
                } catch (error: unknown) {
                  const isAbortError =
                    error instanceof DOMException &&
                    error.name === "AbortError";
                  if (!isAbortError) {
                    console.error("Error syncing newest messages:", error);
                  }
                }
              })();
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
      const requestActiveProfileId = activeProfileIdRef.current;

      // Create a new promise with the abort signal
      const fetchPromise = (async (): Promise<ApiDrop[] | null> => {
        try {
          const drops = await fetchWaveMessages(
            waveId,
            null,
            controller.signal,
            updateEligibility
          );
          return handleFetchSuccess(waveId, drops, requestActiveProfileId);
        } catch (error: unknown) {
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
    ]
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
      signal: AbortSignal,
      reconcileDrops?: (drops: ApiDrop[]) => ApiDrop[]
    ): Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }> => {
      const requestActiveProfileId = activeProfileIdRef.current;
      let allFetchedDrops: ApiDrop[] = [];
      let currentSinceSerialNo = initialSinceSerialNo;
      let keepFetching = true;
      let overallHighestSerialNo: number | null = initialSinceSerialNo; // Track highest overall

      while (keepFetching && !signal.aborted) {
        try {
          const { drops: fetchedChunk, highestSerialNo: chunkHighestSerial } =
            await fetchNewestWaveMessages(
              // Call the utility function
              waveId,
              currentSinceSerialNo,
              FETCH_NEWEST_LIMIT,
              signal,
              updateEligibility
            );

          // Check if aborted during the fetch utility call
          if (signal.aborted) {
            throw new DOMException("Aborted", "AbortError");
          }

          if (fetchedChunk === null) {
            // fetchNewestWaveMessages utility returned null drops (error occurred)
            // Error details already logged in utility function
            return { drops: null, highestSerialNo: null };
          }

          if (fetchedChunk.length === 0) {
            keepFetching = false; // No more drops found
            continue;
          }

          allFetchedDrops = allFetchedDrops.concat(fetchedChunk);
          // Update highest serial number seen so far
          if (chunkHighestSerial !== null) {
            overallHighestSerialNo = Math.max(
              overallHighestSerialNo,
              chunkHighestSerial
            );
            currentSinceSerialNo = chunkHighestSerial; // Use the highest from this chunk for the next iteration
          } else {
            keepFetching = false;
          }

          // Stop loop if fetch returned fewer drops than the limit.
          if (fetchedChunk.length < FETCH_NEWEST_LIMIT) {
            keepFetching = false;
          }
        } catch (error) {
          // Handle errors specifically from the fetchNewestWaveMessages call or aborts
          if (error instanceof DOMException && error.name === "AbortError") {
            throw error; // Re-throw abort to be handled by caller
          }
          // Log other errors from within the loop/utility call
          console.error(
            `[WaveDataFetching] Error during fetchNewest loop for ${waveId}:`,
            error
          );
          return { drops: null, highestSerialNo: null }; // Indicate failure
        }
      } // end while loop

      if (signal.aborted) {
        throw new DOMException("Aborted", "AbortError");
      }
      const displayDrops = reconcileDrops
        ? reconcileDrops(allFetchedDrops)
        : reconcileFetchedDrops(
            waveId,
            allFetchedDrops,
            requestActiveProfileId
          );
      const update = formatWaveMessages(waveId, displayDrops);
      updateData(update);
      // Return all accumulated drops and the overall highest serial number found
      return {
        drops: displayDrops,
        highestSerialNo: overallHighestSerialNo,
      };
    },
    [updateData, updateEligibility, reconcileFetchedDrops]
  );

  /**
   * Simplified interface to activate a wave
   */
  const registerWave = useCallback(
    (waveId: string, syncNewest = false) => {
      void activateWave(waveId, syncNewest);
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
