"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type {
  WsAttachmentStatusUpdateMessage,
  WsDropDeleteMessage,
  WsDropUpdateRefMessage,
  WsDropUpdateMessage,
} from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  type RefObject,
} from "react";
import { useWaveEligibility } from "../WaveEligibilityContext";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { updateAttachmentInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import { isWaveDropNearViewport } from "@/contexts/wave/drop-visibility";
import {
  ProcessIncomingDropType,
  applyCanonicalDropUpdate,
  buildOptimisticDrop,
  getIncomingWaveId,
  getNewestKnownSerialNo,
  hydrateRealtimeChatDrop,
  isCanonicalDropUpdate,
  isHelpBotFinalReactionUpdate,
  normalizeRealtimeDrop,
  replaceAttachmentInDrops,
  reportBackgroundTaskError,
  updateCachedDrop,
  type ProcessIncomingDropFn,
  type ProcessIncomingDropOptions,
  type UseWaveRealtimeUpdaterProps,
} from "./useWaveRealtimeUpdater.helpers";
import { PROFILE_SWITCHED_EVENT } from "@/services/auth/auth.utils";
import { useDropUpdateRefMessages } from "./useDropUpdateRefMessages";
import type { WaveMessages } from "./types";
import { isChatGapSyncEnabled } from "./useWaveRealtimeUpdater.flags";
import {
  useActiveWaveReadMarker,
  type MarkActiveWaveAsRead,
} from "./useWaveRealtimeUpdater.readMarker";
import {
  useWaveGapSync,
  type WaveGapSync,
} from "./useWaveRealtimeUpdater.gapSync";

export { ProcessIncomingDropType } from "./useWaveRealtimeUpdater.helpers";

type InitiateFetchNewestCycleFn = (
  waveId: string,
  sinceSerialNo: number
) => Promise<void>;

const useNewestMessagesSync = ({
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

const useLatestActiveWaveIdRef = (
  activeWaveId: string | null
): RefObject<string | null> => {
  const activeWaveIdRef = useRef(activeWaveId);

  useLayoutEffect(() => {
    activeWaveIdRef.current = activeWaveId;
  }, [activeWaveId]);

  return activeWaveIdRef;
};

const useVisibilityEligibilityRefresh = (): ((
  waveId: string
) => Promise<void>) => {
  const { refreshEligibility } = useWaveEligibility();
  const tabJustBecameVisibleRef = useRef<boolean>(false);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        tabJustBecameVisibleRef.current = true;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  return useCallback(
    async (waveId: string) => {
      if (!tabJustBecameVisibleRef.current) {
        return;
      }

      tabJustBecameVisibleRef.current = false;
      try {
        await refreshEligibility(waveId);
      } catch (error) {
        reportBackgroundTaskError("Failed to refresh wave eligibility:", error);
      }
    },
    [refreshEligibility]
  );
};

interface ApplyCanonicalDropUpdateForExistingDropParams {
  readonly dropId: string;
  readonly existingDrop: ExtendedDrop;
  readonly waveId: string;
  readonly type: ProcessIncomingDropType;
  readonly options: ProcessIncomingDropOptions;
}

const useCanonicalDropUpdateForExistingDrop = ({
  queryClient,
  updateData,
}: Pick<UseProcessIncomingDropParams, "queryClient" | "updateData">): ((
  params: ApplyCanonicalDropUpdateForExistingDropParams
) => Promise<void>) =>
  useCallback(
    async ({
      dropId,
      existingDrop,
      waveId,
      type,
      options,
    }: ApplyCanonicalDropUpdateForExistingDropParams) => {
      try {
        await applyCanonicalDropUpdate({
          dropId,
          existingDrop,
          waveId,
          type,
          options,
          queryClient,
          updateData,
        });
      } catch (error) {
        reportBackgroundTaskError(
          "Failed to apply canonical drop update:",
          error
        );
      }
    },
    [queryClient, updateData]
  );

const useNewestMessagesAfterDropUpdate = (
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

interface UseProcessIncomingDropParams extends Pick<
  UseWaveRealtimeUpdaterProps,
  | "activeWaveId"
  | "getData"
  | "hasServerFeedSeed"
  | "isWaveInUse"
  | "updateData"
  | "registerWave"
  | "syncNewestMessages"
  | "removeWaveDeliveredNotifications"
  | "isWaveMuted"
> {
  readonly queryClient: QueryClient;
}

// Legacy direct messages keep the per-message fetch and read; they stop
// taking messages on 2026-12-01 (D153).
const isLegacyDirectMessageDrop = (drop: ApiDrop): boolean =>
  drop.wave.is_direct_message === true;

interface ApplyIncomingInsertParams {
  readonly drop: ApiDrop;
  readonly existingDrop: ExtendedDrop | null;
  readonly waveId: string;
  readonly currentData: WaveMessages;
  readonly options: ProcessIncomingDropOptions;
}

/**
 * Stores an inserted or updated drop for a wave whose messages are cached,
 * then decides whether the newest drops must be fetched.
 */
const useApplyIncomingInsert = ({
  gapSync,
  gapSyncEnabled,
  markActiveWaveAsRead,
  syncNewestMessagesAfterDropUpdate,
  updateData,
}: {
  readonly gapSync: WaveGapSync;
  readonly gapSyncEnabled: boolean;
  readonly markActiveWaveAsRead: MarkActiveWaveAsRead;
  readonly syncNewestMessagesAfterDropUpdate: ReturnType<
    typeof useNewestMessagesAfterDropUpdate
  >;
  readonly updateData: UseWaveRealtimeUpdaterProps["updateData"];
}): ((params: ApplyIncomingInsertParams) => Promise<void>) =>
  useCallback(
    async ({
      drop,
      existingDrop,
      waveId,
      currentData,
      options,
    }: ApplyIncomingInsertParams) => {
      const optimisticDrop = buildOptimisticDrop({
        drop,
        existingDrop,
        options,
      });
      if (!gapSyncEnabled || isLegacyDirectMessageDrop(drop)) {
        updateData({ key: waveId, drops: [optimisticDrop] });
        await syncNewestMessagesAfterDropUpdate(
          waveId,
          currentData.latestFetchedSerialNo,
          optimisticDrop.id
        );
        markActiveWaveAsRead(waveId, drop.serial_no, { immediate: true });
        return;
      }

      // A new drop from a socket frame lacks the viewer's own context. It is
      // filled from the stored drops, or fetched when they cannot serve.
      const isNewFrameDrop =
        options.realtimeSource === "frame" && existingDrop === null;
      const hydratedDrop = isNewFrameDrop
        ? hydrateRealtimeChatDrop(optimisticDrop, currentData.drops)
        : optimisticDrop;
      updateData({ key: waveId, drops: [hydratedDrop ?? optimisticDrop] });

      if (options.realtimeSource === "compact-ref" || hydratedDrop === null) {
        gapSync.requestGapSync(waveId);
      } else if (isNewFrameDrop) {
        gapSync.noteRealtimeInsert(waveId);
      }

      markActiveWaveAsRead(waveId, drop.serial_no);
    },
    [
      gapSync,
      gapSyncEnabled,
      markActiveWaveAsRead,
      syncNewestMessagesAfterDropUpdate,
      updateData,
    ]
  );

const useProcessIncomingDrop = ({
  activeWaveId,
  getData,
  hasServerFeedSeed,
  isWaveInUse,
  updateData,
  registerWave,
  syncNewestMessages,
  removeWaveDeliveredNotifications,
  isWaveMuted,
  queryClient,
}: UseProcessIncomingDropParams): {
  readonly processIncomingDrop: ProcessIncomingDropFn;
  readonly processDropUpdateRef: (messageData: unknown) => void;
  readonly gapSync: WaveGapSync;
} => {
  const gapSyncEnabled = isChatGapSyncEnabled();
  const initiateFetchNewestCycle = useNewestMessagesSync({
    getData,
    updateData,
    syncNewestMessages,
  });
  const activeWaveIdRef = useLatestActiveWaveIdRef(activeWaveId);
  const markActiveWaveAsRead = useActiveWaveReadMarker({
    activeWaveId,
    activeWaveIdRef,
    batchReads: gapSyncEnabled,
    removeWaveDeliveredNotifications,
  });
  const gapSync = useWaveGapSync({
    activeWaveId,
    getData,
    isWaveInUse,
    fetchNewestSince: initiateFetchNewestCycle,
  });
  const refreshEligibilityAfterVisibilityChange =
    useVisibilityEligibilityRefresh();
  const applyCanonicalDropUpdateForExistingDrop =
    useCanonicalDropUpdateForExistingDrop({ queryClient, updateData });
  const syncNewestMessagesAfterDropUpdate = useNewestMessagesAfterDropUpdate(
    initiateFetchNewestCycle
  );
  const applyIncomingInsert = useApplyIncomingInsert({
    gapSync,
    gapSyncEnabled,
    markActiveWaveAsRead,
    syncNewestMessagesAfterDropUpdate,
    updateData,
  });

  const processIncomingDrop = useCallback(
    async (
      dropData: ApiDrop,
      type: ProcessIncomingDropType,
      options: ProcessIncomingDropOptions = {}
    ) => {
      const drop = normalizeRealtimeDrop(dropData);
      const waveId = getIncomingWaveId(drop);

      if (waveId === null) {
        return;
      }

      updateCachedDrop({ drop, options, queryClient, type });

      const shouldSkipMutedWave = () =>
        isWaveMuted(waveId) && activeWaveIdRef.current !== waveId;

      // Mute suppresses inactive-Wave processing, not live content in the open Wave.
      if (shouldSkipMutedWave()) {
        return;
      }

      await refreshEligibilityAfterVisibilityChange(waveId);

      if (shouldSkipMutedWave()) {
        return;
      }

      const currentData = getData(waveId);
      if (!currentData) {
        if (
          type === ProcessIncomingDropType.DROP_INSERT &&
          hasServerFeedSeed(waveId)
        ) {
          updateData({
            key: waveId,
            drops: [
              buildOptimisticDrop({
                drop,
                existingDrop: null,
                options,
              }),
            ],
          });
          markActiveWaveAsRead(waveId, drop.serial_no, {
            immediate: isLegacyDirectMessageDrop(drop),
          });
          return;
        }
        // Waves without cached messages keep only list metadata, such as
        // unread counts, which the wave lists track themselves. They load
        // fresh when opened, so only an open wave missing its cache loads now.
        if (isWaveInUse(waveId)) {
          registerWave(waveId);
        }
        return;
      }

      const existingDrop = currentData.drops.find((d) => d.id === drop.id);

      if (existingDrop?.type === DropSize.LIGHT) {
        return;
      }

      const existingFullDrop = existingDrop ?? null;
      if (isCanonicalDropUpdate(type)) {
        if (existingFullDrop === null) {
          return;
        }
        await applyCanonicalDropUpdateForExistingDrop({
          dropId: drop.id,
          existingDrop: existingFullDrop,
          waveId,
          type,
          options,
        });
        if (
          type === ProcessIncomingDropType.DROP_REACTION_UPDATE &&
          isHelpBotFinalReactionUpdate(drop)
        ) {
          const newestKnownSerialNo = getNewestKnownSerialNo(currentData);
          await syncNewestMessagesAfterDropUpdate(
            waveId,
            newestKnownSerialNo,
            drop.id
          );
        }
        if (
          type === ProcessIncomingDropType.DROP_REACTION_UPDATE &&
          isWaveDropNearViewport(waveId, drop.id)
        ) {
          markActiveWaveAsRead(waveId, drop.serial_no, {
            immediate: isLegacyDirectMessageDrop(drop),
          });
        }
        return;
      }

      await applyIncomingInsert({
        drop,
        existingDrop: existingFullDrop,
        waveId,
        currentData,
        options,
      });
    },
    [
      activeWaveIdRef,
      getData,
      hasServerFeedSeed,
      isWaveInUse,
      updateData,
      registerWave,
      applyCanonicalDropUpdateForExistingDrop,
      applyIncomingInsert,
      markActiveWaveAsRead,
      refreshEligibilityAfterVisibilityChange,
      isWaveMuted,
      queryClient,
      syncNewestMessagesAfterDropUpdate,
    ]
  );

  const processDropUpdateRef = useDropUpdateRefMessages({
    processIncomingDrop,
  });

  return { processIncomingDrop, processDropUpdateRef, gapSync };
};

/**
 * The single app-wide handler for ATTACHMENT_STATUS_UPDATE. It refreshes every
 * cached drop query and the active wave's in-memory message store. Drop list
 * hooks must not subscribe to this event again; they would repeat the same
 * cache update once per mounted list.
 */
const useAttachmentStatusUpdate = ({
  activeWaveId,
  getData,
  updateData,
  queryClient,
}: Pick<
  UseWaveRealtimeUpdaterProps,
  "activeWaveId" | "getData" | "updateData"
> & {
  readonly queryClient: QueryClient;
}): ((attachment: ApiAttachment) => void) =>
  useCallback(
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

const useDropUpdateMessages = (
  processIncomingDrop: ProcessIncomingDropFn,
  processDropUpdateRef: (messageData: unknown) => void
): void => {
  const pendingDropUpdateRef = useRef<Promise<void> | null>(null);

  useWebSocketMessage<WsDropUpdateRefMessage["data"]>(
    WsMessageType.DROP_UPDATE_REF,
    processDropUpdateRef
  );

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    (messageData) => {
      pendingDropUpdateRef.current = processIncomingDrop(
        messageData,
        ProcessIncomingDropType.DROP_INSERT,
        {
          preferExistingPollVote: true,
          realtimeSource: "frame",
        }
      );
    }
  );

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_RATING_UPDATE,
    (messageData) => {
      pendingDropUpdateRef.current = processIncomingDrop(
        messageData,
        ProcessIncomingDropType.DROP_RATING_UPDATE,
        { preferExistingPollVote: true }
      );
    }
  );

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_REACTION_UPDATE,
    (messageData) => {
      pendingDropUpdateRef.current = processIncomingDrop(
        messageData,
        ProcessIncomingDropType.DROP_REACTION_UPDATE,
        { preferExistingPollVote: true }
      );
    }
  );
};

const useDropDeleteMessages = (
  removeDrops: UseWaveRealtimeUpdaterProps["removeDrops"]
): void => {
  const pending = useRef(new Map<string, Set<string>>());
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    const clear = () => {
      if (timer.current !== null) clearTimeout(timer.current);
      timer.current = null;
      pending.current.clear();
    };
    globalThis.addEventListener(PROFILE_SWITCHED_EVENT, clear);
    return () => {
      clear();
      globalThis.removeEventListener(PROFILE_SWITCHED_EVENT, clear);
    };
  }, []);
  useWebSocketMessage<WsDropDeleteMessage["data"]>(
    WsMessageType.DROP_DELETE,
    (messageData) => {
      const ids = pending.current.get(messageData.wave_id) ?? new Set<string>();
      ids.add(messageData.drop_id);
      pending.current.set(messageData.wave_id, ids);
      if (timer.current !== null) return;
      timer.current = setTimeout(() => {
        timer.current = null;
        const batches = pending.current;
        pending.current = new Map();
        for (const [waveId, removedIds] of batches) {
          removeDrops(waveId, [...removedIds]);
        }
      }, 100);
    }
  );
};

