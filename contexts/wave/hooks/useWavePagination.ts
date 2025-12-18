"use client";

import { useCallback, useRef } from "react";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { useWaveAbortController } from "./useWaveAbortController";
import { WaveDataStoreUpdater } from "./types";
import {
  fetchLightWaveMessages,
  fetchWaveMessages,
  fetchAroundSerialNoWaveMessages,
} from "../utils/wave-messages-utils";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { ApiLightDrop } from "@/generated/models/ApiLightDrop";
import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";

// Tracks which waves are currently loading next page
interface PaginationState {
  isLoading: boolean;
  promise: Promise<(ApiDrop | ApiLightDrop)[] | null> | null;
}

export type NextPageProps = NextPageFullProps | NextPageLightProps;

interface NextPageFullProps {
  readonly waveId: string;
  readonly type: DropSize.FULL;
}

interface NextPageLightProps {
  readonly waveId: string;
  readonly type: DropSize.LIGHT;
  readonly targetSerialNo: number;
}

// Tracks the state for fetching messages around a specific serial number
interface AroundSerialNoState {
  isFetching: boolean;
  pendingSerialNo: number | null;
}

export function useWavePagination({
  updateData,
  getData,
}: WaveDataStoreUpdater) {
  // Use the common hooks
  const {
    cancelFetch: cancelAbort,
    createController,
    cleanupController,
  } = useWaveAbortController();

  // Track pagination loading state
  const paginationStates = useRef<Record<string, PaginationState>>({});
  // Track state for fetching around a serial number
  const aroundSerialNoStates = useRef<Record<string, AroundSerialNoState>>({});

  const aroundQueueLastSuccessfullyFetchedSerialNoRef = useRef<number | null>(
    null
  );
  const aroundQueueLastFetchedMinSerialNoRef = useRef<number | null>(null);
  const aroundQueueLastFetchedMaxSerialNoRef = useRef<number | null>(null);

  const determineSerialToFetch = useCallback(
    (pendingSerialNo: number | null): number | null => {
      if (pendingSerialNo === null) {
        return null;
      }

      const lastSuccessfullyFetchedSerialNo =
        aroundQueueLastSuccessfullyFetchedSerialNoRef.current;

      if (lastSuccessfullyFetchedSerialNo === null) {
        return pendingSerialNo;
      }

      if (pendingSerialNo === lastSuccessfullyFetchedSerialNo) {
        return pendingSerialNo;
      }

      if (pendingSerialNo > lastSuccessfullyFetchedSerialNo) {
        const lastFetchedMaxSerialNo =
          aroundQueueLastFetchedMaxSerialNoRef.current;
        if (lastFetchedMaxSerialNo === null) {
          return pendingSerialNo;
        }
        if (
          pendingSerialNo >
          lastFetchedMaxSerialNo + WAVE_DROPS_PARAMS.limit
        ) {
          return pendingSerialNo;
        }
        return lastFetchedMaxSerialNo + (WAVE_DROPS_PARAMS.limit - 1);
      } else {
        // pendingSerialNo < lastSuccessfullyFetchedSerialNo
        const lastFetchedMinSerialNo =
          aroundQueueLastFetchedMinSerialNoRef.current;
        if (lastFetchedMinSerialNo === null) {
          return pendingSerialNo;
        }
        if (
          pendingSerialNo <
          lastFetchedMinSerialNo - WAVE_DROPS_PARAMS.limit
        ) {
          return pendingSerialNo;
        }
        return lastFetchedMinSerialNo - (WAVE_DROPS_PARAMS.limit - 1);
      }
    },
    [] // No dependencies as it only uses refs
  );

  /**
   * Gets the oldest message's serial number for pagination
   */
  const getOldestMessageSerialNo = useCallback(
    (waveId: string): number | null => {
      const data = getData(waveId);
      if (!data?.drops.length) {
        return null;
      }

      // Sort by serial_no and get the smallest (oldest) one
      const serialNos = data.drops.map((drop) => drop.serial_no);
      return Math.min(...serialNos);
    },
    [getData]
  );

  /**
   * Updates store with new paginated data
   */
  const updateWithPaginatedData = useCallback(
    (waveId: string, newDrops: (ApiDrop | ApiLightDrop)[] | null) => {
      // Clear the loading state
      if (paginationStates.current[waveId]) {
        paginationStates.current[waveId].isLoading = false;
        paginationStates.current[waveId].promise = null;
      }

      if (newDrops === null) {
        return null;
      }

      if (!newDrops?.length) {
        // No more drops to load, update hasNextPage
        const currentData = getData(waveId);
        if (currentData) {
          updateData({
            key: waveId,
            isLoadingNextPage: false,
            hasNextPage: false,
          });
        }
        return null;
      }

      const currentData = getData(waveId);
      if (!currentData) {
        return null;
      }

      updateData({
        key: waveId,
        isLoadingNextPage: false,
        hasNextPage: newDrops.length > 0,
        drops: newDrops.map((drop) => {
          if ("part_1_text" in drop) {
            return {
              ...drop,
              waveId,
              type: DropSize.LIGHT,
              stableKey: drop.id,
              stableHash: drop.id,
            };
          }

          return {
            ...drop,
            type: DropSize.FULL,
            stableKey: drop.id,
            stableHash: drop.id,
          };
        }),
      });

      return newDrops;
    },
    [getData, updateData]
  );

  /**
   * Handles errors during pagination
   */
  const handlePaginationError = useCallback(
    (waveId: string, error: unknown) => {
      // Clear loading state
      if (paginationStates.current[waveId]) {
        paginationStates.current[waveId].isLoading = false;
        paginationStates.current[waveId].promise = null;
      }

      // Reset loading indicator in store
      const currentData = getData(waveId);
      if (currentData) {
        updateData({
          key: waveId,
          isLoadingNextPage: false,
        });
      }

      // Handle abort errors differently
      if (error instanceof DOMException && error.name === "AbortError") {
        return;
      }

      console.error(
        `[WaveDataManager] Error fetching more messages for ${waveId}:`,
        error
      );
    },
    [getData, updateData]
  );

  /**
   * Fetches the next page of data for a wave
   */
  const fetchNextPage = useCallback(
    async (
      props: NextPageProps
    ): Promise<(ApiDrop | ApiLightDrop)[] | null> => {
      // Get current state
      const currentData = getData(props.waveId);
      if (!currentData) {
        return null;
      }

      // Don't proceed if already loading or if no next page
      if (currentData.isLoadingNextPage || !currentData.hasNextPage) {
        return null;
      }

      // Check if already has a pagination loading state
      const paginationState = paginationStates.current[props.waveId] ?? {
        isLoading: false,
        promise: null,
      };
      paginationStates.current[props.waveId] = paginationState;

      // If already loading, return the existing promise
      if (paginationState.isLoading && paginationState.promise) {
        return paginationState.promise;
      }

      // Get the oldest message serial number for pagination
      const oldestSerialNo = getOldestMessageSerialNo(props.waveId);
      if (!oldestSerialNo) {
        return null;
      }

      // Mark as loading
      paginationState.isLoading = true;

      // Update store to show loading state
      updateData({
        key: props.waveId,
        isLoadingNextPage: true,
      });

      // Setup abort controller
      const controller = createController(props.waveId);

      // Create promise for the request
      const rawPromise =
        props.type === DropSize.FULL
          ? fetchWaveMessages(props.waveId, oldestSerialNo, controller.signal)
          : fetchLightWaveMessages(
              props.waveId,
              oldestSerialNo,
              props.targetSerialNo,
              controller.signal
            );

      const handledPromise = rawPromise
        .then((drops) => updateWithPaginatedData(props.waveId, drops))
        .catch((error) => {
          handlePaginationError(props.waveId, error);
          return null;
        })
        .finally(() => cleanupController(props.waveId, controller));

      // Store the promise so concurrent callers can await the same one
      paginationState.promise = handledPromise;

      return handledPromise;
    },
    [
      getData,
      updateData,
      getOldestMessageSerialNo,
      createController,
      updateWithPaginatedData,
      handlePaginationError,
      cleanupController,
    ]
  );

  /**
   * Cancels a pagination fetch if one is in progress
   */
  const cancelPaginationFetch = useCallback(
    (waveId: string) => {
      // Cancel the abort controller
      cancelAbort(waveId);

      // Clear pagination state
      if (paginationStates.current[waveId]) {
        paginationStates.current[waveId].isLoading = false;
        paginationStates.current[waveId].promise = null;
      }

      // Reset loading indicator in store
      const currentData = getData(waveId);
      if (currentData?.isLoadingNextPage) {
        updateData({
          key: waveId,
          isLoadingNextPage: false,
        });
      }
    },
    [cancelAbort, getData, updateData]
  );

  /**
   * Internal function to process the queue for fetching around a serial number.
   */
  const _processAroundSerialNoQueue = useCallback(
    async (waveId: string): Promise<void> => {
      const state = aroundSerialNoStates.current[waveId];
      if (!state) {
        return; // No state for this waveId
      }

      // Guard 1: Already fetching
      if (state.isFetching) {
        return;
      }

      // Guard 2: No pending request
      const serialToFetch = determineSerialToFetch(state.pendingSerialNo);
      if (serialToFetch === null) {
        return;
      }

      // Mark as busy and clear pending request
      state.isFetching = true;
      state.pendingSerialNo = null;

      // Unique key for abort controller, distinct from pagination
      const abortKey = `${waveId}-around`;
      const controller = createController(abortKey);

      try {
        const result = await fetchAroundSerialNoWaveMessages(
          waveId,
          serialToFetch,
          controller.signal
        );

        aroundQueueLastSuccessfullyFetchedSerialNoRef.current = serialToFetch;

        if (result) {
          updateData({
            key: waveId,
            drops: result.map((drop) => {
              return {
                ...drop,
                type: DropSize.FULL,
                stableKey: drop.id,
                stableHash: drop.id,
              };
            }),
          });

          if (result.length > 0) {
            const serials = result.map((drop) => drop.serial_no);
            aroundQueueLastFetchedMinSerialNoRef.current = Math.min(...serials);
            aroundQueueLastFetchedMaxSerialNoRef.current = Math.max(...serials);
          } else {
            aroundQueueLastFetchedMinSerialNoRef.current = null;
            aroundQueueLastFetchedMaxSerialNoRef.current = null;
            console.log(
              `[WavePagination] Fetched around serial no ${serialToFetch}, received an empty list of drops.`
            );
          }
        } else {
          aroundQueueLastFetchedMinSerialNoRef.current = null;
          aroundQueueLastFetchedMaxSerialNoRef.current = null;
          console.log(
            `[WavePagination] Fetched around serial no ${serialToFetch}, no new data (null result).`
          );
        }
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error(
            `[WavePagination] Error fetching around serial no ${serialToFetch} for wave ${waveId}:`,
            error
          );
        } else {
          console.log(
            `[WavePagination] Fetch around ${serialToFetch} aborted.`
          );
        }
      } finally {
        state.isFetching = false;
        cleanupController(abortKey, controller);
        // Trigger processing again in case a new request came in during the fetch
        _processAroundSerialNoQueue(waveId).catch(() => undefined);
      }
    },
    [createController, cleanupController, updateData, determineSerialToFetch]
  );

  /**
   * Requests fetching messages around a specific serial number.
   * Ensures only the latest request is processed after the current fetch completes.
   */
  const fetchAroundSerialNo = useCallback(
    (waveId: string, serialNo: number): void => {
      // Initialize state if it doesn't exist
      if (!aroundSerialNoStates.current[waveId]) {
        aroundSerialNoStates.current[waveId] = {
          isFetching: false,
          pendingSerialNo: null,
        };
      }

      // Store the latest requested serial number
      aroundSerialNoStates.current[waveId].pendingSerialNo = serialNo;

      // If a request is already in flight, abort it so only the latest will be processed
      if (aroundSerialNoStates.current[waveId].isFetching) {
        cancelAbort(`${waveId}-around`);
      }

      // Trigger the processing queue
      _processAroundSerialNoQueue(waveId).catch(() => undefined);
    },
    [cancelAbort, _processAroundSerialNoQueue] // Dependency: the internal processing function
  );

  return {
    fetchNextPage,
    cancelPaginationFetch,
    fetchAroundSerialNo, // Expose the new function
  };
}
