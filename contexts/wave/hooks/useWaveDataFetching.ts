"use client";

import {
  getWaveDropsInitialLimit,
  WAVE_DROPS_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { markMobileLaunchStep } from "@/utils/monitoring/mobileLaunchTiming";
import { useCallback, useRef } from "react";
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
import { useNativeInitialBackfill } from "./useNativeInitialBackfill";
import {
  createWaveFeedAbortError,
  createWaveFeedUnavailableError,
  getWaveFeedTelemetryStartedAtMs,
  isWaveFeedAbortError,
  trackWaveFeedLoadFailure,
  trackWaveFeedLoadStart,
  trackWaveFeedLoadSuccess,
  trackWaveFeedLoadTerminalFromError,
} from "./waveFeedTelemetry";
import { useWaveLoadingState } from "./useWaveLoadingState";
import type { WaveDataStoreUpdater, WaveMessagesUpdate } from "./types";

const FETCH_NEWEST_LIMIT = 50;
const MAX_FETCH_NEWEST_ITERATIONS = 20;
const getNewestSyncAbortKey = (waveId: string): string =>
  `${waveId}-newest-sync`;

interface RegisterWaveOptions {
  readonly isPrefetch?: boolean | undefined;
  readonly skipInitialBackfill?: boolean | undefined;
}

interface WaveDataFetchingProps extends WaveDataStoreUpdater {
  readonly hasServerFeedSeed: (waveId: string) => boolean;
  readonly isCapacitor?: boolean | undefined;
}

type UpdateEligibility = (
  waveId: string,
  eligibility: Partial<WaveEligibility>
) => void;

const isAbortError = isWaveFeedAbortError;

const clearWaveMessagesLoading = (waveId: string): WaveMessagesUpdate => ({
  key: waveId,
  isLoading: false,
});

const throwIfAborted = (signal: AbortSignal): void => {
  if (signal.aborted) {
    throw createWaveFeedAbortError();
  }
};

const logUnexpectedAsyncError = (message: string, error: unknown): void => {
  if (isAbortError(error)) {
    return;
  }

  console.error(message, error);
};

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
  isCapacitor,
  syncNewestMessages,
}: {
  readonly cleanupController: (
    waveId: string,
    controller: AbortController
  ) => void;
  readonly createController: (waveId: string) => AbortController;
  readonly getData: WaveDataStoreUpdater["getData"];
  readonly isCapacitor: boolean;
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
      const telemetryStartedAtMs = getWaveFeedTelemetryStartedAtMs();
      trackWaveFeedLoadStart({
        hadCachedDrops: true,
        isNative: isCapacitor,
        loadSource: "background_sync",
      });

      try {
        const result = await syncNewestMessages(
          waveId,
          highestSerialNo,
          controller.signal
        );
        if (result.drops === null) {
          trackWaveFeedLoadFailure({
            error: createWaveFeedUnavailableError(),
            hadCachedDrops: true,
            isNative: isCapacitor,
            loadSource: "background_sync",
            remainedUnavailable: false,
            startedAtMs: telemetryStartedAtMs,
          });
          return;
        }

        trackWaveFeedLoadSuccess({
          dropCount: result.drops.length,
          hadCachedDrops: true,
          isNative: isCapacitor,
          loadSource: "background_sync",
          startedAtMs: telemetryStartedAtMs,
        });
      } catch (error: unknown) {
        trackWaveFeedLoadTerminalFromError({
          error,
          hadCachedDrops: true,
          isNative: isCapacitor,
          loadSource: "background_sync",
          remainedUnavailable: false,
          startedAtMs: telemetryStartedAtMs,
        });
        throw error;
      } finally {
        cleanupController(abortKey, controller);
      }
    },
    [
      cleanupController,
      createController,
      getData,
      isCapacitor,
      syncNewestMessages,
    ]
  );
}

