"use client";

import type { ApiDrop } from "@/generated/models/ApiDrop";
import { QueryKey } from "@/components/react-query-wrapper/query-keys";
import { getReactionDetailsVersion } from "@/components/waves/drops/reaction-utils";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDropPart } from "@/generated/models/ApiDropPart";

import type { Drop, ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { ApiDropType } from "@/generated/models/ApiDropType";
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
import type { ApiDropV2View } from "@/services/api/drop-v2-view.types";

const HELP_BOT_HANDLE = "help6529";
const HELP_BOT_FINAL_REACTIONS = new Set([":white_check_mark:", ":warning:"]);

type ApiDropWithUnknownSerialNo = Omit<ApiDrop, "serial_no"> & {
  readonly serial_no: unknown;
};

export interface UseWaveRealtimeUpdaterProps extends WaveDataStoreUpdater {
  readonly removeDrops: (waveId: string, dropIds: readonly string[]) => void;
  readonly activeWaveId: string | null;
  readonly hasServerFeedSeed: (waveId: string) => boolean;
  /** Whether the wave is active or has a mounted message subscriber. */
  readonly isWaveInUse: (waveId: string) => boolean;
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
  /** Exact canonical payload already fetched for a compact WebSocket ref. */
  readonly canonicalDrop?: ApiDrop;
  /**
   * The socket message that delivered the drop: a full frame, or a compact
   * ref resolved over HTTP. Unset for drops from the app's own requests.
   */
  readonly realtimeSource?: "frame" | "compact-ref";
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

// A changed snapshot refreshes through its query key. An explicit reaction event
// must also refresh viewed lists when a removal and addition leave it unchanged.
const invalidateUnchangedReactionDetails = (
  queryClient: QueryClient,
  drop: ApiDrop
): void => {
  const version = getReactionDetailsVersion(
    drop.reactions,
    drop.context_profile_context?.reaction
  );
  void queryClient.invalidateQueries({
    queryKey: [QueryKey.DROP_REACTIONS, drop.id],
    predicate: (query) => query.queryKey[3] === version,
  });
};

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
    if (options.canonicalDrop) {
      invalidateUnchangedReactionDetails(queryClient, options.canonicalDrop);
    }
    return;
  }

  if (type === ProcessIncomingDropType.DROP_INSERT) {
    upsertDropIntoMatchingDropsQueries(queryClient, { drop });
  }

  const preferExistingPollVote = options.preferExistingPollVote;
  const clearLargestVote = type === ProcessIncomingDropType.DROP_RATING_UPDATE;
  if (preferExistingPollVote === undefined) {
    updateDropInCachedDrops(queryClient, drop, { clearLargestVote });
    return;
  }

  updateDropInCachedDrops(queryClient, drop, {
    preferExistingPollVote,
    clearLargestVote,
  });
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
  const apiDrop = options.canonicalDrop ?? (await fetchDropByIdBatched(dropId));
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
    if (!options.canonicalDrop) {
      invalidateUnchangedReactionDetails(queryClient, reconciledApiDrop);
    }
  }

  updateData({
    key: waveId,
    drops: [
      {
        ...reconciledApiDrop,
        type: DropSize.FULL,
        stableHash: existingDrop.stableHash,
        stableKey: existingDrop.stableKey,
        ...getPreservedRepliesCount(reconciledApiDrop, existingDrop),
      },
    ],
  });
};

/**
 * Realtime payloads use the v1 drop shape, which has no thread size. Keep the
 * count the stream already has so collapsed-reply expanders stay visible.
 */
const getPreservedRepliesCount = (
  drop: ApiDropV2View,
  existingDrop: ExtendedDrop | null
): { readonly replies_count?: number | undefined } => {
  const repliesCount = drop.replies_count ?? existingDrop?.replies_count;
  return repliesCount === undefined ? {} : { replies_count: repliesCount };
};

// Realtime payloads drop viewer-specific reply flags; keep what we know.
const getPreservedReplyPermissions = (
  drop: ApiDrop,
  existingDrop: ExtendedDrop | null
): {
  readonly authenticated_user_eligible_to_reply?: boolean;
  readonly authenticated_user_can_delete_replies?: boolean;
} => {
  const wave = existingDrop === null ? drop.wave : existingDrop.wave;
  return {
    ...(wave.authenticated_user_eligible_to_reply === undefined
      ? {}
      : {
          authenticated_user_eligible_to_reply:
            wave.authenticated_user_eligible_to_reply,
        }),
    ...(wave.authenticated_user_can_delete_replies === undefined
      ? {}
      : {
          authenticated_user_can_delete_replies:
            wave.authenticated_user_can_delete_replies,
        }),
  };
};

