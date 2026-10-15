"use client";

import { useCallback, useEffect, useRef } from "react";
import { WAVE_DROPS_PARAMS } from "@/components/react-query-wrapper/utils/query-utils";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { WaveEligibility } from "../WaveEligibilityContext";
import {
  fetchWaveMessages,
  formatWaveMessages,
} from "../utils/wave-messages-utils";
import type { WaveAbortTrigger } from "./useWaveAbortController";
import type {
  WaveDataStoreUpdater,
  WaveMessages,
  WaveMessagesUpdate,
} from "./types";
import {
  createWaveFeedAbortError,
  createWaveFeedUnavailableError,
  getWaveFeedTelemetryStartedAtMs,
  isWaveFeedAbortError,
  trackWaveFeedLoadStart,
  trackWaveFeedLoadSuccess,
  trackWaveFeedLoadTerminalFromError,
} from "./waveFeedTelemetry";

const NATIVE_INITIAL_BACKFILL_DELAY_MS = 250;
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
  isNative,
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
  readonly isNative: boolean;
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
  const telemetryStartedAtMs = getWaveFeedTelemetryStartedAtMs();
  trackWaveFeedLoadStart({
    hadCachedDrops: true,
    isNative,
    loadSource: "native_initial_backfill",
  });
  let fetchFailureError: unknown;

  try {
    const backfillDrops = await fetchWaveMessages(
      waveId,
      request.serialNo,
      controller.signal,
      updateEligibility,
      {
        limit: request.limit,
        onFailure: (error: unknown) => {
          fetchFailureError = error;
        },
      }
    );
    if (controller.signal.aborted) {
      throw createWaveFeedAbortError();
    }

    if (backfillDrops === null) {
      const failureError =
        fetchFailureError ?? createWaveFeedUnavailableError();
      trackWaveFeedLoadTerminalFromError({
        error: failureError,
        hadCachedDrops: true,
        isNative,
        loadSource: "native_initial_backfill",
        remainedUnavailable: false,
        startedAtMs: telemetryStartedAtMs,
      });
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

    trackWaveFeedLoadSuccess({
      dropCount: backfillDrops.length,
      hadCachedDrops: true,
      isNative,
      loadSource: "native_initial_backfill",
      startedAtMs: telemetryStartedAtMs,
    });
  } catch (error: unknown) {
    trackWaveFeedLoadTerminalFromError({
      error,
      hadCachedDrops: true,
      isNative,
      loadSource: "native_initial_backfill",
      remainedUnavailable: false,
      startedAtMs: telemetryStartedAtMs,
    });
    if (isWaveFeedAbortError(error)) {
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

export function useNativeInitialBackfill({
  cancelFetch,
  cleanupController,
  createController,
  getData,
  initialWaveDropsLimit,
  isCapacitor,
  updateData,
  updateEligibility,
}: {
  readonly cancelFetch: (waveId: string, trigger: WaveAbortTrigger) => void;
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
      initialDrops: readonly DropWithSerialNo[] | null,
      options?: { readonly skipInitialBackfill?: boolean | undefined }
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
      cancelFetch(`${waveId}-initial-backfill`, "request_replaced");

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
            isNative: isCapacitor,
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
