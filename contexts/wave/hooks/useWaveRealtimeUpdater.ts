"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";
import type {
  WsAttachmentStatusUpdateMessage,
  WsDropDeleteMessage,
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
import type { WaveDataStoreUpdater, WaveMessages } from "./types";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { recordReactionRealtimeReconciliation } from "@/utils/monitoring/dropReactionMonitoring";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { reconcileDropAuthenticatedPollVote } from "@/helpers/waves/poll-vote-reconciliation";
import {
  updateAttachmentInCachedDrops,
  updateDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import { upsertDropIntoMatchingDropsQueries } from "@/components/react-query-wrapper/utils/addDropsToDrops";
import { isWaveDropNearViewport } from "@/contexts/wave/drop-visibility";

const HELP_BOT_HANDLE = "help6529";
const HELP_BOT_FINAL_REACTIONS = new Set([
  ":white_check_mark:",
  ":warning:",
]);

type ApiDropWithUnknownSerialNo = Omit<ApiDrop, "serial_no"> & {
  readonly serial_no: unknown;
};

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

interface ProcessIncomingDropOptions {
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

const parseRealtimeSerialNo = (value: unknown): number | null => {
  if (typeof value === "number" && Number.isSafeInteger(value)) {
    return value;
  }

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();
  if (!/^\d+$/.test(normalized)) {
    return null;
  }

  const parsed = Number(normalized);
  return Number.isSafeInteger(parsed) ? parsed : null;
};

const normalizeRealtimeDrop = (drop: ApiDrop): ApiDrop => {
  const rawSerialNo = (drop as ApiDropWithUnknownSerialNo).serial_no;
  const serialNo = parseRealtimeSerialNo(rawSerialNo);

  if (serialNo === null || serialNo === rawSerialNo) {
    return drop;
  }

  return {
    ...drop,
    serial_no: serialNo,
  };
};

const isCanonicalDropUpdate = (type: ProcessIncomingDropType): boolean =>
  type === ProcessIncomingDropType.DROP_RATING_UPDATE ||
  type === ProcessIncomingDropType.DROP_REACTION_UPDATE;

const shouldUpdateCachedDrop = (type: ProcessIncomingDropType): boolean =>
  type !== ProcessIncomingDropType.DROP_REACTION_UPDATE;

const updateCachedDrop = ({
  drop,
  options,
  queryClient,
  type,
}: {
  readonly drop: ApiDrop;
  readonly options: ProcessIncomingDropOptions;
  readonly queryClient: QueryClient;
  readonly type: ProcessIncomingDropType;
}): void => {
  if (!shouldUpdateCachedDrop(type)) {
    return;
  }

  if (type === ProcessIncomingDropType.DROP_INSERT) {
    upsertDropIntoMatchingDropsQueries(queryClient, { drop });
  }

  const preferExistingPollVote = options.preferExistingPollVote;
  if (preferExistingPollVote === undefined) {
    updateDropInCachedDrops(queryClient, drop);
    return;
  }

  updateDropInCachedDrops(queryClient, drop, { preferExistingPollVote });
};

const normalizeHandle = (handle: string | null | undefined): string =>
  handle?.replace(/^@/, "").trim().toLowerCase() ?? "";

const hasHelpBotReactionProfile = (drop: ApiDrop): boolean =>
  (drop.reactions ?? []).some(
    (reaction) =>
      HELP_BOT_FINAL_REACTIONS.has(reaction.reaction) &&
      reaction.profiles.some(
        (profile) => normalizeHandle(profile.handle) === HELP_BOT_HANDLE
      )
  );

const hasHelpBotMention = (drop: ApiDrop): boolean =>
  (drop.mentioned_users ?? []).some((user) => {
    const mention = user as {
      readonly handle_in_content?: string | null | undefined;
      readonly current_handle?: string | null | undefined;
    };
    return (
      normalizeHandle(mention.handle_in_content) === HELP_BOT_HANDLE ||
      normalizeHandle(mention.current_handle) === HELP_BOT_HANDLE
    );
  });

const isHelpBotFinalReactionUpdate = (drop: ApiDrop): boolean =>
  hasHelpBotReactionProfile(drop) ||
  (hasHelpBotMention(drop) &&
    (drop.reactions ?? []).some((reaction) =>
      HELP_BOT_FINAL_REACTIONS.has(reaction.reaction)
    ));

const getNewestKnownSerialNo = (waveMessages: WaveMessages): number | null => {
  if (waveMessages.latestFetchedSerialNo !== null) {
    return waveMessages.latestFetchedSerialNo;
  }

  const serials = waveMessages.drops
    .map((drop) => drop.serial_no)
    .filter((serialNo) => Number.isFinite(serialNo));
  return serials.length ? Math.max(...serials) : null;
};

const reportBackgroundTaskError = (message: string, error: unknown): void => {
  console.error(message, error);
};

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
  const preferExistingPollVote = options.preferExistingPollVote;
  const reconciledApiDrop =
    preferExistingPollVote === undefined
      ? reconcileDropAuthenticatedPollVote(apiDrop, existingDrop)
      : reconcileDropAuthenticatedPollVote(apiDrop, existingDrop, {
          preferExistingVote: preferExistingPollVote,
        });

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
  const preferExistingPollVote = options.preferExistingPollVote;
  let reconciledDrop = drop;
  if (existingDrop !== null && preferExistingPollVote === undefined) {
    reconciledDrop = reconcileDropAuthenticatedPollVote(drop, existingDrop);
  }
  if (existingDrop !== null && preferExistingPollVote !== undefined) {
    reconciledDrop = reconcileDropAuthenticatedPollVote(drop, existingDrop, {
      preferExistingVote: preferExistingPollVote,
    });
  }

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
  const pendingDeliveredNotificationsRef = useRef<Promise<void> | null>(null);
  const pendingReadNotificationsRef = useRef<Promise<void> | null>(null);
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

  const removeDeliveredNotifications = useCallback(
    async (waveId: string) => {
      try {
        await removeWaveDeliveredNotifications(waveId);
      } catch (error) {
        reportBackgroundTaskError(
          "Failed to remove wave delivered notifications:",
          error
        );
      }
    },
    [removeWaveDeliveredNotifications]
  );

  const markNotificationsRead = useCallback(
    async (waveId: string) => {
      try {
        await markWaveNotificationsRead(waveId, {
          shouldSend: () => canSendReadForWave(waveId),
        });
      } catch (error) {
        reportBackgroundTaskError("Failed to mark wave as read:", error);
      }
    },
    [markWaveNotificationsRead, canSendReadForWave]
  );

  return useCallback(
    (waveId: string) => {
      if (activeWaveId !== waveId || document.visibilityState !== "visible") {
        return;
      }

      pendingDeliveredNotificationsRef.current =
        removeDeliveredNotifications(waveId);
      pendingReadNotificationsRef.current = markNotificationsRead(waveId);
    },
    [activeWaveId, removeDeliveredNotifications, markNotificationsRead]
  );
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
  const initiateFetchNewestCycle = useNewestMessagesSync({
    getData,
    updateData,
    syncNewestMessages,
  });
  const markActiveWaveAsRead = useActiveWaveReadMarker({
    activeWaveId,
    removeWaveDeliveredNotifications,
  });
  const refreshEligibilityAfterVisibilityChange =
    useVisibilityEligibilityRefresh();
  const applyCanonicalDropUpdateForExistingDrop =
    useCanonicalDropUpdateForExistingDrop({ queryClient, updateData });
  const syncNewestMessagesAfterDropUpdate = useNewestMessagesAfterDropUpdate(
    initiateFetchNewestCycle
  );

  return useCallback(
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

      if (isWaveMuted(waveId)) {
        return;
      }

      await refreshEligibilityAfterVisibilityChange(waveId);

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
          markActiveWaveAsRead(waveId);
        }
        return;
      }

      const optimisticDrop = buildOptimisticDrop({
        drop,
        existingDrop: existingFullDrop,
        options,
      });

      updateData({
        key: waveId,
        drops: [optimisticDrop],
      });

      await syncNewestMessagesAfterDropUpdate(
        waveId,
        currentData.latestFetchedSerialNo,
        optimisticDrop.id
      );

      markActiveWaveAsRead(waveId);
    },
    [
      getData,
      updateData,
      registerWave,
      applyCanonicalDropUpdateForExistingDrop,
      markActiveWaveAsRead,
      refreshEligibilityAfterVisibilityChange,
      isWaveMuted,
      queryClient,
      syncNewestMessagesAfterDropUpdate,
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
  const pendingDropUpdateRef = useRef<Promise<void> | null>(null);

  useWebSocketMessage<WsDropUpdateMessage["data"]>(
    WsMessageType.DROP_UPDATE,
    (messageData) => {
      pendingDropUpdateRef.current = processIncomingDrop(
        messageData,
        ProcessIncomingDropType.DROP_INSERT,
        {
          preferExistingPollVote: true,
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
  processDropRemoved: (waveId: string, dropId: string) => void
): void => {
  useWebSocketMessage<WsDropDeleteMessage["data"]>(
    WsMessageType.DROP_DELETE,
    (messageData) => {
      processDropRemoved(messageData.wave_id, messageData.drop_id);
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
  useDropDeleteMessages(processDropRemoved);

  useWebSocketMessage<WsAttachmentStatusUpdateMessage["data"]>(
    WsMessageType.ATTACHMENT_STATUS_UPDATE,
    processAttachmentStatusUpdate
  );

  return { processIncomingDrop, processDropRemoved };
}
