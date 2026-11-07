"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useCallback, useEffect, useRef } from "react";
import {
  reportBackgroundTaskError,
  type UseWaveRealtimeUpdaterProps,
} from "./useWaveRealtimeUpdater.helpers";

type InitiateFetchNewestCycleFn = (
  waveId: string,
  sinceSerialNo: number
) => Promise<void>;

/**
 * Fetches the drops newer than a serial, one fetch per wave at a time; a
 * request during a fetch runs once more from the newest fetched serial.
 */
export const useNewestMessagesSync = ({
  getData,
  updateData,
  syncNewestMessages,
}: Pick<
  UseWaveRealtimeUpdaterProps,
  "getData" | "updateData" | "syncNewestMessages"
>): InitiateFetchNewestCycleFn => {
  const isFetchingNewestRef = useRef<Record<string, boolean>>({});
  const needsRefetchAfterCurrentRef = useRef<Record<string, boolean>>({});
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  const cleanupController = useCallback((waveId: string) => {
    if (abortControllersRef.current[waveId]) {
      delete abortControllersRef.current[waveId];
    }
  }, []);

  const initiateFetchNewestCycle = useCallback(
    async (waveId: string, sinceSerialNo: number) => {
      if (isFetchingNewestRef.current[waveId]) {
        needsRefetchAfterCurrentRef.current[waveId] = true;
        return;
      }

      isFetchingNewestRef.current[waveId] = true;
      const controller = new AbortController();
      abortControllersRef.current[waveId] = controller;

      try {
        const { drops: fetchedDrops, highestSerialNo: fetchedHighestSerial } =
          await syncNewestMessages(waveId, sinceSerialNo, controller.signal);

        if (fetchedDrops) {
          const currentData = getData(waveId);
          if (currentData) {
            const newDrops: ExtendedDrop[] = fetchedDrops.map((drop) => ({
              ...drop,
              type: DropSize.FULL,
              stableKey: drop.id,
              stableHash: drop.id,
            }));

            updateData({
              key: waveId,
              drops: newDrops,
              latestFetchedSerialNo: fetchedHighestSerial ?? null,
            });
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          return;
        }
        console.error("Error fetching newest messages:", error);
      } finally {
        cleanupController(waveId);
        delete isFetchingNewestRef.current[waveId];

        if (needsRefetchAfterCurrentRef.current[waveId]) {
          delete needsRefetchAfterCurrentRef.current[waveId];
          const latestFetchedSerialNo =
            getData(waveId)?.latestFetchedSerialNo ?? null;
          if (latestFetchedSerialNo !== null) {
            await initiateFetchNewestCycle(waveId, latestFetchedSerialNo);
          }
        }
      }
    },
    [getData, updateData, syncNewestMessages, cleanupController]
  );

  useEffect(() => {
    return () => {
      Object.values(abortControllersRef.current).forEach((controller) =>
        controller.abort()
      );
      abortControllersRef.current = {};
      isFetchingNewestRef.current = {};
      needsRefetchAfterCurrentRef.current = {};
    };
  }, []);

  return initiateFetchNewestCycle;
};

export const useNewestMessagesAfterDropUpdate = (
  initiateFetchNewestCycle: InitiateFetchNewestCycleFn
): ((
  waveId: string,
  serialNoForFetch: number | null,
  optimisticDropId: string
) => Promise<void>) =>
  useCallback(
    async (
      waveId: string,
      serialNoForFetch: number | null,
      optimisticDropId: string
    ) => {
      if (serialNoForFetch === null || optimisticDropId.startsWith("temp-")) {
        return;
      }

      try {
        await initiateFetchNewestCycle(waveId, serialNoForFetch);
      } catch (error) {
        reportBackgroundTaskError(
          "Failed to sync newest wave messages:",
          error
        );
      }
    },
    [initiateFetchNewestCycle]
  );
