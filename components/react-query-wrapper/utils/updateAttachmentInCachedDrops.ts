import type { QueryClient } from "@tanstack/react-query";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiAttachmentStatus } from "@/generated/models/ApiAttachmentStatus";
import { reconcileDropAuthenticatedPollVote } from "@/helpers/waves/poll-vote-reconciliation";
import { QueryKey } from "../ReactQueryWrapper";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMatchingAttachment(
  value: Record<string, unknown>,
  attachmentId: string
): value is Record<string, unknown> & ApiAttachment {
  return (
    (value["attachment_id"] === attachmentId || value["id"] === attachmentId) &&
    typeof value["file_name"] === "string" &&
    typeof value["mime_type"] === "string" &&
    typeof value["kind"] === "string" &&
    typeof value["status"] === "string"
  );
}

function replaceAttachment(value: unknown, attachment: ApiAttachment): unknown {
  if (Array.isArray(value)) {
    const next = value.map((item) => replaceAttachment(item, attachment));
    const changed = next.some((item, index) => item !== value[index]);
    return changed ? next : value;
  }

  if (!isRecord(value)) {
    return value;
  }

  if (isMatchingAttachment(value, attachment.attachment_id)) {
    return reconcileAttachmentStatusUpdate(value, attachment);
  }

  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const updated = replaceAttachment(item, attachment);
    next[key] = updated;
    if (updated !== item) {
      changed = true;
    }
  }

  return changed ? next : value;
}

function isMatchingDrop(
  value: Record<string, unknown>,
  dropId: string
): boolean {
  return value["id"] === dropId;
}

const FINALIZED_ATTACHMENT_STATUSES = new Set<ApiAttachmentStatus>([
  ApiAttachmentStatus.Ready,
  ApiAttachmentStatus.Bad,
]);

function isFinalizedAttachment(value: unknown): value is ApiAttachment {
  return (
    isRecord(value) &&
    typeof value["attachment_id"] === "string" &&
    FINALIZED_ATTACHMENT_STATUSES.has(value["status"] as ApiAttachmentStatus)
  );
}

export function reconcileAttachmentStatusUpdate(
  existingAttachment: ApiAttachment,
  incomingAttachment: ApiAttachment
): ApiAttachment {
  if (
    isFinalizedAttachment(existingAttachment) &&
    !isFinalizedAttachment(incomingAttachment)
  ) {
    return existingAttachment;
  }

  return incomingAttachment;
}

export function reconcileFinalizedDropAttachments(
  drop: ApiDrop,
  existingDrop: unknown
): ApiDrop {
  if (
    !Array.isArray(drop.parts) ||
    !isRecord(existingDrop) ||
    !Array.isArray(existingDrop["parts"])
  ) {
    return drop;
  }

  const existingParts = existingDrop["parts"] as unknown[];
  const existingUpdatedAt = existingDrop["updated_at"];
  // Intentional drop edits receive a newer numeric updated_at from the backend.
  // Equal or null values can be attachment-lifecycle snapshots of the same drop.
  if (
    typeof drop.updated_at === "number" &&
    typeof existingUpdatedAt === "number" &&
    drop.updated_at > existingUpdatedAt
  ) {
    return drop;
  }

  const existingPartsById = new Map(
    existingParts.flatMap((part) =>
      isRecord(part) && typeof part["part_id"] === "number"
        ? [[part["part_id"], part] as const]
        : []
    )
  );
  const parts = drop.parts.map((part) => {
    const existingPart = existingPartsById.get(part.part_id);
    if (
      !isRecord(existingPart) ||
      !Array.isArray(existingPart["attachments"])
    ) {
      return part;
    }

    const finalizedAttachments = existingPart["attachments"].filter(
      isFinalizedAttachment
    );
    if (finalizedAttachments.length === 0) {
      return part;
    }

    const finalizedById = new Map(
      finalizedAttachments.map((attachment) => [
        attachment.attachment_id,
        attachment,
      ])
    );
    const incomingIds = new Set(
      part.attachments.map((attachment) => attachment.attachment_id)
    );
    const attachments = part.attachments.map((attachment) => {
      const existingFinalized = finalizedById.get(attachment.attachment_id);
      // A terminal incoming record is authoritative (for example ready -> bad).
      if (!existingFinalized || isFinalizedAttachment(attachment)) {
        return attachment;
      }
      return existingFinalized;
    });

    for (const attachment of finalizedAttachments) {
      if (!incomingIds.has(attachment.attachment_id)) {
        attachments.push(attachment);
      }
    }

    return { ...part, attachments };
  });
  const changed = parts.some((part, index) => part !== drop.parts[index]);

  return changed ? { ...drop, parts } : drop;
}

interface DropReplacementOptions {
  readonly mergeWithExisting?: boolean;
  readonly preferExistingPollVote?: boolean;
}

function replaceMatchingDrop(
  value: Record<string, unknown>,
  drop: ApiDrop,
  options: DropReplacementOptions
): ApiDrop {
  const dropWithFinalizedAttachments = reconcileFinalizedDropAttachments(
    drop,
    value
  );
  const dropForReconciliation = options.mergeWithExisting
    ? ({ ...value, ...dropWithFinalizedAttachments } as ApiDrop)
    : dropWithFinalizedAttachments;
  const preferExistingPollVote = options.preferExistingPollVote;
  const reconciledDrop =
    preferExistingPollVote === undefined
      ? reconcileDropAuthenticatedPollVote(dropForReconciliation, value)
      : reconcileDropAuthenticatedPollVote(dropForReconciliation, value, {
          preferExistingVote: preferExistingPollVote,
        });

  return {
    ...reconciledDrop,
    ...(value["type"] !== undefined && { type: value["type"] }),
    ...(value["stableKey"] !== undefined && {
      stableKey: value["stableKey"],
    }),
    ...(value["stableHash"] !== undefined && {
      stableHash: value["stableHash"],
    }),
  };
}

function replaceDrop(
  value: unknown,
  drop: ApiDrop,
  options: DropReplacementOptions
): unknown {
  if (Array.isArray(value)) {
    const next = value.map((item) => replaceDrop(item, drop, options));
    const changed = next.some((item, index) => item !== value[index]);
    return changed ? next : value;
  }

  if (!isRecord(value)) {
    return value;
  }

  if (isMatchingDrop(value, drop.id)) {
    return replaceMatchingDrop(value, drop, options);
  }

  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const updated = replaceDrop(item, drop, options);
    next[key] = updated;
    if (updated !== item) {
      changed = true;
    }
  }

  return changed ? next : value;
}

const CACHED_DROP_QUERY_KEYS = [
  QueryKey.DROPS,
  QueryKey.DROPS_LEADERBOARD,
  QueryKey.DROP,
  QueryKey.WAVE_POLLS,
  QueryKey.PROFILE_DROPS,
  QueryKey.FEED_ITEMS,
] as const;

export function updateAttachmentInCachedDrops(
  queryClient: QueryClient,
  attachment: ApiAttachment
): void {
  CACHED_DROP_QUERY_KEYS.forEach((queryKey) => {
    queryClient.setQueriesData({ queryKey: [queryKey] }, (oldData) =>
      replaceAttachment(oldData, attachment)
    );
  });
}

export function updateDropInCachedDrops(
  queryClient: QueryClient,
  drop: ApiDrop,
  options: DropReplacementOptions = {}
): void {
  CACHED_DROP_QUERY_KEYS.forEach((queryKey) => {
    queryClient.setQueriesData({ queryKey: [queryKey] }, (oldData) =>
      replaceDrop(oldData, drop, options)
    );
  });
}
