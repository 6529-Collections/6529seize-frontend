import { useCallback, useEffect, useRef } from "react";
import { useWebSocketMessage } from "../../../services/websocket/useWebSocketMessage";
import { WsDropUpdateMessage, WsMessageType } from "../../../helpers/Types";
import { WaveDataStoreUpdater } from "./types";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { DropSize, ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { commonApiFetch } from "../../../services/api/common-api";

interface UseWaveRealtimeUpdaterProps extends WaveDataStoreUpdater {
  readonly registerWave: (waveId: string) => void;
  readonly syncNewestMessages: (
    waveId: string,
    sinceSerialNo: number,
    signal: AbortSignal
  ) => Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }>;
}

export enum ProcessIncomingDropType {
  DROP_RATING_UPDATE = "DROP_RATING_UPDATE",
  DROP_INSERT = "DROP_INSERT",
  DROP_REACTION_UPDATE = "DROP_REACTION_UPDATE",
}

type ProcessIncomingDropFn = (
  dropData: ApiDrop,
  type: ProcessIncomingDropType
) => void;

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
              type: DropSize.FULL,
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
        // Do not update latestFetchedSerialNo on error
        if (error instanceof DOMException && error.name === "AbortError") {
          // Fetch was cancelled - this is expected behavior
        } else {
          console.error("Error fetching newest messages:", error);
        }
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
    async (drop: ApiDrop, type: ProcessIncomingDropType) => {
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

      const existingDrop = currentData.drops.find((d) => d.id === drop.id);

      if (
        (type === ProcessIncomingDropType.DROP_RATING_UPDATE &&
          !existingDrop) ||
        (type === ProcessIncomingDropType.DROP_REACTION_UPDATE &&
          !existingDrop) ||
        existingDrop?.type === DropSize.LIGHT
      ) {
        return;
      }

      if (
        (type === ProcessIncomingDropType.DROP_RATING_UPDATE ||
          type === ProcessIncomingDropType.DROP_REACTION_UPDATE) &&
        existingDrop
      ) {
        const apiDrop = await commonApiFetch<ApiDrop>({
          endpoint: `drops/${drop.id}`,
        });
        if (apiDrop) {
          updateData({
            key: waveId,
            drops: [
              {
                ...apiDrop,
                type: DropSize.FULL,
                stableHash: existingDrop.stableHash,
                stableKey: existingDrop.stableKey,
              },
            ],
          });
        }
        return;
      }

      const optimisticDrop: ExtendedDrop = {
        ...drop,
        type: DropSize.FULL,
        author: {
          ...drop.author,
          subscribed_actions: existingDrop
            ? existingDrop.author.subscribed_actions
            : drop.author.subscribed_actions ?? [],
        },
        wave: {
          ...drop.wave,
          authenticated_user_eligible_to_participate: existingDrop
            ? existingDrop.wave.authenticated_user_eligible_to_participate
            : drop.wave.authenticated_user_eligible_to_participate ?? false,
          authenticated_user_eligible_to_vote: existingDrop
            ? existingDrop.wave.authenticated_user_eligible_to_vote
            : drop.wave.authenticated_user_eligible_to_vote ?? false,
          authenticated_user_eligible_to_chat: existingDrop
            ? existingDrop.wave.authenticated_user_eligible_to_chat
            : drop.wave.authenticated_user_eligible_to_chat ?? false,
          authenticated_user_admin: existingDrop
            ? existingDrop.wave.authenticated_user_admin
            : drop.wave.authenticated_user_admin ?? false,
        }, // Assuming message structure matches ApiDrop + ApiWaveMin
        stableKey: drop.id,
        stableHash: drop.id, // Use ID for hash temporarily
        context_profile_context: existingDrop
          ? existingDrop.context_profile_context
          : drop.context_profile_context ?? null,
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
    (messageData) => {
      processIncomingDrop(messageData, ProcessIncomingDropType.DROP_INSERT);
    }
  );

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_RATING_UPDATE,
    (messageData) => {
      processIncomingDrop(
        messageData,
        ProcessIncomingDropType.DROP_RATING_UPDATE
      );
    }
  );

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_REACTION_UPDATE,
    (messageData) => {
      processIncomingDrop(
        messageData,
        ProcessIncomingDropType.DROP_REACTION_UPDATE
      );
    }
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
