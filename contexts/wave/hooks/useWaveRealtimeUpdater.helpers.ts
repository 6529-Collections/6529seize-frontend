"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";

import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { fetchDropByIdBatched } from "@/services/api/drop-api";

import type { WaveDataStoreUpdater, WaveMessages } from "./types";
import { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import { recordReactionRealtimeReconciliation } from "@/utils/monitoring/dropReactionMonitoring";
import { type QueryClient } from "@tanstack/react-query";
import { reconcileDropAuthenticatedPollVote } from "@/helpers/waves/poll-vote-reconciliation";
import {
  reconcileAttachmentStatusUpdate,
  reconcileFinalizedDropAttachments,
  updateDropInCachedDrops,
} from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import { upsertDropIntoMatchingDropsQueries } from "@/components/react-query-wrapper/utils/addDropsToDrops";

const HELP_BOT_HANDLE = "help6529";
const HELP_BOT_FINAL_REACTIONS = new Set([":white_check_mark:", ":warning:"]);

type ApiDropWithUnknownSerialNo = Omit<ApiDrop, "serial_no"> & {
  readonly serial_no: unknown;
};

export interface UseWaveRealtimeUpdaterProps extends WaveDataStoreUpdater {
  readonly activeWaveId: string | null;
  readonly hasServerFeedSeed: (waveId: string) => boolean;
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

export type ProcessIncomingDropFn = (
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
  const attachments = part.attachments.map((item) =>
    item.attachment_id === attachment.attachment_id
      ? reconcileAttachmentStatusUpdate(item, attachment)
      : item
  );
  const changed = attachments.some(
    (item, index) => item !== part.attachments[index]
  );

  return changed ? { ...part, attachments } : part;
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
  let reconciledDrop =
    existingDrop === null
      ? drop
      : reconcileFinalizedDropAttachments(drop, existingDrop);
  if (existingDrop !== null && preferExistingPollVote === undefined) {
    reconciledDrop = reconcileDropAuthenticatedPollVote(
      reconciledDrop,
      existingDrop
    );
  }
  if (existingDrop !== null && preferExistingPollVote !== undefined) {
    reconciledDrop = reconcileDropAuthenticatedPollVote(
      reconciledDrop,
      existingDrop,
      {
        preferExistingVote: preferExistingPollVote,
      }
    );
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

export {
  applyCanonicalDropUpdate,
  buildOptimisticDrop,
  getIncomingWaveId,
  getNewestKnownSerialNo,
  isCanonicalDropUpdate,
  isHelpBotFinalReactionUpdate,
  normalizeRealtimeDrop,
  replaceAttachmentInDrops,
  reportBackgroundTaskError,
  updateCachedDrop,
};
