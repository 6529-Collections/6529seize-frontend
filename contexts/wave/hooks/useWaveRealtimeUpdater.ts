"use client";

import {
  updateAttachmentInCachedDrops,
  updateDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type {
  WsAttachmentStatusUpdateMessage,
  WsDropUpdateMessage,
} from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiPostWithoutBodyAndResponse } from "@/services/api/common-api";
import { fetchDropByIdBatched } from "@/services/api/drop-api";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import {
  getProtectedReactionIntent,
  recordReactionRealtimeReconciliation,
  type ProtectedReactionIntent,
} from "@/utils/monitoring/dropReactionMonitoring";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useRef } from "react";
import { useWaveEligibility } from "../WaveEligibilityContext";
import type { WaveDataStoreUpdater } from "./types";

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

function getDocument(): Document | null {
  return typeof globalThis.document === "undefined"
    ? null
    : globalThis.document;
}

function isDocumentVisible(): boolean {
  return getDocument()?.visibilityState === "visible";
}

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

function getIncomingWave(drop: IncomingDrop): IncomingDropWave | null {
  const wave = drop.wave;
  if (wave === undefined || wave.id.length === 0) {
    return null;
  }

  return wave;
}

function isFetchedDropUpdate(type: ProcessIncomingDropType): boolean {
  return (
    type === ProcessIncomingDropType.DROP_RATING_UPDATE ||
    type === ProcessIncomingDropType.DROP_REACTION_UPDATE
  );
}

function shouldSkipIncomingDrop(
  type: ProcessIncomingDropType,
  existingDrop: Drop | undefined
): boolean {
  if (existingDrop?.type === DropSize.LIGHT) {
    return true;
  }

  return isFetchedDropUpdate(type) && existingDrop === undefined;
}

function getFullDrop(drop: Drop | undefined): ExtendedDrop | null {
  if (drop === undefined) {
    return null;
  }

  if (drop.type !== DropSize.FULL) {
    return null;
  }

  return drop;
}

function reconcileReactionUpdate(
  apiDrop: ApiDrop,
  latestExistingDrop: ExtendedDrop,
  type: ProcessIncomingDropType
): ApiDrop {
  if (type !== ProcessIncomingDropType.DROP_REACTION_UPDATE) {
    return apiDrop;
  }

  const protectedIntent = getProtectedReactionIntent(apiDrop.id);
  const serverReaction = apiDrop.context_profile_context?.reaction ?? null;

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
    return preserveProtectedReactionFields(
      apiDrop,
      latestExistingDrop,
      protectedIntent
    );
  }

  return apiDrop;
}

function buildOptimisticDrop(
  drop: IncomingDrop,
  wave: IncomingDropWave,
  existingDrop: ExtendedDrop | null
): ExtendedDrop {
  const authorSubscribedActions =
    existingDrop === null
      ? drop.author.subscribed_actions
      : existingDrop.author.subscribed_actions;
  const contextProfileContext =
    existingDrop === null
      ? (drop.context_profile_context ?? null)
      : existingDrop.context_profile_context;

  return {
    ...drop,
    type: DropSize.FULL,
    author: {
      ...drop.author,
      subscribed_actions: authorSubscribedActions,
    },
    wave: {
      ...wave,
      authenticated_user_eligible_to_participate:
        existingDrop?.wave.authenticated_user_eligible_to_participate ??
        wave.authenticated_user_eligible_to_participate,
      authenticated_user_eligible_to_vote:
        existingDrop?.wave.authenticated_user_eligible_to_vote ??
        wave.authenticated_user_eligible_to_vote,
      authenticated_user_eligible_to_chat:
        existingDrop?.wave.authenticated_user_eligible_to_chat ??
        wave.authenticated_user_eligible_to_chat ??
        false,
      authenticated_user_admin:
        existingDrop?.wave.authenticated_user_admin ??
        wave.authenticated_user_admin,
    },
    stableKey: drop.id,
    stableHash: drop.id,
    context_profile_context: contextProfileContext,
  };
}

function toApiDrop(drop: ExtendedDrop): ApiDrop {
  const {
    type: _type,
    stableKey: _stableKey,
    stableHash: _stableHash,
    ...apiDrop
  } = drop;
  return apiDrop;
}

function replaceAttachmentInPart(
  part: ApiDropPart,
  attachment: ApiAttachment
): ApiDropPart {
  const attachments = part.attachments ?? [];
  const hasAttachment = attachments.some(
    (item) => item.attachment_id === attachment.attachment_id
  );

  if (!hasAttachment) {
    return part;
  }

  return {
    ...part,
    attachments: attachments.map((item) =>
      item.attachment_id === attachment.attachment_id ? attachment : item
    ),
  };
}

function replaceAttachmentInDrop(drop: Drop, attachment: ApiAttachment): Drop {
  if (drop.type !== DropSize.FULL) {
    return drop;
  }

  const parts = drop.parts.map((part) =>
    replaceAttachmentInPart(part, attachment)
  );
  const changed = parts.some((part, index) => part !== drop.parts[index]);

  return changed ? { ...drop, parts } : drop;
}

