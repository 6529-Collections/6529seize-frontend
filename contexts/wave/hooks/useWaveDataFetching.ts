"use client";

import {
  getWaveDropsInitialLimit,
  WAVE_DROPS_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  getProductImpactNowMs,
  isProductImpactAbortError,
  trackWaveFeedLoadCancelled,
  trackWaveFeedLoadFailed,
  trackWaveFeedLoadStarted,
  trackWaveFeedLoadSucceeded,
} from "@/services/analytics/productImpactTelemetry";
import { markMobileLaunchStep } from "@/utils/monitoring/mobileLaunchTiming";
import { useCallback, useEffect, useRef } from "react";
import {
  type WaveEligibility,
  useWaveEligibility,
} from "../WaveEligibilityContext";
import {
  createEmptyWaveMessages,
  fetchNewestWaveMessages,
  fetchWaveMessages,
  formatWaveMessages,
} from "../utils/wave-messages-utils";
import { useWaveAbortController } from "./useWaveAbortController";
import { useWaveLoadingState } from "./useWaveLoadingState";
import type {
  WaveDataStoreUpdater,
  WaveMessages,
  WaveMessagesUpdate,
} from "./types";

const FETCH_NEWEST_LIMIT = 50;
const MAX_FETCH_NEWEST_ITERATIONS = 20;
const NATIVE_INITIAL_BACKFILL_DELAY_MS = 250;
const getNewestSyncAbortKey = (waveId: string): string =>
  `${waveId}-newest-sync`;

interface RegisterWaveOptions {
  readonly skipInitialBackfill?: boolean | undefined;
}

interface WaveDataFetchingProps extends WaveDataStoreUpdater {
  readonly isCapacitor?: boolean | undefined;
}

type DropWithSerialNo = Pick<ApiDrop, "serial_no">;

type UpdateEligibility = (
  waveId: string,
  eligibility: Partial<WaveEligibility>
) => void;

const maxDefinedSerialNo = (
  ...values: readonly (number | null | undefined)[]
): number | null => {
  const serialNumbers = values.filter(
    (value): value is number =>
      typeof value === "number" && Number.isFinite(value)
  );

  return serialNumbers.length === 0 ? null : Math.max(...serialNumbers);
};

const getOldestSerialNo = (
  drops: readonly DropWithSerialNo[]
): number | null => {
  if (drops.length === 0) {
    return null;
  }

  return Math.min(...drops.map((drop) => drop.serial_no));
};

const isAbortError = (error: unknown): boolean =>
  isProductImpactAbortError(error);

const createAbortError = (): DOMException =>
  new DOMException("Aborted", "AbortError");

const createWaveFeedUnavailableError = (): Error =>
  new Error("Wave feed request returned no data");

const clearWaveMessagesLoading = (waveId: string): WaveMessagesUpdate => ({
  key: waveId,
  isLoading: false,
});

const getTelemetryDurationMs = (startedAtMs: number): number =>
  Math.max(0, Math.round(getProductImpactNowMs() - startedAtMs));

const throwIfAborted = (signal: AbortSignal): void => {
  if (signal.aborted) {
    throw createAbortError();
  }
};

const logUnexpectedAsyncError = (message: string, error: unknown): void => {
  if (isAbortError(error)) {
    return;
  }

  console.error(message, error);
};

const getBackfillRequest = (
  currentData: WaveMessages | undefined,
  initialOldestSerialNo: number
): { readonly limit: number; readonly serialNo: number } | null => {
  if (
    currentData === undefined ||
    currentData.drops.length === 0 ||
    currentData.drops.length >= WAVE_DROPS_PARAMS.limit
  ) {
    return null;
  }

  const limit = WAVE_DROPS_PARAMS.limit - currentData.drops.length;
  if (limit <= 0) {
    return null;
  }

  return {
    limit,
    serialNo: getOldestSerialNo(currentData.drops) ?? initialOldestSerialNo,
  };
};

