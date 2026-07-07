"use client";

import {
  getWaveDropsInitialLimit,
  WAVE_DROPS_PARAMS,
} from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
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
import type { WaveDataStoreUpdater, WaveMessages } from "./types";

const FETCH_NEWEST_LIMIT = 50;
const NATIVE_INITIAL_BACKFILL_DELAY_MS = 250;

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

const getOldestSerialNo = (
  drops: readonly DropWithSerialNo[]
): number | null => {
  if (drops.length === 0) {
    return null;
  }

  return Math.min(...drops.map((drop) => drop.serial_no));
};

const isAbortError = (error: unknown): boolean =>
  error instanceof DOMException && error.name === "AbortError";

const createAbortError = (): DOMException =>
  new DOMException("Aborted", "AbortError");

const throwIfAborted = (signal: AbortSignal): void => {
  if (signal.aborted) {
    throw createAbortError();
  }
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
      formatWaveMessages(waveId, backfillDrops, {
        hasNextPage: backfillDrops.length >= request.limit,
        isLoading: false,
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
  cleanupController,
  createController,
  getData,
  initialWaveDropsLimit,
  isCapacitor,
  updateData,
  updateEligibility,
}: {
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

      initialBackfillTimeoutsRef.current[waveId] = setTimeout(() => {
        delete initialBackfillTimeoutsRef.current[waveId];
        void runNativeInitialBackfill({
          cleanupController,
          createController,
          getData,
          initialOldestSerialNo,
          updateData,
          updateEligibility,
          waveId,
        });
      }, NATIVE_INITIAL_BACKFILL_DELAY_MS);
    },
    [
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
  getData,
  syncNewestMessages,
}: {
  readonly getData: WaveDataStoreUpdater["getData"];
  readonly syncNewestMessages: ReturnType<typeof useSyncNewestMessages>;
}) {
  return useCallback(
    (waveId: string) => {
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

      void syncNewestMessages(
        waveId,
        highestSerialNo,
        new AbortController().signal
      );
    },
    [getData, syncNewestMessages]
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
  const syncNewestMessages = useSyncNewestMessages({
    updateData,
    updateEligibility,
  });
  const syncExistingWaveNewestMessages = useSyncExistingWaveNewestMessages({
    getData,
    syncNewestMessages,
  });
  const { clearInitialBackfillTimeout, scheduleNativeInitialBackfill } =
    useNativeInitialBackfill({
      cleanupController,
      createController,
      getData,
      initialWaveDropsLimit,
      isCapacitor,
      updateData,
      updateEligibility,
    });

  const hasWaveData = useCallback(
    (waveId: string): boolean => (getData(waveId)?.drops.length ?? 0) > 0,
    [getData]
  );

  const handleFetchSuccess = useCallback(
    (waveId: string, drops: ApiDrop[] | null) => {
      clearLoadingState(waveId);
      if (drops !== null) {
        updateData(formatWaveMessages(waveId, drops, { isLoading: false }));
      }

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
      if (hasWaveData(waveId)) {
        if (syncNewest) {
          syncExistingWaveNewestMessages(waveId);
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
      const initialFetchOptions =
        initialWaveDropsLimit === WAVE_DROPS_PARAMS.limit
          ? undefined
          : { limit: initialWaveDropsLimit };
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
          scheduleNativeInitialBackfill(waveId, fetchedDrops, options);
          return fetchedDrops;
        } catch (error: unknown) {
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
      getLoadingState,
      handleFetchError,
      handleFetchSuccess,
      hasWaveData,
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
      void activateWave(waveId, syncNewest, options);
    },
    [activateWave]
  );

  const cancelWaveDataFetch = useCallback(
    (waveId: string) => {
      clearInitialBackfillTimeout(waveId);
      cancelFetch(waveId);
      cancelFetch(`${waveId}-initial-backfill`);
    },
    [cancelFetch, clearInitialBackfillTimeout]
  );

  return {
    registerWave,
    cancelWaveDataFetch,
    syncNewestMessages,
  };
}
