import type { QueryClient } from "@tanstack/react-query";
import type { ApiAttachment } from "@/generated/models/ApiAttachment";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import type { ApiProfileMin } from "@/generated/models/ApiProfileMin";
import type { WebSocketStatus } from "@/services/websocket/WebSocketTypes";
import {
  getProtectedReactionIntent,
  recordReactionRealtimeReconciliation,
  type ProtectedReactionIntent,
} from "@/utils/monitoring/dropReactionMonitoring";
import { QueryKey } from "../ReactQueryWrapper";

export type CachedDropReactionState = Pick<
  ApiDrop,
  "context_profile_context" | "reactions"
>;

type ReconcileServerDropForDisplayParams = {
  readonly queryClient: QueryClient;
  readonly serverDrop: ApiDrop;
  readonly latestWaveDrop?: CachedDropReactionState | null;
  readonly cachedDropSnapshot?: CachedDropReactionState | null;
  readonly websocketStatus?: WebSocketStatus | string | null;
};

type UpdateServerDropInCachedDropsParams = Omit<
  ReconcileServerDropForDisplayParams,
  "queryClient"
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

function selectProtectedLocalDrop({
  cachedDropSnapshot,
  latestCachedDrop,
  latestWaveDrop,
  protectedIntent,
}: {
  readonly cachedDropSnapshot: CachedDropReactionState | null | undefined;
  readonly latestCachedDrop: CachedDropReactionState | null;
  readonly latestWaveDrop: CachedDropReactionState | null | undefined;
  readonly protectedIntent: ProtectedReactionIntent;
}): CachedDropReactionState | null {
  const localSources = [latestWaveDrop, latestCachedDrop, cachedDropSnapshot];
  const protectedLocalSource = localSources.find(
    (source) =>
      source !== null &&
      source !== undefined &&
      matchesProtectedReactionIntent(source, protectedIntent)
  );

  if (protectedLocalSource !== undefined) {
    return protectedLocalSource;
  }

  return latestWaveDrop ?? latestCachedDrop ?? cachedDropSnapshot ?? null;
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

function preserveProtectedReactionFields(
  serverDrop: ApiDrop,
  localDrop: CachedDropReactionState | null,
  protectedIntent: ProtectedReactionIntent
): ApiDrop {
  const serverContext = serverDrop.context_profile_context;
  const localContext = localDrop?.context_profile_context ?? null;
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
      localDrop?.reactions ?? [],
      protectedIntent
    ),
  };
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

export function reconcileServerDropForDisplay({
  cachedDropSnapshot,
  latestWaveDrop,
  queryClient,
  serverDrop,
  websocketStatus,
}: ReconcileServerDropForDisplayParams): ApiDrop {
  const protectedIntent = getProtectedReactionIntent(serverDrop.id);

  recordReactionRealtimeReconciliation({
    drop: {
      id: serverDrop.id,
      wave: { id: serverDrop.wave.id },
      context_profile_context: serverDrop.context_profile_context,
    },
    ...(websocketStatus !== undefined ? { websocketStatus } : {}),
    protectedIntent,
  });

  const serverReaction = serverDrop.context_profile_context?.reaction ?? null;
  if (protectedIntent === null || serverReaction === protectedIntent.reaction) {
    return serverDrop;
  }

  const latestCachedDrop = findDropInCachedDrops(queryClient, serverDrop.id);
  const localDrop = selectProtectedLocalDrop({
    cachedDropSnapshot,
    latestCachedDrop,
    latestWaveDrop,
    protectedIntent,
  });

  return preserveProtectedReactionFields(
    serverDrop,
    localDrop,
    protectedIntent
  );
}

export function updateServerDropInCachedDrops(
  queryClient: QueryClient,
  params: UpdateServerDropInCachedDropsParams
): ApiDrop {
  const displayDrop = reconcileServerDropForDisplay({
    ...params,
    queryClient,
  });

  updateDropInCachedDrops(queryClient, displayDrop);

  return displayDrop;
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
