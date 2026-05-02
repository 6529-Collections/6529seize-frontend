import type { QueryClient } from "@tanstack/react-query";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { QueryKey } from "../ReactQueryWrapper";

export type CachedDropReactionState = Pick<
  ApiDrop,
  "context_profile_context" | "reactions"
>;

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
    let changed = false;
    const next = value.map((item) => {
      const updated = replaceAttachment(item, attachment);
      if (updated !== item) {
        changed = true;
      }
      return updated;
    });
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

function replaceDrop(value: unknown, drop: ApiDrop): unknown {
  if (Array.isArray(value)) {
    let changed = false;
    const next = value.map((item) => {
      const updated = replaceDrop(item, drop);
      if (updated !== item) {
        changed = true;
      }
      return updated;
    });
    return changed ? next : value;
  }

  if (!isRecord(value)) {
    return value;
  }

  if (isMatchingDrop(value, drop.id)) {
    return {
      ...drop,
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
    const updated = replaceDrop(item, drop);
    next[key] = updated;
    if (updated !== item) {
      changed = true;
    }
  }

  return changed ? next : value;
}

function toCachedDropReactionState(
  value: Record<string, unknown>
): CachedDropReactionState {
  const contextProfileContext = value["context_profile_context"];

  return {
    context_profile_context:
      contextProfileContext === undefined
        ? null
        : (contextProfileContext as ApiDrop["context_profile_context"]),
    reactions: Array.isArray(value["reactions"])
      ? (value["reactions"] as ApiDrop["reactions"])
      : [],
  };
}

function findDrop(
  value: unknown,
  dropId: string
): CachedDropReactionState | null {
  if (Array.isArray(value)) {
    for (const item of value) {
      const drop = findDrop(item, dropId);
      if (drop !== null) {
        return drop;
      }
    }

    return null;
  }

  if (!isRecord(value)) {
    return null;
  }

  if (isMatchingDrop(value, dropId)) {
    return toCachedDropReactionState(value);
  }

  for (const item of Object.values(value)) {
    const drop = findDrop(item, dropId);
    if (drop !== null) {
      return drop;
    }
  }

  return null;
}

const CACHED_DROP_QUERY_KEYS = [
  QueryKey.DROPS,
  QueryKey.DROPS_LEADERBOARD,
  QueryKey.DROP,
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
  drop: ApiDrop
): void {
  CACHED_DROP_QUERY_KEYS.forEach((queryKey) => {
    queryClient.setQueriesData({ queryKey: [queryKey] }, (oldData) =>
      replaceDrop(oldData, drop)
    );
  });
}

export function findDropInCachedDrops(
  queryClient: QueryClient,
  dropId: string
): CachedDropReactionState | null {
  for (const queryKey of CACHED_DROP_QUERY_KEYS) {
    const cachedQueries = queryClient.getQueriesData({
      queryKey: [queryKey],
    });

    for (const [, data] of cachedQueries) {
      const drop = findDrop(data, dropId);
      if (drop !== null) {
        return drop;
      }
    }
  }

  return null;
}