export function useWaveRealtimeUpdater({
  activeWaveId,
  getData,
  hasServerFeedSeed,
  isWaveInUse,
  updateData,
  registerWave,
  syncNewestMessages,
  removeDrop,
  removeDrops,
  removeWaveDeliveredNotifications,
  isWaveMuted,
}: UseWaveRealtimeUpdaterProps): {
  processIncomingDrop: ProcessIncomingDropFn;
  processDropRemoved: (waveId: string, dropId: string) => void;
} {
  const queryClient = useQueryClient();
  const { processIncomingDrop, processDropUpdateRef, gapSync } =
    useProcessIncomingDrop({
      activeWaveId,
      getData,
      hasServerFeedSeed,
      isWaveInUse,
      updateData,
      registerWave,
      syncNewestMessages,
      removeWaveDeliveredNotifications,
      isWaveMuted,
      queryClient,
    });

  const processDropRemoved = useCallback(
    (waveId: string, dropId: string) => {
      removeDrop(waveId, dropId);
    },
    [removeDrop]
  );

  const processAttachmentStatusUpdate = useAttachmentStatusUpdate({
    activeWaveId,
    getData,
    updateData,
    queryClient,
  });

  useDropUpdateMessages(processIncomingDrop, processDropUpdateRef);
  useDropDeleteMessages(removeDrops);

  // React Query state has its own resync (WebSocketRecoverySync); the message
  // store repairs here. Without gap sync, the next frame's fetch repairs it.
  const gapSyncEnabled = isChatGapSyncEnabled();
  useWebSocketMessage(WsMessageType.RESYNC_REQUIRED, () => {
    if (gapSyncEnabled) gapSync.requestResync();
  });

  useWebSocketMessage<WsAttachmentStatusUpdateMessage["data"]>(
    WsMessageType.ATTACHMENT_STATUS_UPDATE,
    processAttachmentStatusUpdate
  );

  return { processIncomingDrop, processDropRemoved };
}