export function useWaveDataFetching({
  updateData,
  getData,
  hasServerFeedSeed,
  isCapacitor = false,
}: WaveDataFetchingProps) {
  const { getLoadingState, setLoadingState, setPromise, clearLoadingState } =
    useWaveLoadingState();
  const { cancelFetch, createController, cleanupController } =
    useWaveAbortController("feed");
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
    isCapacitor,
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
    (waveId: string, drops: ApiDrop[] | null, isPrefetch = false) => {
      clearLoadingState(waveId);
      if (drops === null) {
        updateData(clearWaveMessagesLoading(waveId));
        return null;
      }

      if (!isPrefetch) {
        markMobileLaunchStep("wave_messages_loaded");
      }
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

  const handlePreparedWaveActivation = useCallback(
    (
      waveId: string,
      drops: readonly Pick<ApiDrop, "serial_no">[] | null,
      options?: RegisterWaveOptions
    ) => {
      if (options?.isPrefetch || drops === null) {
        return;
      }

      markMobileLaunchStep("wave_messages_loaded");
      scheduleNativeInitialBackfill(waveId, drops, options);
    },
    [scheduleNativeInitialBackfill]
  );

  const activateWave = useCallback(
    async (
      waveId: string,
      syncNewest = false,
      options?: RegisterWaveOptions
    ) => {
      if (hasServerFeedSeed(waveId)) {
        return;
      }

      const existingDrops = getData(waveId)?.drops ?? [];
      const existingDropsCount = existingDrops.length;
      if (existingDropsCount > 0) {
        handlePreparedWaveActivation(waveId, existingDrops, options);
        if (
          !options?.isPrefetch &&
          !trackedCacheSuccessWaveIdsRef.current.has(waveId)
        ) {
          trackedCacheSuccessWaveIdsRef.current.add(waveId);
          trackWaveFeedLoadStart({
            hadCachedDrops: true,
            isNative: isCapacitor,
            loadSource: "cache",
          });
          trackWaveFeedLoadSuccess({
            dropCount: existingDropsCount,
            hadCachedDrops: true,
            isNative: isCapacitor,
            loadSource: "cache",
            startedAtMs: getWaveFeedTelemetryStartedAtMs(),
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
        const drops = await loadingState.promise;
        handlePreparedWaveActivation(waveId, drops, options);
        return drops;
      }

      setLoadingState(waveId, true);
      updateData(createEmptyWaveMessages(waveId, { isLoading: true }));

      const controller = createController(waveId);
      const telemetryStartedAtMs = getWaveFeedTelemetryStartedAtMs();
      if (!options?.isPrefetch) {
        trackWaveFeedLoadStart({
          hadCachedDrops: false,
          isNative: isCapacitor,
          loadSource: "initial_visible",
        });
      }
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
          throwIfAborted(controller.signal);
          const fetchedDrops = handleFetchSuccess(
            waveId,
            drops,
            options?.isPrefetch
          );
          if (fetchedDrops === null) {
            const failureError =
              fetchFailureError ?? createWaveFeedUnavailableError();
            if (!options?.isPrefetch) {
              trackWaveFeedLoadTerminalFromError({
                error: failureError,
                hadCachedDrops: false,
                isNative: isCapacitor,
                loadSource: "initial_visible",
                remainedUnavailable: true,
                startedAtMs: telemetryStartedAtMs,
              });
            }
            return null;
          }

          if (!options?.isPrefetch) {
            trackWaveFeedLoadSuccess({
              dropCount: fetchedDrops.length,
              hadCachedDrops: false,
              isNative: isCapacitor,
              loadSource: "initial_visible",
              startedAtMs: telemetryStartedAtMs,
            });
          }
          scheduleNativeInitialBackfill(waveId, fetchedDrops, options);
          return fetchedDrops;
        } catch (error: unknown) {
          if (!options?.isPrefetch) {
            trackWaveFeedLoadTerminalFromError({
              error,
              hadCachedDrops: false,
              isNative: isCapacitor,
              loadSource: "initial_visible",
              remainedUnavailable: true,
              startedAtMs: telemetryStartedAtMs,
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
      hasServerFeedSeed,
      getLoadingState,
      handleFetchError,
      handleFetchSuccess,
      handlePreparedWaveActivation,
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

  const prefetchWave = useCallback(
    async (waveId: string): Promise<void> => {
      await activateWave(waveId, false, {
        isPrefetch: true,
        skipInitialBackfill: true,
      });
    },
    [activateWave]
  );

  const cancelWaveDataFetch = useCallback(
    (waveId: string) => {
      clearInitialBackfillTimeout(waveId);
      clearLoadingState(waveId);
      trackedCacheSuccessWaveIdsRef.current.delete(waveId);
      cancelFetch(waveId, "wave_deactivated");
      cancelFetch(`${waveId}-initial-backfill`, "wave_deactivated");
      cancelFetch(getNewestSyncAbortKey(waveId), "wave_deactivated");
    },
    [cancelFetch, clearInitialBackfillTimeout, clearLoadingState]
  );

  return {
    registerWave,
    prefetchWave,
    cancelWaveDataFetch,
    syncNewestMessages,
  };
}
