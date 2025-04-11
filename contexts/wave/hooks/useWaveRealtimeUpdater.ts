import { useCallback, useEffect, useRef } from "react";
import { useWebSocketMessage } from "../../../services/websocket/useWebSocketMessage";
import { WsDropUpdateMessage, WsMessageType } from "../../../helpers/Types";
import { WaveDataStoreUpdater } from "./types";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { mergeDrops, getHighestSerialNo } from "../utils/wave-messages-utils";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

interface UseWaveRealtimeUpdaterProps extends WaveDataStoreUpdater {
  readonly registerWave: (waveId: string) => void;
  readonly syncNewestMessages: (
    waveId: string,
    sinceSerialNo: number,
    signal: AbortSignal
  ) => Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }>;
}

export function useWaveRealtimeUpdater({
  getData,
  updateData,
  registerWave,
  syncNewestMessages,
}: UseWaveRealtimeUpdaterProps) {
  const isFetchingNewestRef = useRef<Record<string, boolean>>({});
  const needsRefetchAfterCurrentRef = useRef<Record<string, boolean>>({});
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  // Function to cleanup abort controllers
  const cleanupController = useCallback((waveId: string) => {
    if (abortControllersRef.current[waveId]) {
      delete abortControllersRef.current[waveId];
    }
  }, []);

  // Function to initiate the fetch newest cycle
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
              stableKey: drop.id, // Assuming ApiDrop has id
              stableHash: drop.id, // Assuming ApiDrop has id
            }));

            const mergedDrops = mergeDrops(currentData.drops, newDrops);
            const finalHighestSerial = getHighestSerialNo(mergedDrops);

            updateData(waveId, {
              ...currentData,
              drops: mergedDrops,
              // Update latestFetchedSerialNo only if the fetch returned drops
              latestFetchedSerialNo:
                fetchedHighestSerial !== null
                  ? fetchedHighestSerial
                  : currentData.latestFetchedSerialNo,
              // Optionally reset hasNextPage if needed, though fetchNewest shouldn't affect it
            });
            console.log(
              `[RealtimeUpdater] Updated ${waveId} with merged drops. New highest serial: ${finalHighestSerial}.`
            );
          } else {
            console.log(
              `[RealtimeUpdater] No current data found for ${waveId} after fetch, skipping update.`
            );
          }
        }
      } catch (error) {
        if (error instanceof DOMException && error.name === "AbortError") {
          console.log(
            `[RealtimeUpdater] Fetch newest for wave ${waveId} was cancelled.`
          );
        } else {
          console.error(
            `[RealtimeUpdater] Error fetching newest messages for ${waveId}:`,
            error
          );
        }
        // Do not update latestFetchedSerialNo on error
      } finally {
        cleanupController(waveId);
        isFetchingNewestRef.current[waveId] = false;

        if (needsRefetchAfterCurrentRef.current[waveId]) {
          needsRefetchAfterCurrentRef.current[waveId] = false;
          const latestData = getData(waveId);
          if (latestData?.latestFetchedSerialNo) {
            initiateFetchNewestCycle(waveId, latestData.latestFetchedSerialNo);
          } else {
            console.log(
              `[RealtimeUpdater] No latest data found for ${waveId} after fetch, skipping update.`
            );
          }
        }
      }
    },
    [getData, updateData, syncNewestMessages, cleanupController]
  );

  // WebSocket message handler
  const handleWebSocketMessage = useCallback(
    (message: WsDropUpdateMessage["data"]) => {
      if (!message?.wave?.id) {
        console.warn(
          "[RealtimeUpdater] Received WS message without wave ID:",
          message
        );
        return;
      }
      const waveId = message.wave.id;

      console.log(
        `[RealtimeUpdater] Received WS message for wave ${waveId}:`,
        message
      );

      const currentData = getData(waveId);

      if (!currentData) {
        // Wave not registered or data not loaded yet.
        // Registering will trigger initial fetch which should get this message.
        console.log(
          `[RealtimeUpdater] Wave ${waveId} not found locally. Registering.`
        );
        registerWave(waveId);
        return;
      }

      // Wave is registered, perform optimistic update
      console.log(
        `[RealtimeUpdater] Optimistically adding drop ${message.id} to ${waveId}.`
      );
      const optimisticDrop: ExtendedDrop = {
        ...message,
        wave: message.wave, // Assuming message structure matches ApiDrop + ApiWaveMin
        stableKey: message.id,
        stableHash: message.id, // Use ID for hash temporarily
      };

      // Important: Identify the serial number *before* adding the optimistic drop
      const serialNoForFetch = currentData.latestFetchedSerialNo;

      const mergedDrops = mergeDrops(currentData.drops, [optimisticDrop]);

      updateData(waveId, {
        ...currentData,
        drops: mergedDrops,
        // DO NOT update latestFetchedSerialNo here, it's an optimistic update
      });

      if (serialNoForFetch) {
        // Initiate the background fetch for reconciliation
        initiateFetchNewestCycle(waveId, serialNoForFetch);
      } else {
        console.log(
          `[RealtimeUpdater] No serial number found for ${waveId} after fetch, skipping update.`
        );
      }
    },
    [getData, updateData, registerWave, initiateFetchNewestCycle]
  );

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    handleWebSocketMessage
  );

  // Cleanup: Cancel all ongoing fetches on unmount
  useEffect(() => {
    return () => {
      console.log(
        "[RealtimeUpdater] Cleaning up: Aborting all ongoing fetches."
      );
      Object.values(abortControllersRef.current).forEach((controller) =>
        controller.abort()
      );
      abortControllersRef.current = {}; // Clear refs
      isFetchingNewestRef.current = {};
      needsRefetchAfterCurrentRef.current = {};
    };
  }, []);

  // No return value needed as this hook works in the background
}