const formatNativeBackfillMessages = ({
  backfillDrops,
  currentData,
  hasNextPage,
  waveId,
}: {
  readonly backfillDrops: ApiDrop[];
  readonly currentData: WaveMessages | undefined;
  readonly hasNextPage: boolean;
  readonly waveId: string;
}): WaveMessagesUpdate => {
  const backfillUpdate = formatWaveMessages(waveId, backfillDrops, {
    hasNextPage,
    isLoading: false,
  });

  if (
    currentData === undefined ||
    currentData.drops.length === 0 ||
    backfillUpdate.drops === undefined
  ) {
    return backfillUpdate;
  }

  return {
    ...backfillUpdate,
    drops: [...currentData.drops, ...backfillUpdate.drops],
    latestFetchedSerialNo: maxDefinedSerialNo(
      currentData.latestFetchedSerialNo,
      backfillUpdate.latestFetchedSerialNo
    ),
  };
};

async function runNativeInitialBackfill({
  cleanupController,
  createController,
  getData,
  initialOldestSerialNo,
  updateData,
  updateEligibility,
  waveId,
}: {
  readonly cleanupController: (
    waveId: string,
    controller: AbortController
  ) => void;
  readonly createController: (waveId: string) => AbortController;
  readonly getData: WaveDataStoreUpdater["getData"];
  readonly initialOldestSerialNo: number;
  readonly updateData: WaveDataStoreUpdater["updateData"];
  readonly updateEligibility: UpdateEligibility;
  readonly waveId: string;
}): Promise<void> {
  const request = getBackfillRequest(getData(waveId), initialOldestSerialNo);
  if (request === null) {
    return;
  }

  const abortKey = `${waveId}-initial-backfill`;
  const controller = createController(abortKey);

  try {
    const backfillDrops = await fetchWaveMessages(
      waveId,
      request.serialNo,
      controller.signal,
      updateEligibility,
      { limit: request.limit }
    );

    if (backfillDrops === null) {
      return;
    }

    updateData(
      formatNativeBackfillMessages({
        backfillDrops,
        currentData: getData(waveId),
        hasNextPage: backfillDrops.length >= request.limit,
        waveId,
      })
    );
  } catch (error: unknown) {
    if (isAbortError(error)) {
      return;
    }

    console.error(
      `[WaveDataManager] Error backfilling initial messages for ${waveId}:`,
      error
    );
  } finally {
    cleanupController(abortKey, controller);
  }
}

function useNativeInitialBackfill({
  cancelFetch,
  cleanupController,
  createController,
  getData,
  initialWaveDropsLimit,
  isCapacitor,
  updateData,
  updateEligibility,
}: {
  readonly cancelFetch: (waveId: string) => void;
  readonly cleanupController: (
    waveId: string,
    controller: AbortController
  ) => void;
  readonly createController: (waveId: string) => AbortController;
  readonly getData: WaveDataStoreUpdater["getData"];
  readonly initialWaveDropsLimit: number;
  readonly isCapacitor: boolean;
  readonly updateData: WaveDataStoreUpdater["updateData"];
  readonly updateEligibility: UpdateEligibility;
}) {
  const initialBackfillTimeoutsRef = useRef<
    Record<string, ReturnType<typeof setTimeout>>
  >({});

  const clearInitialBackfillTimeout = useCallback((waveId: string) => {
    const timeoutId = initialBackfillTimeoutsRef.current[waveId];
    if (timeoutId === undefined) {
      return;
    }

    clearTimeout(timeoutId);
    delete initialBackfillTimeoutsRef.current[waveId];
  }, []);

  useEffect(() => {
    return () => {
      for (const timeoutId of Object.values(
        initialBackfillTimeoutsRef.current
      )) {
        clearTimeout(timeoutId);
      }
      initialBackfillTimeoutsRef.current = {};
    };
  }, []);

  const scheduleNativeInitialBackfill = useCallback(
    (
      waveId: string,
      initialDrops: readonly ApiDrop[] | null,
      options?: RegisterWaveOptions
    ) => {
      if (
        !isCapacitor ||
        options?.skipInitialBackfill === true ||
        initialDrops === null ||
        initialDrops.length === 0 ||
        initialDrops.length < initialWaveDropsLimit ||
        initialWaveDropsLimit >= WAVE_DROPS_PARAMS.limit
      ) {
        return;
      }

      const initialOldestSerialNo = getOldestSerialNo(initialDrops);
      if (initialOldestSerialNo === null) {
        return;
      }

      clearInitialBackfillTimeout(waveId);
      cancelFetch(`${waveId}-initial-backfill`);

      initialBackfillTimeoutsRef.current[waveId] = setTimeout(() => {
        delete initialBackfillTimeoutsRef.current[waveId];
        /* NOSONAR - intentional fire-and-forget */ void runNativeInitialBackfill(
          {
            cleanupController,
            createController,
            getData,
            initialOldestSerialNo,
            updateData,
            updateEligibility,
            waveId,
          }
        );
      }, NATIVE_INITIAL_BACKFILL_DELAY_MS);
    },
    [
      cancelFetch,
      cleanupController,
      clearInitialBackfillTimeout,
      createController,
      getData,
      initialWaveDropsLimit,
      isCapacitor,
      updateData,
      updateEligibility,
    ]
  );

  return {
    clearInitialBackfillTimeout,
    scheduleNativeInitialBackfill,
  };
}