/**
 * A signed create or edit is broadcast before its author signature is stored,
 * so that update reads as unsigned and can arrive after the signed response.
 * For one content version the state only moves from unsigned to signed, so a
 * known signature stays while the version and its visibility are unchanged.
 */
const getPreservedAuthorSignature = (
  drop: ApiDrop,
  existingDrop: ExtendedDrop | null
): { readonly is_author_signed?: boolean } =>
  existingDrop?.is_author_signed === true &&
  drop.is_author_signed !== true &&
  existingDrop.id === drop.id &&
  existingDrop.updated_at === drop.updated_at &&
  drop.moderation?.can_view !== false
    ? { is_author_signed: true }
    : {};

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
      ...getPreservedReplyPermissions(reconciledDrop, existingDrop),
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
    ...getPreservedRepliesCount(reconciledDrop, existingDrop),
    ...getPreservedAuthorSignature(reconciledDrop, existingDrop),
  };
};

const VIEWER_WAVE_FLAGS = [
  "authenticated_user_eligible_to_vote",
  "authenticated_user_eligible_to_participate",
  "authenticated_user_eligible_to_chat",
  "authenticated_user_eligible_to_reply",
  "authenticated_user_can_delete_replies",
  "authenticated_user_admin",
] as const;

type ViewerWaveFlags = Partial<
  Pick<ApiDrop["wave"], (typeof VIEWER_WAVE_FLAGS)[number]>
>;

// Drops stored from a socket frame carry no viewer flags at runtime, although
// the type says they do.
const hasViewerWaveFlags = (wave: ApiDrop["wave"]): boolean =>
  (wave as Partial<ApiDrop["wave"]>).authenticated_user_eligible_to_chat !==
  undefined;

const isViewerContextTemplate = (
  drop: Drop,
  dropId: string
): drop is ExtendedDrop =>
  drop.type === DropSize.FULL &&
  drop.id !== dropId &&
  !drop.id.startsWith("temp-") &&
  hasViewerWaveFlags(drop.wave);

const pickViewerWaveFlags = (wave: ApiDrop["wave"]): ViewerWaveFlags => {
  const flags: Record<string, boolean> = {};
  for (const flag of VIEWER_WAVE_FLAGS) {
    const value = wave[flag];
    if (value !== undefined) flags[flag] = value;
  }
  return flags as ViewerWaveFlags;
};

/**
 * A socket frame carries no viewer context: the server clears the viewer's
 * wave flags and `context_profile_context` from every frame. The newest-drops
 * fetch after each frame used to fill them in. With gap-only sync, a new chat
 * drop takes them from a stored drop of the same wave instead: the flags and
 * `curatable` are the same for every drop in a wave, and the rest of the
 * context is fixed for a drop nobody can have rated, reacted to, boosted,
 * bookmarked or curated yet (chat drops always have a zero rating range).
 *
 * Returns null for other drop types, or when no stored drop has the context;
 * the caller then fetches the newest drops, as before.
 */
const hydrateRealtimeChatDrop = (
  drop: ExtendedDrop,
  storedDrops: readonly Drop[]
): ExtendedDrop | null => {
  if (drop.drop_type !== ApiDropType.Chat) return null;
  const template = storedDrops.find((stored) =>
    isViewerContextTemplate(stored, drop.id)
  );
  if (template === undefined) return null;
  const templateContext = template.context_profile_context;
  return {
    ...drop,
    wave: { ...drop.wave, ...pickViewerWaveFlags(template.wave) },
    context_profile_context: !templateContext
      ? null
      : {
          rating: 0,
          min_rating: 0,
          max_rating: 0,
          reaction: null,
          boosted: false,
          bookmarked: false,
          curatable: templateContext.curatable,
          curated: false,
        },
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
  hydrateRealtimeChatDrop,
  isCanonicalDropUpdate,
  isHelpBotFinalReactionUpdate,
  normalizeRealtimeDrop,
  replaceAttachmentInDrops,
  reportBackgroundTaskError,
  updateCachedDrop,
};
