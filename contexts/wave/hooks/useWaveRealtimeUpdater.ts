"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { WsDropUpdateMessage } from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { fetchDropByIdBatched } from "@/services/api/drop-api";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { useCallback, useContext, useEffect, useRef } from "react";
import { useWaveEligibility } from "../WaveEligibilityContext";
import type { WaveDataStoreUpdater } from "./types";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import {
  getProtectedReactionIntent,
  recordReactionRealtimeReconciliation,
  type ProtectedReactionIntent,
} from "@/utils/monitoring/dropReactionMonitoring";

interface UseWaveRealtimeUpdaterProps extends WaveDataStoreUpdater {
  readonly activeWaveId: string | null;
  readonly registerWave: (waveId: string) => void;
  readonly syncNewestMessages: (
    waveId: string,
    sinceSerialNo: number,
    signal: AbortSignal
  ) => Promise<{ drops: ApiDrop[] | null; highestSerialNo: number | null }>;
  readonly removeWaveDeliveredNotifications: (waveId: string) => Promise<void>;
  readonly isWaveMuted: (waveId: string) => boolean;
}

export enum ProcessIncomingDropType {
  DROP_RATING_UPDATE = "DROP_RATING_UPDATE",
  DROP_INSERT = "DROP_INSERT",
  DROP_REACTION_UPDATE = "DROP_REACTION_UPDATE",
}

type IncomingDropWave = Omit<
  ApiDrop["wave"],
  "authenticated_user_eligible_to_chat"
> & {
  readonly authenticated_user_eligible_to_chat?: ApiDrop["wave"]["authenticated_user_eligible_to_chat"];
};

type IncomingDrop = Omit<ApiDrop, "wave"> & {
  readonly wave?: IncomingDropWave;
};

type ProcessIncomingDropFn = (
  dropData: IncomingDrop,
  type: ProcessIncomingDropType
) => void;

function preserveProtectedReactionFields(
  serverDrop: ApiDrop,
  localDrop: ExtendedDrop,
  protectedIntent: ProtectedReactionIntent
): ApiDrop {
  const serverContext = serverDrop.context_profile_context;
  const localContext = localDrop.context_profile_context;
  const contextSource =
    serverContext ??
    localContext ??
    (protectedIntent.reaction !== null
      ? {
          rating: 0,
          min_rating: 0,
          max_rating: 0,
          reaction: null,
          boosted: false,
          bookmarked: false,
          curatable: false,
          curated: false,
        }
      : null);

  return {
    ...serverDrop,
    context_profile_context: contextSource
      ? {
          ...contextSource,
          reaction: protectedIntent.reaction,
        }
      : null,
    reactions: mergeProtectedReactionProfiles(
      serverDrop.reactions,
      localDrop.reactions,
      protectedIntent
    ),
  };
}

function mergeProtectedReactionProfiles(
  serverReactions: ApiDropReaction[],
  localReactions: ApiDropReaction[],
  protectedIntent: ProtectedReactionIntent
): ApiDropReaction[] {
  const profileId = protectedIntent.profileId;
  if (!profileId) {
    return serverReactions;
  }

  const mergedReactions = serverReactions.reduce<ApiDropReaction[]>(
    (entries, entry) => {
      const profiles = entry.profiles.filter(
        (profile) => profile.id !== profileId
      );

      if (profiles.length > 0) {
        entries.push({
          ...entry,
          profiles,
        });
      }

      return entries;
    },
    []
  );

  if (protectedIntent.reaction === null) {
    return mergedReactions;
  }

  const localProfile = findReactionProfile(localReactions, profileId);
  if (!localProfile) {
    return mergedReactions;
  }

  const targetIndex = mergedReactions.findIndex(
    (entry) => entry.reaction === protectedIntent.reaction
  );

  if (targetIndex >= 0) {
    const target = mergedReactions[targetIndex]!;
    mergedReactions[targetIndex] = {
      ...target,
      profiles: [...target.profiles, localProfile],
    };
    return mergedReactions;
  }

  return [
    ...mergedReactions,
    {
      reaction: protectedIntent.reaction,
      profiles: [localProfile],
    },
  ];
}

function findReactionProfile(
  reactions: ApiDropReaction[],
  profileId: string
): ApiProfileMin | null {
  for (const reaction of reactions) {
    const profile = reaction.profiles.find((item) => item.id === profileId);
    if (profile) {
      return profile;
    }
  }

  return null;
}