async function fetchNewestMessagesUntilCaughtUp({
  initialSinceSerialNo,
  signal,
  updateEligibility,
  waveId,
}: {
  readonly initialSinceSerialNo: number;
  readonly signal: AbortSignal;
  readonly updateEligibility: UpdateEligibility;
  readonly waveId: string;
}): Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }> {
  let allFetchedDrops: ApiDrop[] = [];
  let currentSinceSerialNo = initialSinceSerialNo;
  let overallHighestSerialNo = initialSinceSerialNo;
  let iterations = 0;

  try {
    while (!signal.aborted && iterations < MAX_FETCH_NEWEST_ITERATIONS) {
      iterations++;
      const { drops: fetchedChunk, highestSerialNo: chunkHighestSerial } =
        await fetchNewestWaveMessages(
          waveId,
          currentSinceSerialNo,
          FETCH_NEWEST_LIMIT,
          signal,
          updateEligibility
        );

      throwIfAborted(signal);

      if (fetchedChunk === null) {
        return { drops: null, highestSerialNo: null };
      }

      if (fetchedChunk.length === 0) {
        break;
      }

      allFetchedDrops = allFetchedDrops.concat(fetchedChunk);

      if (chunkHighestSerial === null) {
        break;
      }

      overallHighestSerialNo = Math.max(
        overallHighestSerialNo,
        chunkHighestSerial
      );
      currentSinceSerialNo = chunkHighestSerial;

      if (fetchedChunk.length < FETCH_NEWEST_LIMIT) {
        break;
      }
    }

    throwIfAborted(signal);

    return {
      drops: allFetchedDrops,
      highestSerialNo: overallHighestSerialNo,
    };
  } catch (error: unknown) {
    if (isAbortError(error)) {
      throw error;
    }

    console.error(
      `[WaveDataFetching] Error during fetchNewest loop for ${waveId}:`,
      error
    );
    return { drops: null, highestSerialNo: null };
  }
}

function useSyncNewestMessages({
  updateData,
  updateEligibility,
}: {
  readonly updateData: WaveDataStoreUpdater["updateData"];
  readonly updateEligibility: UpdateEligibility;
}) {
  return useCallback(
    async (
      waveId: string,
      initialSinceSerialNo: number,
      signal: AbortSignal
    ): Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }> => {
      const result = await fetchNewestMessagesUntilCaughtUp({
        initialSinceSerialNo,
        signal,
        updateEligibility,
        waveId,
      });

      if (result.drops !== null) {
        updateData(formatWaveMessages(waveId, result.drops));
      }

      return result;
    },
    [updateData, updateEligibility]
  );
}

