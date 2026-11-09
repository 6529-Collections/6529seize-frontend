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
import {
  useNewestMessagesAfterDropUpdate,
  useNewestMessagesSync,
} from "./useWaveRealtimeUpdater.newest";
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

interface UseProcessIncomingDropParams extends Pick<
  UseWaveRealtimeUpdaterProps,
  | "activeWaveId"
  | "activeReadWaveId"
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

/**
 * What a realtime message asks of gap sync: nothing (it changed no stored
 * wave, or the legacy per-message path handled it), a trailing check, or a
 * fetch now.
 */
type GapSignal = "none" | "frame" | "sync-now";

interface ApplyIncomingInsertParams {
  readonly drop: ApiDrop;
  readonly existingDrop: ExtendedDrop | null;
  readonly waveId: string;
  readonly currentData: WaveMessages;
  readonly options: ProcessIncomingDropOptions;
}

/**
 * Stores an inserted or updated drop for a wave whose messages are cached,
 * then says whether the newest drops must be fetched now.
 */
const useApplyIncomingInsert = ({
  gapSyncEnabled,
  markActiveWaveAsRead,
  syncNewestMessagesAfterDropUpdate,
  updateData,
}: {
  readonly gapSyncEnabled: boolean;
  readonly markActiveWaveAsRead: MarkActiveWaveAsRead;
  readonly syncNewestMessagesAfterDropUpdate: ReturnType<
    typeof useNewestMessagesAfterDropUpdate
  >;
  readonly updateData: UseWaveRealtimeUpdaterProps["updateData"];
}): ((params: ApplyIncomingInsertParams) => Promise<GapSignal>) =>
  useCallback(
    async ({
      drop,
      existingDrop,
      waveId,
      currentData,
      options,
    }: ApplyIncomingInsertParams): Promise<GapSignal> => {
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
        return "none";
      }

      // A new drop from a socket frame lacks the viewer's own context. It is
      // filled from the stored drops, or fetched when they cannot serve.
      const isNewFrameDrop =
        options.realtimeSource === "frame" && existingDrop === null;
      const hydratedDrop = isNewFrameDrop
        ? hydrateRealtimeChatDrop(optimisticDrop, currentData.drops)
        : optimisticDrop;
      updateData({ key: waveId, drops: [hydratedDrop ?? optimisticDrop] });
      markActiveWaveAsRead(waveId, drop.serial_no);

      return options.realtimeSource === "compact-ref" || hydratedDrop === null
        ? "sync-now"
        : "frame";
    },
    [
      gapSyncEnabled,
      markActiveWaveAsRead,
      syncNewestMessagesAfterDropUpdate,
      updateData,
    ]
  );

const useProcessIncomingDrop = ({
  activeWaveId,
  activeReadWaveId = activeWaveId,
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
  const activeReadWaveIdRef = useLatestActiveWaveIdRef(activeReadWaveId);
  const markActiveWaveAsRead = useActiveWaveReadMarker({
    activeWaveId: activeReadWaveId,
    activeWaveIdRef: activeReadWaveIdRef,
    batchReads: gapSyncEnabled,
    removeWaveDeliveredNotifications,
  });
  const syncNewestPage = useCallback(
    (waveId: string) => registerWave(waveId, true),
    [registerWave]
  );
  const gapSync = useWaveGapSync({
    activeWaveId,
    getData,
    hasServerFeedSeed,
    isWaveInUse,
    fetchNewestSince: initiateFetchNewestCycle,
    syncNewestPage,
  });
  const refreshEligibilityAfterVisibilityChange =
    useVisibilityEligibilityRefresh();
  const applyCanonicalDropUpdateForExistingDrop =
    useCanonicalDropUpdateForExistingDrop({ queryClient, updateData });
  const syncNewestMessagesAfterDropUpdate = useNewestMessagesAfterDropUpdate(
    initiateFetchNewestCycle
  );
  const applyIncomingInsert = useApplyIncomingInsert({
    gapSyncEnabled,
    markActiveWaveAsRead,
    syncNewestMessagesAfterDropUpdate,
    updateData,
  });

  const applyIncomingDrop = useCallback(
    async (
      drop: ApiDrop,
      waveId: string,
      type: ProcessIncomingDropType,
      options: ProcessIncomingDropOptions
    ): Promise<GapSignal> => {
      updateCachedDrop({ drop, options, queryClient, type });

      const shouldSkipMutedWave = () =>
        isWaveMuted(waveId) && activeWaveIdRef.current !== waveId;

      // Mute suppresses inactive-Wave processing, not live content in the open Wave.
      if (shouldSkipMutedWave()) {
        return "none";
      }

      await refreshEligibilityAfterVisibilityChange(waveId);

      if (shouldSkipMutedWave()) {
        return "none";
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
          return "frame";
        }
        // Waves without cached messages keep only list metadata, such as
        // unread counts, which the wave lists track themselves. They load
        // fresh when opened, so only an open wave missing its cache loads now.
        if (isWaveInUse(waveId)) {
          registerWave(waveId);
        }
        return "none";
      }

      const existingDrop = currentData.drops.find((d) => d.id === drop.id);

      if (existingDrop?.type === DropSize.LIGHT) {
        return "frame";
      }

      const existingFullDrop = existingDrop ?? null;
      if (!isCanonicalDropUpdate(type)) {
        return applyIncomingInsert({
          drop,
          existingDrop: existingFullDrop,
          waveId,
          currentData,
          options,
        });
      }
      // An update for a drop the store lacks may follow a lost frame; the
      // trailing check fetches that drop if it is past the verified serial.
      if (existingFullDrop === null) {
        return "frame";
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
      return "frame";
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

      const signal = await applyIncomingDrop(drop, waveId, type, options);

      // One rule for every socket message that changed a stored wave,
      // whichever branch handled it: a trailing check, or a fetch now. Drops
      // from the app's own requests come back from the server, so they are
      // verified already.
      if (
        !gapSyncEnabled ||
        options.realtimeSource === undefined ||
        isLegacyDirectMessageDrop(drop)
      ) {
        return;
      }
      if (signal === "sync-now") {
        gapSync.requestGapSync(waveId);
      } else if (signal === "frame") {
        gapSync.noteRealtimeFrame(waveId);
      }
    },
    [applyIncomingDrop, gapSync, gapSyncEnabled]
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
        { preferExistingPollVote: true, realtimeSource: "frame" }
      );
    }
  );

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_REACTION_UPDATE,
    (messageData) => {
      pendingDropUpdateRef.current = processIncomingDrop(
        messageData,
        ProcessIncomingDropType.DROP_REACTION_UPDATE,
        { preferExistingPollVote: true, realtimeSource: "frame" }
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
  activeReadWaveId,
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
      activeReadWaveId,
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
