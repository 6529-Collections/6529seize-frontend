import type { QueryClient } from "@tanstack/react-query";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { reconcileDropAuthenticatedPollVote } from "@/helpers/waves/poll-vote-reconciliation";
import { QueryKey } from "../ReactQueryWrapper";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isMatchingAttachment(
  value: Record<string, unknown>,
  attachmentId: string
): boolean {
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
    return attachment;
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

interface DropReplacementOptions {
  readonly mergeWithExisting?: boolean;
  readonly preferExistingPollVote?: boolean;
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
    const dropForReconciliation = options.mergeWithExisting
      ? ({ ...value, ...drop } as ApiDrop)
      : drop;
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