export function useWaveRealtimeUpdater({
  activeWaveId,
  getData,
  updateData,
  registerWave,
  syncNewestMessages,
  removeDrop,
  removeWaveDeliveredNotifications,
  isWaveMuted,
}: UseWaveRealtimeUpdaterProps): {
  processIncomingDrop: ProcessIncomingDropFn;
  processDropRemoved: (waveId: string, dropId: string) => void;
} {
  const isFetchingNewestRef = useRef<Record<string, boolean>>({});
  const needsRefetchAfterCurrentRef = useRef<Record<string, boolean>>({});
  const abortControllersRef = useRef<Record<string, AbortController>>({});
  const { refreshEligibility } = useWaveEligibility();
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);
  const tabJustBecameVisibleRef = useRef<boolean>(false);

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
              latestFetchedSerialNo: fetchedHighestSerial ?? null,
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
      const markWaveAsRead = async (waveId: string) => {
        await commonApiPostWithoutBodyAndResponse({
          endpoint: `notifications/wave/${waveId}/read`,
        });
        invalidateNotifications();
      };

      const wave = drop.wave;

      if (!wave?.id) {
        return;
      }

      const waveId = wave.id;

      if (isWaveMuted(waveId)) {
        return;
      }

      // Check if tab just became visible and refresh eligibility
      if (tabJustBecameVisibleRef.current) {
        tabJustBecameVisibleRef.current = false;
        refreshEligibility(waveId);
      }

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
        const apiDrop = await fetchDropByIdBatched(drop.id);

        const latestExistingDrop = getData(waveId)?.drops.find(
          (cachedDrop) => cachedDrop.id === drop.id
        );

        if (latestExistingDrop?.type !== DropSize.FULL) {
          return;
        }

        let nextDrop = apiDrop;

        if (type === ProcessIncomingDropType.DROP_REACTION_UPDATE) {
          const protectedIntent = getProtectedReactionIntent(apiDrop.id);
          const serverReaction =
            apiDrop.context_profile_context?.reaction ?? null;

          recordReactionRealtimeReconciliation({
            drop: {
              id: apiDrop.id,
              wave: { id: apiDrop.wave.id },
              context_profile_context: apiDrop.context_profile_context,
            },
            websocketStatus: WebSocketStatus.CONNECTED,
            protectedIntent,
          });

          if (protectedIntent && serverReaction !== protectedIntent.reaction) {
            nextDrop = preserveProtectedReactionFields(
              apiDrop,
              latestExistingDrop,
              protectedIntent
            );
          }
        }
        updateData({
          key: waveId,
          drops: [
            {
              ...nextDrop,
              type: DropSize.FULL,
              stableHash: latestExistingDrop.stableHash,
              stableKey: latestExistingDrop.stableKey,
            },
          ],
        });
        return;
      }

      const optimisticDrop: ExtendedDrop = {
        ...drop,
        type: DropSize.FULL,
        author: {
          ...drop.author,
          subscribed_actions: existingDrop
            ? existingDrop.author.subscribed_actions
            : drop.author.subscribed_actions,
        },
        wave: {
          ...wave,
          authenticated_user_eligible_to_participate: existingDrop
            ? existingDrop.wave.authenticated_user_eligible_to_participate
            : wave.authenticated_user_eligible_to_participate,
          authenticated_user_eligible_to_vote: existingDrop
            ? existingDrop.wave.authenticated_user_eligible_to_vote
            : wave.authenticated_user_eligible_to_vote,
          authenticated_user_eligible_to_chat: existingDrop
            ? existingDrop.wave.authenticated_user_eligible_to_chat
            : (wave.authenticated_user_eligible_to_chat ?? false),
          authenticated_user_admin: existingDrop
            ? existingDrop.wave.authenticated_user_admin
            : wave.authenticated_user_admin,
        }, // Assuming message structure matches ApiDrop + ApiWaveMin
        stableKey: drop.id,
        stableHash: drop.id, // Use ID for hash temporarily
        context_profile_context: existingDrop
          ? existingDrop.context_profile_context
          : (drop.context_profile_context ?? null),
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

      if (activeWaveId === waveId) {
        removeWaveDeliveredNotifications(waveId).catch((error) =>
          console.error("Failed to remove wave delivered notifications:", error)
        );
        markWaveAsRead(waveId).catch((error) =>
          console.error("Failed to mark wave as read:", error)
        );
      }
    },
    [
      activeWaveId,
      getData,
      updateData,
      registerWave,
      initiateFetchNewestCycle,
      removeWaveDeliveredNotifications,
      refreshEligibility,
      isWaveMuted,
      invalidateNotifications,
    ]
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

  // Handle tab visibility changes - refresh eligibility when tab becomes visible
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        // Mark that tab just became visible, eligibility will be refreshed
        // on the next WebSocket message for any wave
        tabJustBecameVisibleRef.current = true;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

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
