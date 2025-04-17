import { useCallback, useEffect, useRef } from "react";
import { useWebSocketMessage } from "../../../services/websocket/useWebSocketMessage";
import { WsDropUpdateMessage, WsMessageType } from "../../../helpers/Types";
import { WaveDataStoreUpdater } from "./types";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";

interface UseWaveRealtimeUpdaterProps extends WaveDataStoreUpdater {
  readonly registerWave: (waveId: string) => void;
  readonly syncNewestMessages: (
    waveId: string,
    sinceSerialNo: number,
    signal: AbortSignal
  ) => Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }>;
}

export type ProcessIncomingDropFn = (dropData: ApiDrop) => void;

export function useWaveRealtimeUpdater({
  getData,
  updateData,
  registerWave,
  syncNewestMessages,
  removeDrop,
}: UseWaveRealtimeUpdaterProps): {
  processIncomingDrop: ProcessIncomingDropFn;
  processDropRemoved: (waveId: string, dropId: string) => void;
} {
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

            updateData({
              key: waveId,
              drops: newDrops,
              // Update latestFetchedSerialNo only if the fetch returned drops
              latestFetchedSerialNo:
                fetchedHighestSerial !== null
                  ? fetchedHighestSerial
                  : undefined,
              // Optionally reset hasNextPage if needed, though fetchNewest shouldn't affect it
            });
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
            await initiateFetchNewestCycle(
              waveId,
              latestData.latestFetchedSerialNo
            );
          }
        }
      }
    },
    [getData, updateData, syncNewestMessages, cleanupController]
  );

  // WebSocket message handler
  const processIncomingDrop: ProcessIncomingDropFn = useCallback(
    async (drop: ApiDrop) => {
      if (!drop?.wave?.id) {
        return;
      }

      const waveId = drop.wave.id;

      const currentData = getData(waveId);

      if (!currentData) {
        // Wave not registered or data not loaded yet.
        // Registering will trigger initial fetch which should get this message.
        registerWave(waveId);
        return;
      }

      const optimisticDrop: ExtendedDrop = {
        ...drop,
        author: {
          ...drop.author,
          subscribed_actions: drop.author.subscribed_actions ?? [],
        },
        wave: {
          ...drop.wave,
          authenticated_user_eligible_to_participate:
            drop.wave.authenticated_user_eligible_to_participate ?? false,
          authenticated_user_eligible_to_vote:
            drop.wave.authenticated_user_eligible_to_vote ?? false,
          authenticated_user_eligible_to_chat:
            drop.wave.authenticated_user_eligible_to_chat ?? false,
          authenticated_user_admin: drop.wave.authenticated_user_admin ?? false,
        }, // Assuming message structure matches ApiDrop + ApiWaveMin
        stableKey: drop.id,
        stableHash: drop.id, // Use ID for hash temporarily
        context_profile_context: drop.context_profile_context ?? null,
      };

      // Important: Identify the serial number *before* adding the optimistic drop
      const serialNoForFetch = currentData.latestFetchedSerialNo;

      updateData({
        key: waveId,
        drops: [optimisticDrop],
      });

      if (serialNoForFetch && !optimisticDrop.id.startsWith("temp-")) {
        // Initiate the background fetch for reconciliation
        initiateFetchNewestCycle(waveId, serialNoForFetch);
      }
    },
    [getData, updateData, registerWave, initiateFetchNewestCycle]
  );

  const processDropRemoved = useCallback(
    (waveId: string, dropId: string) => {
      removeDrop(waveId, dropId);
    },
    [removeDrop]
  );

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    processIncomingDrop
  );

  // Cleanup: Cancel all ongoing fetches on unmount
  useEffect(() => {
    return () => {
      Object.values(abortControllersRef.current).forEach((controller) =>
        controller.abort()
      );
      abortControllersRef.current = {}; // Clear refs
      isFetchingNewestRef.current = {};
      needsRefetchAfterCurrentRef.current = {};
    };
  }, []);

  // No return value needed as this hook works in the background
  return { processIncomingDrop, processDropRemoved };
}
