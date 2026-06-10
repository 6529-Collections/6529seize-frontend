"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type {
  WsAttachmentStatusUpdateMessage,
  WsDropUpdateMessage,
} from "@/helpers/Types";
import { WsMessageType } from "@/helpers/Types";
import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { useMarkWaveNotificationsRead } from "@/hooks/useMarkWaveNotificationsRead";
import { fetchDropByIdBatched } from "@/services/api/drop-api";
import { useWebSocketMessage } from "@/services/websocket/useWebSocketMessage";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";
import { useWaveEligibility } from "../WaveEligibilityContext";
import type { WaveDataStoreUpdater } from "./types";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { recordReactionRealtimeReconciliation } from "@/utils/monitoring/dropReactionMonitoring";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { reconcileDropAuthenticatedPollVote } from "@/helpers/waves/poll-vote-reconciliation";
import {
  updateAttachmentInCachedDrops,
  updateDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";

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

type ProcessIncomingDropFn = (
  dropData: ApiDrop,
  type: ProcessIncomingDropType,
  options?: ProcessIncomingDropOptions
) => Promise<void>;

export interface ProcessIncomingDropOptions {
  readonly preferExistingPollVote?: boolean;
}

function replaceAttachmentInPart(
  part: ApiDropPart,
  attachment: ApiAttachment
): ApiDropPart {
  const attachments = part.attachments;
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

const getIncomingWaveId = (drop: ApiDrop): string | null => {
  const wave = (drop as { readonly wave?: { readonly id?: unknown } }).wave;
  return typeof wave?.id === "string" && wave.id.length > 0 ? wave.id : null;
};

const isCanonicalDropUpdate = (type: ProcessIncomingDropType): boolean =>
  type === ProcessIncomingDropType.DROP_RATING_UPDATE ||
  type === ProcessIncomingDropType.DROP_REACTION_UPDATE;

const shouldApplyCanonicalDrop = (
  type: ProcessIncomingDropType,
  drop: ApiDrop
): boolean => {
  if (type !== ProcessIncomingDropType.DROP_REACTION_UPDATE) {
    return true;
  }

  return recordReactionRealtimeReconciliation({
    drop: {
      id: drop.id,
      wave: { id: drop.wave.id },
      context_profile_context: drop.context_profile_context,
    },
    websocketStatus: WebSocketStatus.CONNECTED,
  }).shouldApplyCanonicalDrop;
};

interface CanonicalDropUpdateParams {
  readonly dropId: string;
  readonly existingDrop: ExtendedDrop;
  readonly waveId: string;
  readonly type: ProcessIncomingDropType;
  readonly options: ProcessIncomingDropOptions;
  readonly queryClient: QueryClient;
  readonly updateData: WaveDataStoreUpdater["updateData"];
}

const applyCanonicalDropUpdate = async ({
  dropId,
  existingDrop,
  waveId,
  type,
  options,
  queryClient,
  updateData,
}: CanonicalDropUpdateParams): Promise<void> => {
  const apiDrop = await fetchDropByIdBatched(dropId);
  const reconciledApiDrop = reconcileDropAuthenticatedPollVote(
    apiDrop,
    existingDrop,
    { preferExistingVote: options.preferExistingPollVote }
  );

  if (!shouldApplyCanonicalDrop(type, reconciledApiDrop)) {
    return;
  }

  if (type === ProcessIncomingDropType.DROP_REACTION_UPDATE) {
    updateDropInCachedDrops(queryClient, reconciledApiDrop);
  }

  updateData({
    key: waveId,
    drops: [
      {
        ...reconciledApiDrop,
        type: DropSize.FULL,
        stableHash: existingDrop.stableHash,
        stableKey: existingDrop.stableKey,
      },
    ],
  });
};

const buildOptimisticDrop = ({
  drop,
  existingDrop,
  options,
}: {
  readonly drop: ApiDrop;
  readonly existingDrop: ExtendedDrop | null;
  readonly options: ProcessIncomingDropOptions;
}): ExtendedDrop => {
  const reconciledDrop =
    existingDrop === null
      ? drop
      : reconcileDropAuthenticatedPollVote(drop, existingDrop, {
          preferExistingVote: options.preferExistingPollVote,
        });

  return {
    ...reconciledDrop,
    type: DropSize.FULL,
    author: {
      ...reconciledDrop.author,
      subscribed_actions:
        existingDrop === null
          ? reconciledDrop.author.subscribed_actions
          : existingDrop.author.subscribed_actions,
    },
    wave: {
      ...reconciledDrop.wave,
      authenticated_user_eligible_to_participate:
        existingDrop === null
          ? reconciledDrop.wave.authenticated_user_eligible_to_participate
          : existingDrop.wave.authenticated_user_eligible_to_participate,
      authenticated_user_eligible_to_vote:
        existingDrop === null
          ? reconciledDrop.wave.authenticated_user_eligible_to_vote
          : existingDrop.wave.authenticated_user_eligible_to_vote,
      authenticated_user_eligible_to_chat:
        existingDrop === null
          ? reconciledDrop.wave.authenticated_user_eligible_to_chat
          : existingDrop.wave.authenticated_user_eligible_to_chat,
      authenticated_user_admin:
        existingDrop === null
          ? reconciledDrop.wave.authenticated_user_admin
          : existingDrop.wave.authenticated_user_admin,
    },
    stableKey: reconciledDrop.id,
    stableHash: reconciledDrop.id,
    context_profile_context:
      existingDrop === null
        ? (reconciledDrop.context_profile_context ?? null)
        : existingDrop.context_profile_context,
  };
};

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
        isFetchingNewestRef.current[waveId] = false;

        if (needsRefetchAfterCurrentRef.current[waveId]) {
          needsRefetchAfterCurrentRef.current[waveId] = false;
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

const useActiveWaveReadMarker = ({
  activeWaveId,
  removeWaveDeliveredNotifications,
}: Pick<
  UseWaveRealtimeUpdaterProps,
  "activeWaveId" | "removeWaveDeliveredNotifications"
>): ((waveId: string) => void) => {
  const activeWaveIdRef = useRef(activeWaveId);
  useLayoutEffect(() => {
    activeWaveIdRef.current = activeWaveId;
  }, [activeWaveId]);

  const markWaveNotificationsRead = useMarkWaveNotificationsRead();
  const canSendReadForWave = useCallback((waveId: string): boolean => {
    return (
      activeWaveIdRef.current === waveId &&
      document.visibilityState === "visible"
    );
  }, []);

  return useCallback(
    (waveId: string) => {
      if (activeWaveId !== waveId || document.visibilityState !== "visible") {
        return;
      }

      void (async () => {
        try {
          await removeWaveDeliveredNotifications(waveId);
        } catch (error) {
          console.error(
            "Failed to remove wave delivered notifications:",
            error
          );
        }
      })();
      void (async () => {
        try {
          await markWaveNotificationsRead(waveId, {
            shouldSend: () => canSendReadForWave(waveId),
          });
        } catch (error) {
          console.error("Failed to mark wave as read:", error);
        }
      })();
    },
    [
      activeWaveId,
      removeWaveDeliveredNotifications,
      markWaveNotificationsRead,
      canSendReadForWave,
    ]
  );
};

interface UseProcessIncomingDropParams extends Pick<
  UseWaveRealtimeUpdaterProps,
  | "activeWaveId"
  | "getData"
  | "updateData"
  | "registerWave"
  | "syncNewestMessages"
  | "removeWaveDeliveredNotifications"
  | "isWaveMuted"
> {
  readonly queryClient: QueryClient;
}

const useProcessIncomingDrop = ({
  activeWaveId,
  getData,
  updateData,
  registerWave,
  syncNewestMessages,
  removeWaveDeliveredNotifications,
  isWaveMuted,
  queryClient,
}: UseProcessIncomingDropParams): ProcessIncomingDropFn => {
  const { refreshEligibility } = useWaveEligibility();
  const tabJustBecameVisibleRef = useRef<boolean>(false);
  const initiateFetchNewestCycle = useNewestMessagesSync({
    getData,
    updateData,
    syncNewestMessages,
  });
  const markActiveWaveAsRead = useActiveWaveReadMarker({
    activeWaveId,
    removeWaveDeliveredNotifications,
  });

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
    async (
      drop: ApiDrop,
      type: ProcessIncomingDropType,
      options: ProcessIncomingDropOptions = {}
    ) => {
      const waveId = getIncomingWaveId(drop);
      if (waveId === null) {
        return;
      }

      if (type !== ProcessIncomingDropType.DROP_REACTION_UPDATE) {
        updateDropInCachedDrops(queryClient, drop, {
          preferExistingPollVote: options.preferExistingPollVote,
        });
      }

      if (isWaveMuted(waveId)) {
        return;
      }

      if (tabJustBecameVisibleRef.current) {
        tabJustBecameVisibleRef.current = false;
        void refreshEligibility(waveId);
      }

      const currentData = getData(waveId);
      if (!currentData) {
        registerWave(waveId);
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
        await applyCanonicalDropUpdate({
          dropId: drop.id,
          existingDrop: existingFullDrop,
          waveId,
          type,
          options,
          queryClient,
          updateData,
        });
        return;
      }

      const optimisticDrop = buildOptimisticDrop({
        drop,
        existingDrop: existingFullDrop,
        options,
      });

      const serialNoForFetch = currentData.latestFetchedSerialNo;
      updateData({
        key: waveId,
        drops: [optimisticDrop],
      });

      if (serialNoForFetch !== null && !optimisticDrop.id.startsWith("temp-")) {
        void initiateFetchNewestCycle(waveId, serialNoForFetch);
      }

      markActiveWaveAsRead(waveId);
    },
    [
      getData,
      updateData,
      registerWave,
      initiateFetchNewestCycle,
      markActiveWaveAsRead,
      refreshEligibility,
      isWaveMuted,
      queryClient,
    ]
  );
};

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
  processIncomingDrop: ProcessIncomingDropFn
): void => {
  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    (messageData) => {
      void processIncomingDrop(
        messageData,
        ProcessIncomingDropType.DROP_INSERT,
        { preferExistingPollVote: true }
      );
    }
  );

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_RATING_UPDATE,
    (messageData) => {
      void processIncomingDrop(
        messageData,
        ProcessIncomingDropType.DROP_RATING_UPDATE,
        { preferExistingPollVote: true }
      );
    }
  );

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_REACTION_UPDATE,
    (messageData) => {
      void processIncomingDrop(
        messageData,
        ProcessIncomingDropType.DROP_REACTION_UPDATE,
        { preferExistingPollVote: true }
      );
    }
  );
};

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
  const queryClient = useQueryClient();
  const processIncomingDrop = useProcessIncomingDrop({
    activeWaveId,
    getData,
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

  useDropUpdateMessages(processIncomingDrop);

  useWebSocketMessage<WsAttachmentStatusUpdateMessage["data"]>(
    WsMessageType.ATTACHMENT_STATUS_UPDATE,
    processAttachmentStatusUpdate
  );

  return { processIncomingDrop, processDropRemoved };
}