function replaceAttachmentInDrops(
  drops: Drop[],
  attachment: ApiAttachment
): { drops: Drop[]; changed: boolean } {
  const updatedDrops = drops.map((drop) =>
    replaceAttachmentInDrop(drop, attachment)
  );
  const changed = updatedDrops.some((drop, index) => drop !== drops[index]);

  return { drops: updatedDrops, changed };
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
  const queryClient = useQueryClient();
  const tabJustBecameVisibleRef = useRef<boolean>(false);

  const markWaveAsRead = useCallback(
    async (waveId: string): Promise<void> => {
      if (!isDocumentVisible()) {
        return;
      }

      await commonApiPostWithoutBodyAndResponse({
        endpoint: `notifications/wave/${waveId}/read`,
      });
      invalidateNotifications();
    },
    [invalidateNotifications]
  );

  const refreshEligibilityAfterVisibilityChange = useCallback(
    (waveId: string): void => {
      if (!tabJustBecameVisibleRef.current) {
        return;
      }

      tabJustBecameVisibleRef.current = false;
      void refreshEligibility(waveId);
    },
    [refreshEligibility]
  );

  const clearActiveWaveNotifications = useCallback(
    (waveId: string): void => {
      if (!isDocumentVisible()) {
        return;
      }

      void (async () => {
        try {
          await removeWaveDeliveredNotifications(waveId);
        } catch (error: unknown) {
          console.error(
            "Failed to remove wave delivered notifications:",
            error
          );
        }
      })();

      void (async () => {
        try {
          await markWaveAsRead(waveId);
        } catch (error: unknown) {
          console.error("Failed to mark wave as read:", error);
        }
      })();
    },
    [markWaveAsRead, removeWaveDeliveredNotifications]
  );

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

  const handleFetchedDropUpdate = useCallback(
    async (
      drop: IncomingDrop,
      type: ProcessIncomingDropType,
      waveId: string
    ): Promise<void> => {
      const apiDrop = await fetchDropByIdBatched(drop.id);
      const latestData = getData(waveId);

      if (latestData === undefined) {
        return;
      }

      const latestExistingDrop = getFullDrop(
        latestData.drops.find((cachedDrop) => cachedDrop.id === drop.id)
      );

      if (latestExistingDrop === null) {
        return;
      }

      const nextDrop = reconcileReactionUpdate(
        apiDrop,
        latestExistingDrop,
        type
      );

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
      updateDropInCachedDrops(queryClient, nextDrop);
    },
    [getData, queryClient, updateData]
  );

  const processIncomingDropAsync = useCallback(
    async (
      drop: IncomingDrop,
      type: ProcessIncomingDropType
    ): Promise<void> => {
      const wave = getIncomingWave(drop);
      if (wave === null) {
        return;
      }

      const waveId = wave.id;
      if (isWaveMuted(waveId)) {
        return;
      }

      refreshEligibilityAfterVisibilityChange(waveId);
      const currentData = getData(waveId);

      if (currentData === undefined) {
        // Wave not registered or data not loaded yet.
        // Registering will trigger initial fetch which should get this message.
        registerWave(waveId);
        return;
      }

      const existingDrop = currentData.drops.find((d) => d.id === drop.id);

      if (shouldSkipIncomingDrop(type, existingDrop)) {
        return;
      }

      if (isFetchedDropUpdate(type)) {
        await handleFetchedDropUpdate(drop, type, waveId);
        return;
      }

      const optimisticDrop = buildOptimisticDrop(
        drop,
        wave,
        getFullDrop(existingDrop)
      );
      const serialNoForFetch = currentData.latestFetchedSerialNo;

      updateData({
        key: waveId,
        drops: [optimisticDrop],
      });
      updateDropInCachedDrops(queryClient, toApiDrop(optimisticDrop));

      if (serialNoForFetch !== null && !optimisticDrop.id.startsWith("temp-")) {
        // Initiate the background fetch for reconciliation
        void initiateFetchNewestCycle(waveId, serialNoForFetch);
      }

      if (activeWaveId === waveId && isDocumentVisible()) {
        clearActiveWaveNotifications(waveId);
      }
    },
    [
      activeWaveId,
      clearActiveWaveNotifications,
      getData,
      handleFetchedDropUpdate,
      initiateFetchNewestCycle,
      isWaveMuted,
      queryClient,
      refreshEligibilityAfterVisibilityChange,
      registerWave,
      updateData,
    ]
  );

  // WebSocket message handler
  const processIncomingDrop = useCallback<ProcessIncomingDropFn>(
    (drop, type) => {
      void (async () => {
        try {
          await processIncomingDropAsync(drop, type);
        } catch (error: unknown) {
          console.error("Failed to process incoming drop:", error);
        }
      })();
    },
    [processIncomingDropAsync]
  );

  const processDropRemoved = useCallback(
    (waveId: string, dropId: string) => {
      removeDrop(waveId, dropId);
    },
    [removeDrop]
  );

  const processAttachmentStatusUpdate = useCallback(
    (attachment: ApiAttachment) => {
      updateAttachmentInCachedDrops(queryClient, attachment);

      if (!activeWaveId) {
        return;
      }

      const currentData = getData(activeWaveId);
      if (!currentData) {
        return;
      }

      const { drops, changed } = replaceAttachmentInDrops(
        currentData.drops,
        attachment
      );

      if (changed) {
        updateData({
          key: activeWaveId,
          drops,
        });
      }
    },
    [activeWaveId, getData, queryClient, updateData]
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

  useWebSocketMessage<WsAttachmentStatusUpdateMessage["data"]>(
    WsMessageType.ATTACHMENT_STATUS_UPDATE,
    processAttachmentStatusUpdate
  );

  // Handle tab visibility changes - refresh eligibility when tab becomes visible
  useEffect(() => {
    const documentRef = getDocument();
    if (documentRef === null) {
      return;
    }

    const handleVisibilityChange = () => {
      if (isDocumentVisible()) {
        // Mark that tab just became visible, eligibility will be refreshed
        // on the next WebSocket message for any wave
        tabJustBecameVisibleRef.current = true;
      }
    };

    documentRef.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      documentRef.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
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
