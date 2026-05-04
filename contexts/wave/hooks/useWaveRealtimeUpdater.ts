"use client";

import {
  type CachedDropReactionState,
  findDropInCachedDrops,
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
import { type QueryClient, useQueryClient } from "@tanstack/react-query";
import { useCallback, useContext, useEffect, useRef } from "react";
import { useWaveEligibility } from "../WaveEligibilityContext";
import type { WaveDataStoreUpdater, WaveMessages } from "./types";

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
  localDrop: CachedDropReactionState,
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

function shouldSkipIncomingDrop(existingDrop: Drop | undefined): boolean {
  return existingDrop?.type === DropSize.LIGHT;
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

function hasDropInWaveData(
  data: WaveMessages | undefined,
  dropId: string
): boolean {
  return data?.drops.some((drop) => drop.id === dropId) ?? false;
}

function hasProfileForReaction(
  reactions: ApiDropReaction[],
  profileId: string,
  reaction: string
): boolean {
  return reactions.some(
    (entry) =>
      entry.reaction === reaction &&
      entry.profiles.some((profile) => profile.id === profileId)
  );
}

function matchesProtectedReactionIntent(
  localDrop: CachedDropReactionState,
  protectedIntent: ProtectedReactionIntent
): boolean {
  const localReaction = localDrop.context_profile_context?.reaction ?? null;
  if (localReaction !== protectedIntent.reaction) {
    return false;
  }

  const profileId = protectedIntent.profileId;
  if (!profileId) {
    return true;
  }

  if (protectedIntent.reaction === null) {
    return findReactionProfile(localDrop.reactions, profileId) === null;
  }

  return hasProfileForReaction(
    localDrop.reactions,
    profileId,
    protectedIntent.reaction
  );
}

function getProtectedSnapshotFallback(
  cachedDropSnapshot: CachedDropReactionState | null | undefined,
  protectedIntent: ProtectedReactionIntent | null
): CachedDropReactionState | null {
  if (cachedDropSnapshot === undefined || cachedDropSnapshot === null) {
    return null;
  }

  if (protectedIntent === null) {
    return null;
  }

  return matchesProtectedReactionIntent(cachedDropSnapshot, protectedIntent)
    ? cachedDropSnapshot
    : null;
}

function selectFetchedDropLocalState({
  cachedDropSnapshot,
  latestCachedDrop,
  latestExistingDrop,
  protectedIntent,
}: {
  readonly cachedDropSnapshot: CachedDropReactionState | null | undefined;
  readonly latestCachedDrop: CachedDropReactionState | null;
  readonly latestExistingDrop: CachedDropReactionState | null;
  readonly protectedIntent: ProtectedReactionIntent | null;
}): CachedDropReactionState | null {
  const sources =
    cachedDropSnapshot !== undefined
      ? [latestCachedDrop, latestExistingDrop, cachedDropSnapshot]
      : [latestExistingDrop, latestCachedDrop, cachedDropSnapshot];
  const protectedSource =
    protectedIntent === null
      ? null
      : (sources.find(
          (source) =>
            source !== null &&
            source !== undefined &&
            matchesProtectedReactionIntent(source, protectedIntent)
        ) ?? null);

  if (protectedSource !== null) {
    return protectedSource;
  }

  const snapshotFallback = getProtectedSnapshotFallback(
    cachedDropSnapshot,
    protectedIntent
  );

  if (cachedDropSnapshot !== undefined) {
    return latestCachedDrop ?? latestExistingDrop ?? snapshotFallback;
  }

  return latestExistingDrop ?? latestCachedDrop ?? snapshotFallback;
}

function reconcileFetchedDropUpdate(
  apiDrop: ApiDrop,
  protectedIntent: ProtectedReactionIntent | null,
  localDrop: CachedDropReactionState | null
): ApiDrop {
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
      localDrop ?? {
        context_profile_context: null,
        reactions: [],
      },
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
  const attachments =
    (part as Partial<Pick<ApiDropPart, "attachments">>).attachments ?? [];
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

type WaveIdCallback = (waveId: string) => void;

type InitiateFetchNewestCycleFn = (
  waveId: string,
  sinceSerialNo: number
) => Promise<void>;

type AttachmentStatusProcessorFn = (attachment: ApiAttachment) => void;

type WaveRealtimeUpdaterResult = {
  processIncomingDrop: ProcessIncomingDropFn;
  processDropRemoved: (waveId: string, dropId: string) => void;
};

function useWaveNotificationActions({
  removeWaveDeliveredNotifications,
}: Pick<UseWaveRealtimeUpdaterProps, "removeWaveDeliveredNotifications">): {
  readonly clearActiveWaveNotifications: WaveIdCallback;
} {
  const { invalidateNotifications } = useContext(ReactQueryWrapperContext);
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

  return { clearActiveWaveNotifications };
}

function useWaveVisibilityRefresh(): {
  readonly refreshEligibilityAfterVisibilityChange: WaveIdCallback;
} {
  const { refreshEligibility } = useWaveEligibility();
  const tabJustBecameVisibleRef = useRef<boolean>(false);

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

  useEffect(() => {
    const documentRef = getDocument();
    if (documentRef === null) {
      return;
    }

    const handleVisibilityChange = () => {
      if (isDocumentVisible()) {
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

  return { refreshEligibilityAfterVisibilityChange };
}

function useNewestMessagesSync({
  getData,
  syncNewestMessages,
  updateData,
}: Pick<
  UseWaveRealtimeUpdaterProps,
  "getData" | "syncNewestMessages" | "updateData"
>): {
  readonly initiateFetchNewestCycle: InitiateFetchNewestCycleFn;
} {
  const isFetchingNewestRef = useRef<Record<string, boolean>>({});
  const needsRefetchAfterCurrentRef = useRef<Record<string, boolean>>({});
  const abortControllersRef = useRef<Record<string, AbortController>>({});

  const cleanupController = useCallback((waveId: string) => {
    if (abortControllersRef.current[waveId]) {
      delete abortControllersRef.current[waveId];
    }
  }, []);

  const initiateFetchNewestCycle = useCallback<InitiateFetchNewestCycleFn>(
    async (waveId: string, sinceSerialNo: number): Promise<void> => {
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
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          console.error("Error fetching newest messages:", error);
        }
      } finally {
        cleanupController(waveId);
        isFetchingNewestRef.current[waveId] = false;

        if (needsRefetchAfterCurrentRef.current[waveId]) {
          needsRefetchAfterCurrentRef.current[waveId] = false;
          const latestData = getData(waveId);
          const latestFetchedSerialNo = latestData?.latestFetchedSerialNo;
          if (
            latestFetchedSerialNo !== undefined &&
            latestFetchedSerialNo !== null &&
            latestFetchedSerialNo !== 0 &&
            !Number.isNaN(latestFetchedSerialNo)
          ) {
            await initiateFetchNewestCycle(waveId, latestFetchedSerialNo);
          }
        }
      }
    },
    [cleanupController, getData, syncNewestMessages, updateData]
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

  return { initiateFetchNewestCycle };
}

type IncomingDropProcessorProps = Pick<
  UseWaveRealtimeUpdaterProps,
  "activeWaveId" | "getData" | "isWaveMuted" | "registerWave" | "updateData"
> & {
  readonly clearActiveWaveNotifications: WaveIdCallback;
  readonly initiateFetchNewestCycle: InitiateFetchNewestCycleFn;
  readonly queryClient: QueryClient;
  readonly refreshEligibilityAfterVisibilityChange: WaveIdCallback;
};

function useIncomingDropProcessor({
  activeWaveId,
  clearActiveWaveNotifications,
  getData,
  initiateFetchNewestCycle,
  isWaveMuted,
  queryClient,
  refreshEligibilityAfterVisibilityChange,
  registerWave,
  updateData,
}: IncomingDropProcessorProps): {
  readonly processIncomingDrop: ProcessIncomingDropFn;
} {
  const handleFetchedDropUpdate = useCallback(
    async (
      drop: IncomingDrop,
      waveId: string,
      cachedDropSnapshot?: CachedDropReactionState | null
    ): Promise<void> => {
      const apiDrop = await fetchDropByIdBatched(drop.id);
      const latestData = getData(waveId);
      const latestExistingDrop = getFullDrop(
        latestData?.drops.find((cachedDrop) => cachedDrop.id === drop.id)
      );
      const latestCachedDrop = findDropInCachedDrops(queryClient, drop.id);
      const protectedIntent = getProtectedReactionIntent(apiDrop.id);
      const cachedDrop = selectFetchedDropLocalState({
        cachedDropSnapshot,
        latestCachedDrop,
        latestExistingDrop,
        protectedIntent,
      });

      const nextDrop = reconcileFetchedDropUpdate(
        apiDrop,
        protectedIntent,
        cachedDrop
      );

      if (latestExistingDrop !== null) {
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
      }

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
        if (isFetchedDropUpdate(type)) {
          registerWave(waveId);
          const registeredData = getData(waveId);
          if (hasDropInWaveData(registeredData, drop.id)) {
            await handleFetchedDropUpdate(drop, waveId);
            return;
          }

          const cachedDropSnapshot = findDropInCachedDrops(
            queryClient,
            drop.id
          );
          if (cachedDropSnapshot !== null) {
            await handleFetchedDropUpdate(drop, waveId, cachedDropSnapshot);
          }
        } else {
          registerWave(waveId);
        }
        return;
      }

      const existingDrop = currentData.drops.find((d) => d.id === drop.id);

      if (isFetchedDropUpdate(type)) {
        if (existingDrop !== undefined) {
          await handleFetchedDropUpdate(drop, waveId);
          return;
        }

        const cachedDropSnapshot = findDropInCachedDrops(queryClient, drop.id);
        if (cachedDropSnapshot !== null) {
          await handleFetchedDropUpdate(drop, waveId, cachedDropSnapshot);
        }
        return;
      }

      if (shouldSkipIncomingDrop(existingDrop)) {
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

  const processIncomingDrop = useCallback<ProcessIncomingDropFn>(
    (drop, type) => {
      void processIncomingDropAsync(drop, type).catch((error: unknown) => {
        console.error("Failed to process incoming drop:", error);
      });
    },
    [processIncomingDropAsync]
  );

  return { processIncomingDrop };
}

type AttachmentStatusProcessorProps = Pick<
  UseWaveRealtimeUpdaterProps,
  "activeWaveId" | "getData" | "updateData"
> & {
  readonly queryClient: QueryClient;
};

function useAttachmentStatusProcessor({
  activeWaveId,
  getData,
  queryClient,
  updateData,
}: AttachmentStatusProcessorProps): AttachmentStatusProcessorFn {
  return useCallback(
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
}: UseWaveRealtimeUpdaterProps): WaveRealtimeUpdaterResult {
  const queryClient = useQueryClient();
  const { clearActiveWaveNotifications } = useWaveNotificationActions({
    removeWaveDeliveredNotifications,
  });
  const { refreshEligibilityAfterVisibilityChange } =
    useWaveVisibilityRefresh();
  const { initiateFetchNewestCycle } = useNewestMessagesSync({
    getData,
    syncNewestMessages,
    updateData,
  });
  const { processIncomingDrop } = useIncomingDropProcessor({
    activeWaveId,
    clearActiveWaveNotifications,
    getData,
    initiateFetchNewestCycle,
    isWaveMuted,
    queryClient,
    refreshEligibilityAfterVisibilityChange,
    registerWave,
    updateData,
  });
  const processAttachmentStatusUpdate = useAttachmentStatusProcessor({
    activeWaveId,
    getData,
    queryClient,
    updateData,
  });

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

  useWebSocketMessage<WsAttachmentStatusUpdateMessage["data"]>(
    WsMessageType.ATTACHMENT_STATUS_UPDATE,
    processAttachmentStatusUpdate
  );

  return { processIncomingDrop, processDropRemoved };
}
