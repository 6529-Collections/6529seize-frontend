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

type DropWithoutWaveReactionState = CachedDropReactionState &
  Pick<ApiDrop, "id">;

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

function findDrops(
  value: unknown,
  dropId: string,
  drops: CachedDropReactionState[]
): void {
  if (Array.isArray(value)) {
    for (const item of value) {
      findDrops(item, dropId, drops);
    }

    return;
  }

  if (!isRecord(value)) {
    return;
  }

  if (isMatchingDrop(value, dropId)) {
    drops.push(toCachedDropReactionState(value));
  }

  for (const item of Object.values(value)) {
    findDrops(item, dropId, drops);
  }
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

function serverReactionsMatchProtectedIntent(
  reactions: ApiDropReaction[],
  protectedIntent: ProtectedReactionIntent
): boolean {
  const profileId = protectedIntent.profileId;
  if (!profileId) {
    return true;
  }

  let matchingProfiles = 0;
  for (const entry of reactions) {
    for (const profile of entry.profiles) {
      if (profile.id !== profileId) {
        continue;
      }

      if (
        protectedIntent.reaction === null ||
        entry.reaction !== protectedIntent.reaction
      ) {
        return false;
      }

      matchingProfiles += 1;
      if (matchingProfiles > 1) {
        return false;
      }
    }
  }

  return protectedIntent.reaction === null ? true : matchingProfiles === 1;
}

function selectProtectedLocalDrop({
  cachedDropSnapshot,
  latestCachedDrops,
  latestWaveDrop,
  protectedIntent,
}: {
  readonly cachedDropSnapshot: CachedDropReactionState | null | undefined;
  readonly latestCachedDrops: readonly CachedDropReactionState[];
  readonly latestWaveDrop: CachedDropReactionState | null | undefined;
  readonly protectedIntent: ProtectedReactionIntent;
}): CachedDropReactionState | null {
  const protectedLatestWaveDrop =
    latestWaveDrop !== null &&
    latestWaveDrop !== undefined &&
    matchesProtectedReactionIntent(latestWaveDrop, protectedIntent)
      ? latestWaveDrop
      : undefined;

  if (protectedLatestWaveDrop !== undefined) {
    return protectedLatestWaveDrop;
  }

  const protectedCachedDrop = latestCachedDrops.find((source) =>
    matchesProtectedReactionIntent(source, protectedIntent)
  );

  if (protectedCachedDrop !== undefined) {
    return protectedCachedDrop;
  }

  const protectedSnapshot =
    cachedDropSnapshot !== null &&
    cachedDropSnapshot !== undefined &&
    matchesProtectedReactionIntent(cachedDropSnapshot, protectedIntent)
      ? cachedDropSnapshot
      : undefined;

  if (protectedSnapshot !== undefined) {
    return protectedSnapshot;
  }

  return latestWaveDrop ?? latestCachedDrops[0] ?? cachedDropSnapshot ?? null;
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

  let removedServerProfile: ApiProfileMin | null = null;
  const mergedReactions = serverReactions.reduce<ApiDropReaction[]>(
    (entries, entry) => {
      const profiles = entry.profiles.filter((profile) => {
        if (profile.id !== profileId) {
          return true;
        }

        removedServerProfile ??= profile;

        return false;
      });

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

  const protectedProfile =
    findReactionProfile(localReactions, profileId) ?? removedServerProfile;
  if (!protectedProfile) {
    return mergedReactions;
  }

  const targetIndex = mergedReactions.findIndex(
    (entry) => entry.reaction === protectedIntent.reaction
  );

  if (targetIndex >= 0) {
    const target = mergedReactions[targetIndex]!;
    mergedReactions[targetIndex] = {
      ...target,
      profiles: [...target.profiles, protectedProfile],
    };
    return mergedReactions;
  }

  return [
    ...mergedReactions,
    {
      reaction: protectedIntent.reaction,
      profiles: [protectedProfile],
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
  if (protectedIntent === null) {
    return serverDrop;
  }

  if (
    serverReaction === protectedIntent.reaction &&
    serverReactionsMatchProtectedIntent(serverDrop.reactions, protectedIntent)
  ) {
    return serverDrop;
  }

  const latestCachedDrops = findDropsInCachedDrops(queryClient, serverDrop.id);
  const localDrop = selectProtectedLocalDrop({
    cachedDropSnapshot,
    latestCachedDrops,
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

export function reconcileServerDropsForDisplay({
  queryClient,
  serverDrops,
  websocketStatus,
}: {
  readonly queryClient: QueryClient;
  readonly serverDrops: readonly ApiDrop[];
  readonly websocketStatus?: WebSocketStatus | string | null;
}): ApiDrop[] {
  return serverDrops.map((serverDrop) =>
    reconcileServerDropForDisplay({
      queryClient,
      serverDrop,
      ...(websocketStatus !== undefined ? { websocketStatus } : {}),
    })
  );
}

export function reconcileDropsWithoutWaveForDisplay<
  TDrop extends DropWithoutWaveReactionState,
>({
  queryClient,
  serverDrops,
  wave,
  websocketStatus,
}: {
  readonly queryClient: QueryClient;
  readonly serverDrops: readonly TDrop[];
  readonly wave: ApiDrop["wave"];
  readonly websocketStatus?: WebSocketStatus | string | null;
}): TDrop[] {
  return serverDrops.map((drop) => {
    const serverDrop = { ...drop, wave } as ApiDrop & TDrop;
    const displayDrop = reconcileServerDropForDisplay({
      queryClient,
      serverDrop,
      ...(websocketStatus !== undefined ? { websocketStatus } : {}),
    });
    return {
      ...drop,
      context_profile_context: displayDrop.context_profile_context,
      reactions: displayDrop.reactions,
    } as TDrop;
  });
}

function findDropsInCachedDrops(
  queryClient: QueryClient,
  dropId: string
): CachedDropReactionState[] {
  const drops: CachedDropReactionState[] = [];

  for (const queryKey of CACHED_DROP_QUERY_KEYS) {
    const cachedQueries = queryClient.getQueriesData({
      queryKey: [queryKey],
    });

    for (const [, data] of cachedQueries) {
      findDrops(data, dropId, drops);
    }
  }

  return drops;
}

export function findDropInCachedDrops(
  queryClient: QueryClient,
  dropId: string
): CachedDropReactionState | null {
  return findDropsInCachedDrops(queryClient, dropId)[0] ?? null;
}