function useSyncExistingWaveNewestMessages({
  cleanupController,
  createController,
  getData,
  syncNewestMessages,
}: {
  readonly cleanupController: (
    waveId: string,
    controller: AbortController
  ) => void;
  readonly createController: (waveId: string) => AbortController;
  readonly getData: WaveDataStoreUpdater["getData"];
  readonly syncNewestMessages: ReturnType<typeof useSyncNewestMessages>;
}) {
  return useCallback(
    async (waveId: string): Promise<void> => {
      const wave = getData(waveId);
      if (wave === undefined || wave.drops.length === 0) {
        return;
      }

      const highestSerialNo = Math.max(
        ...wave.drops.map((drop) => drop.serial_no)
      );
      if (!Number.isFinite(highestSerialNo)) {
        return;
      }

      const abortKey = getNewestSyncAbortKey(waveId);
      const controller = createController(abortKey);

      try {
        await syncNewestMessages(waveId, highestSerialNo, controller.signal);
      } finally {
        cleanupController(abortKey, controller);
      }
    },
    [cleanupController, createController, getData, syncNewestMessages]
  );
}

export function useWaveDataFetching({
  updateData,
  getData,
  isCapacitor = false,
}: WaveDataFetchingProps) {
  const { getLoadingState, setLoadingState, setPromise, clearLoadingState } =
    useWaveLoadingState();
  const { cancelFetch, createController, cleanupController } =
    useWaveAbortController();
  const { updateEligibility } = useWaveEligibility();
  const initialWaveDropsLimit = getWaveDropsInitialLimit(isCapacitor);
  const trackedCacheSuccessWaveIdsRef = useRef<Set<string>>(new Set());
  const syncNewestMessages = useSyncNewestMessages({
    updateData,
    updateEligibility,
  });
  const syncExistingWaveNewestMessages = useSyncExistingWaveNewestMessages({
    cleanupController,
    createController,
    getData,
    syncNewestMessages,
  });
  const { clearInitialBackfillTimeout, scheduleNativeInitialBackfill } =
    useNativeInitialBackfill({
      cancelFetch,
      cleanupController,
      createController,
      getData,
      initialWaveDropsLimit,
      isCapacitor,
      updateData,
      updateEligibility,
    });

  const handleFetchSuccess = useCallback(
    (waveId: string, drops: ApiDrop[] | null) => {
      clearLoadingState(waveId);
      if (drops === null) {
        updateData(clearWaveMessagesLoading(waveId));
        return null;
      }

      markMobileLaunchStep("wave_messages_loaded");
      updateData(formatWaveMessages(waveId, drops, { isLoading: false }));
      return drops;
    },
    [clearLoadingState, updateData]
  );

  const handleFetchError = useCallback(
    (waveId: string, error: unknown) => {
      if (isAbortError(error)) {
        return;
      }

      clearLoadingState(waveId);
      updateData(createEmptyWaveMessages(waveId, { isLoading: false }));

      console.error(
        `[WaveDataManager] Error fetching messages for ${waveId}:`,
        error
      );
    },
    [clearLoadingState, updateData]
  );

  const activateWave = useCallback(
    async (
      waveId: string,
      syncNewest = false,
      options?: RegisterWaveOptions
    ) => {
      const existingDropsCount = getData(waveId)?.drops.length ?? 0;
      if (existingDropsCount > 0) {
        if (!trackedCacheSuccessWaveIdsRef.current.has(waveId)) {
          trackedCacheSuccessWaveIdsRef.current.add(waveId);
          trackWaveFeedLoadSucceeded({
            dropCount: existingDropsCount,
            hadCachedDrops: true,
            isNative: isCapacitor,
            loadSource: "cache",
          });
        }

        if (syncNewest) {
          try {
            await syncExistingWaveNewestMessages(waveId);
          } catch (error: unknown) {
            logUnexpectedAsyncError(
              `[WaveDataFetching] Error syncing newest messages for ${waveId}:`,
              error
            );
          }
        }
        return;
      }

      const { state: loadingState, shouldContinue } = getLoadingState(waveId);
      if (!shouldContinue) {
        return loadingState.promise;
      }

      setLoadingState(waveId, true);
      updateData(createEmptyWaveMessages(waveId, { isLoading: true }));

      const controller = createController(waveId);
      const telemetryStartedAtMs = getProductImpactNowMs();
      trackWaveFeedLoadStarted({
        hadCachedDrops: false,
        isNative: isCapacitor,
        loadSource: "initial_visible",
      });
      let fetchFailureError: unknown;
      const initialFetchOptions = {
        ...(initialWaveDropsLimit === WAVE_DROPS_PARAMS.limit
          ? {}
          : { limit: initialWaveDropsLimit }),
        onFailure: (error: unknown) => {
          fetchFailureError = error;
        },
      };
      const fetchPromise = (async (): Promise<ApiDrop[] | null> => {
        try {
          const drops = await fetchWaveMessages(
            waveId,
            null,
            controller.signal,
            updateEligibility,
            initialFetchOptions
          );
          const fetchedDrops = handleFetchSuccess(waveId, drops);
          if (fetchedDrops === null) {
            const failureError =
              fetchFailureError ?? createWaveFeedUnavailableError();
            if (isAbortError(failureError)) {
              trackWaveFeedLoadCancelled({
                durationMs: getTelemetryDurationMs(telemetryStartedAtMs),
                error: failureError,
                hadCachedDrops: false,
                isNative: isCapacitor,
                loadSource: "initial_visible",
                remainedUnavailable: false,
              });
            } else {
              trackWaveFeedLoadFailed({
                durationMs: getTelemetryDurationMs(telemetryStartedAtMs),
                error: failureError,
                hadCachedDrops: false,
                isNative: isCapacitor,
                loadSource: "initial_visible",
                remainedUnavailable: true,
              });
            }
            return null;
          }

          trackWaveFeedLoadSucceeded({
            dropCount: fetchedDrops.length,
            durationMs: getTelemetryDurationMs(telemetryStartedAtMs),
            hadCachedDrops: false,
            isNative: isCapacitor,
            loadSource: "initial_visible",
          });
          scheduleNativeInitialBackfill(waveId, fetchedDrops, options);
          return fetchedDrops;
        } catch (error: unknown) {
          if (isAbortError(error)) {
            trackWaveFeedLoadCancelled({
              durationMs: getTelemetryDurationMs(telemetryStartedAtMs),
              error,
              hadCachedDrops: false,
              isNative: isCapacitor,
              loadSource: "initial_visible",
              remainedUnavailable: false,
            });
          } else {
            trackWaveFeedLoadFailed({
              durationMs: getTelemetryDurationMs(telemetryStartedAtMs),
              error,
              hadCachedDrops: false,
              isNative: isCapacitor,
              loadSource: "initial_visible",
              remainedUnavailable: true,
            });
          }
          handleFetchError(waveId, error);
          return null;
        } finally {
          cleanupController(waveId, controller);
        }
      })();

      setPromise(waveId, fetchPromise);

      return fetchPromise;
    },
    [
      cleanupController,
      createController,
      getData,
      getLoadingState,
      handleFetchError,
      handleFetchSuccess,
      isCapacitor,
      initialWaveDropsLimit,
      scheduleNativeInitialBackfill,
      setLoadingState,
      setPromise,
      syncExistingWaveNewestMessages,
      updateData,
      updateEligibility,
    ]
  );

  const registerWave = useCallback(
    (waveId: string, syncNewest = false, options?: RegisterWaveOptions) => {
      /* NOSONAR - intentional fire-and-forget */ void activateWave(
        waveId,
        syncNewest,
        options
      );
    },
    [activateWave]
  );

  const cancelWaveDataFetch = useCallback(
    (waveId: string) => {
      clearInitialBackfillTimeout(waveId);
      cancelFetch(waveId);
      cancelFetch(`${waveId}-initial-backfill`);
      cancelFetch(getNewestSyncAbortKey(waveId));
    },
    [cancelFetch, clearInitialBackfillTimeout]
  );

  return {
    registerWave,
    cancelWaveDataFetch,
    syncNewestMessages,
  };
}
