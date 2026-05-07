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

type ServerDropForDisplay = Omit<ApiDrop, "reactions"> & {
  readonly reactions?: ApiDrop["reactions"];
};

type ReconcileServerDropForDisplayParams = {
  readonly queryClient: QueryClient;
  readonly serverDrop: ServerDropForDisplay;
  readonly requestProfileId?: string | null;
  readonly currentProfileId?: string | null;
  readonly activeProfileId?: string | null;
  readonly latestWaveDrop?: CachedDropReactionState | null;
  readonly cachedDropSnapshot?: CachedDropReactionState | null;
  readonly websocketStatus?: WebSocketStatus | string | null;
};

type UpdateServerDropInCachedDropsParams = Omit<
  ReconcileServerDropForDisplayParams,
  "queryClient"
>;

type DropWithoutWaveReactionState = Pick<
  ApiDrop,
  "context_profile_context" | "id"
> & {
  readonly reactions?: ApiDrop["reactions"];
};

type IdentifiedDropReactionState = CachedDropReactionState &
  Pick<ApiDrop, "id">;

type DropContextProfileContext = NonNullable<
  ApiDrop["context_profile_context"]
>;

type RollbackRejectedReactionParams = {
  readonly dropId: string;
  readonly failedReaction: string | null;
  readonly previousReaction: string | null;
  readonly profile: ApiProfileMin | null;
};

type SelectedProtectedReactionIntent = {
  readonly protectedIntent: ProtectedReactionIntent | null;
  readonly profileId: string | null;
  readonly source: "current" | "request" | "none";
};

type SelectedProtectedLocalDrop = {
  readonly drop: CachedDropReactionState | null;
  readonly matchesProtectedIntent: boolean;
};

type PreserveProtectedReactionFieldsOptions = {
  readonly allowServerContextProfileContext: boolean;
  readonly allowLocalContextProfileContext: boolean;
};

const EMPTY_CONTEXT_PROFILE_CONTEXT: DropContextProfileContext = {
  rating: 0,
  min_rating: 0,
  max_rating: 0,
  reaction: null,
  boosted: false,
  bookmarked: false,
  curatable: false,
  curated: false,
};

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
    const next: unknown[] = [];

    for (const item of value) {
      const updated = replaceAttachment(item, attachment);
      if (updated !== item) {
        changed = true;
      }
      next.push(updated);
    }

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

const CACHED_DROP_DISPLAY_FIELDS = ["type", "stableKey", "stableHash"] as const;

type CachedDropDisplayField = (typeof CACHED_DROP_DISPLAY_FIELDS)[number];

function replaceDropInArray(value: unknown[], drop: ApiDrop): unknown[] {
  let changed = false;
  const next: unknown[] = [];

  for (const item of value) {
    const updated = replaceDrop(item, drop);
    if (updated !== item) {
      changed = true;
    }
    next.push(updated);
  }

  return changed ? next : value;
}

function replaceDropInObjectChildren(
  value: Record<string, unknown>,
  drop: ApiDrop
): Record<string, unknown> {
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

function buildCachedDropReplacement(
  cachedDrop: Record<string, unknown>,
  drop: ApiDrop
): ApiDrop & Partial<Record<CachedDropDisplayField, unknown>> {
  const replacement: ApiDrop &
    Partial<Record<CachedDropDisplayField, unknown>> = { ...drop };

  for (const field of CACHED_DROP_DISPLAY_FIELDS) {
    const cachedValue = cachedDrop[field];
    if (cachedValue !== undefined) {
      replacement[field] = cachedValue;
    }
  }

  return replacement;
}

function replaceDrop(value: unknown, drop: ApiDrop): unknown {
  if (Array.isArray(value)) {
    return replaceDropInArray(value, drop);
  }

  if (!isRecord(value)) {
    return value;
  }

  if (isMatchingDrop(value, drop.id)) {
    return buildCachedDropReplacement(value, drop);
  }

  return replaceDropInObjectChildren(value, drop);
}

function removeProfileIdFromAllReactions(
  reactions: ApiDropReaction[],
  profileId: string | null
): ApiDropReaction[] {
  if (!profileId) {
    return reactions;
  }

  let changed = false;
  const nextReactions: ApiDropReaction[] = [];

  for (const reaction of reactions) {
    const profiles = reaction.profiles.filter(
      (profile) => profile.id !== profileId
    );
    if (profiles.length === reaction.profiles.length) {
      nextReactions.push(reaction);
      continue;
    }

    changed = true;
    if (profiles.length > 0) {
      nextReactions.push({
        ...reaction,
        profiles,
      });
    }
  }

  return changed ? nextReactions : reactions;
}

function removeProfileFromAllReactions(
  reactions: ApiDropReaction[],
  params: RollbackRejectedReactionParams
): ApiDropReaction[] {
  return removeProfileIdFromAllReactions(reactions, params.profile?.id ?? null);
}

function addProfileToPreviousReaction(
  reactions: ApiDropReaction[],
  params: RollbackRejectedReactionParams
): ApiDropReaction[] {
  if (params.previousReaction === null || params.profile === null) {
    return reactions;
  }

  const targetIndex = reactions.findIndex(
    (reaction) => reaction.reaction === params.previousReaction
  );

  if (targetIndex < 0) {
    return [
      ...reactions,
      {
        reaction: params.previousReaction,
        profiles: [params.profile],
      },
    ];
  }

  const target = reactions[targetIndex]!;
  if (target.profiles.some((profile) => profile.id === params.profile?.id)) {
    return reactions;
  }

  const nextReactions = [...reactions];
  nextReactions[targetIndex] = {
    ...target,
    profiles: [...target.profiles, params.profile],
  };

  return nextReactions;
}

function rollbackRejectedReactionEntries(
  reactions: ApiDropReaction[],
  params: RollbackRejectedReactionParams
): ApiDropReaction[] {
  return addProfileToPreviousReaction(
    removeProfileFromAllReactions(reactions, params),
    params
  );
}

function hasProfileInReaction(
  reactions: ApiDropReaction[],
  params: RollbackRejectedReactionParams
): boolean {
  const profileId = params.profile?.id ?? null;
  if (!profileId || params.failedReaction === null) {
    return false;
  }

  return reactions.some(
    (reaction) =>
      reaction.reaction === params.failedReaction &&
      reaction.profiles.some((profile) => profile.id === profileId)
  );
}

function hasProfileInAnyReaction(
  reactions: ApiDropReaction[],
  profileId: string
): boolean {
  return reactions.some((reaction) =>
    reaction.profiles.some((profile) => profile.id === profileId)
  );
}

function canRollbackRejectedReactionDrop(
  contextProfileContext: unknown,
  reactions: ApiDropReaction[],
  params: RollbackRejectedReactionParams
): boolean {
  if (isRecord(contextProfileContext)) {
    return contextProfileContext["reaction"] === params.failedReaction;
  }

  const profileId = params.profile?.id ?? null;
  if (params.failedReaction === null) {
    return (
      params.previousReaction !== null &&
      profileId !== null &&
      !hasProfileInAnyReaction(reactions, profileId)
    );
  }

  return hasProfileInReaction(reactions, params);
}

function rollbackContextProfileContext(
  contextProfileContext: unknown,
  previousReaction: string | null
): unknown {
  if (isRecord(contextProfileContext)) {
    if (contextProfileContext["reaction"] === previousReaction) {
      return contextProfileContext;
    }

    return {
      ...contextProfileContext,
      reaction: previousReaction,
    };
  }

  if (previousReaction === null) {
    return contextProfileContext;
  }

  return {
    ...EMPTY_CONTEXT_PROFILE_CONTEXT,
    reaction: previousReaction,
  };
}

function rollbackRejectedReactionDrop(
  value: Record<string, unknown>,
  params: RollbackRejectedReactionParams
): Record<string, unknown> {
  const contextProfileContext = value["context_profile_context"];
  const reactions = Array.isArray(value["reactions"])
    ? (value["reactions"] as ApiDropReaction[])
    : [];

  if (
    !canRollbackRejectedReactionDrop(contextProfileContext, reactions, params)
  ) {
    return value;
  }

  const nextContextProfileContext = rollbackContextProfileContext(
    contextProfileContext,
    params.previousReaction
  );
  const contextChanged = nextContextProfileContext !== contextProfileContext;

  const nextReactions = rollbackRejectedReactionEntries(reactions, params);
  const reactionsChanged = nextReactions !== reactions;

  if (!contextChanged && !reactionsChanged) {
    return value;
  }

  return {
    ...value,
    ...(contextChanged && {
      context_profile_context: nextContextProfileContext,
    }),
    ...(reactionsChanged && { reactions: nextReactions }),
  };
}

function rollbackRejectedReaction(
  value: unknown,
  params: RollbackRejectedReactionParams
): unknown {
  if (Array.isArray(value)) {
    let changed = false;
    const next: unknown[] = [];

    for (const item of value) {
      const updated = rollbackRejectedReaction(item, params);
      if (updated !== item) {
        changed = true;
      }
      next.push(updated);
    }

    return changed ? next : value;
  }

  if (!isRecord(value)) {
    return value;
  }

  if (isMatchingDrop(value, params.dropId)) {
    return rollbackRejectedReactionDrop(value, params);
  }

  let changed = false;
  const next: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(value)) {
    const updated = rollbackRejectedReaction(item, params);
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

function isProtectedIntentProfile(
  profile: ApiProfileMin | null | undefined,
  profileId: string
): profile is ApiProfileMin {
  return profile?.id === profileId;
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

function getServerDropReactions(
  serverDrop: Pick<ServerDropForDisplay, "reactions">
): ApiDropReaction[] | undefined {
  return Array.isArray(serverDrop.reactions) ? serverDrop.reactions : undefined;
}

function normalizeRequestProfileId({
  activeProfileId,
  requestProfileId,
}: {
  readonly activeProfileId: string | null | undefined;
  readonly requestProfileId: string | null | undefined;
}): string | null {
  return requestProfileId !== undefined
    ? requestProfileId
    : (activeProfileId ?? null);
}

function normalizeCurrentProfileId(
  {
    currentProfileId,
  }: { readonly currentProfileId: string | null | undefined },
  requestProfileId: string | null
): string | null {
  return currentProfileId !== undefined ? currentProfileId : requestProfileId;
}

function selectProtectedReactionIntent({
  allowRequestProfileFallback,
  currentProfileId,
  dropId,
  requestProfileId,
}: {
  readonly allowRequestProfileFallback: boolean;
  readonly currentProfileId: string | null;
  readonly dropId: string;
  readonly requestProfileId: string | null;
}): SelectedProtectedReactionIntent {
  const currentProfileIntent = getProtectedReactionIntent(
    dropId,
    currentProfileId
  );
  if (currentProfileIntent !== null) {
    return {
      protectedIntent: currentProfileIntent,
      profileId: currentProfileId,
      source: "current",
    };
  }

  if (allowRequestProfileFallback && requestProfileId !== currentProfileId) {
    const requestProfileIntent = getProtectedReactionIntent(
      dropId,
      requestProfileId
    );

    if (requestProfileIntent !== null) {
      return {
        protectedIntent: requestProfileIntent,
        profileId: requestProfileId,
        source: "request",
      };
    }
  }

  return {
    protectedIntent: null,
    profileId: currentProfileId,
    source: "none",
  };
}

function selectLocalDrop({
  cachedDropSnapshot,
  latestCachedDrops,
  latestWaveDrop,
}: {
  readonly cachedDropSnapshot: CachedDropReactionState | null | undefined;
  readonly latestCachedDrops: readonly CachedDropReactionState[];
  readonly latestWaveDrop: CachedDropReactionState | null | undefined;
}): CachedDropReactionState | null {
  return latestWaveDrop ?? latestCachedDrops[0] ?? cachedDropSnapshot ?? null;
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
}): SelectedProtectedLocalDrop {
  const protectedLatestWaveDrop =
    latestWaveDrop !== null &&
    latestWaveDrop !== undefined &&
    matchesProtectedReactionIntent(latestWaveDrop, protectedIntent)
      ? latestWaveDrop
      : undefined;

  if (protectedLatestWaveDrop !== undefined) {
    return {
      drop: protectedLatestWaveDrop,
      matchesProtectedIntent: true,
    };
  }

  const protectedCachedDrop = latestCachedDrops.find((source) =>
    matchesProtectedReactionIntent(source, protectedIntent)
  );

  if (protectedCachedDrop !== undefined) {
    return {
      drop: protectedCachedDrop,
      matchesProtectedIntent: true,
    };
  }

  const protectedSnapshot =
    cachedDropSnapshot !== null &&
    cachedDropSnapshot !== undefined &&
    matchesProtectedReactionIntent(cachedDropSnapshot, protectedIntent)
      ? cachedDropSnapshot
      : undefined;

  if (protectedSnapshot !== undefined) {
    return {
      drop: protectedSnapshot,
      matchesProtectedIntent: true,
    };
  }

  return {
    drop: latestWaveDrop ?? latestCachedDrops[0] ?? cachedDropSnapshot ?? null,
    matchesProtectedIntent: false,
  };
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
    findReactionProfile(localReactions, profileId) ??
    removedServerProfile ??
    (isProtectedIntentProfile(protectedIntent.profile, profileId)
      ? protectedIntent.profile
      : null);
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
  serverDrop: ServerDropForDisplay,
  localDrop: CachedDropReactionState | null,
  protectedIntent: ProtectedReactionIntent,
  options: PreserveProtectedReactionFieldsOptions
): ApiDrop {
  const serverReactions = getServerDropReactions(serverDrop);
  const baseReactions = serverReactions ?? localDrop?.reactions ?? [];
  const serverContext = options.allowServerContextProfileContext
    ? serverDrop.context_profile_context
    : null;
  const localContext = options.allowLocalContextProfileContext
    ? (localDrop?.context_profile_context ?? null)
    : null;
  const contextSource =
    serverContext ??
    localContext ??
    (protectedIntent.reaction !== null ? EMPTY_CONTEXT_PROFILE_CONTEXT : null);

  return {
    ...serverDrop,
    context_profile_context: contextSource
      ? {
          ...contextSource,
          reaction: protectedIntent.reaction,
        }
      : null,
    reactions: mergeProtectedReactionProfiles(
      baseReactions,
      localDrop?.reactions ?? [],
      protectedIntent
    ),
  };
}

function removeStaleRequestProfileFromCachedReactions({
  dropId,
  reactions,
  serverContextReaction,
  requestProfileId,
}: {
  readonly dropId: string;
  readonly reactions: ApiDropReaction[];
  readonly serverContextReaction: string | null;
  readonly requestProfileId: string | null;
}): ApiDropReaction[] {
  const requestProfileIntent = getProtectedReactionIntent(
    dropId,
    requestProfileId
  );

  if (requestProfileIntent === null) {
    return reactions;
  }

  if (
    requestProfileIntent.reaction !== null &&
    requestProfileIntent.reaction === serverContextReaction
  ) {
    return mergeProtectedReactionProfiles(
      reactions,
      reactions,
      requestProfileIntent
    );
  }

  return removeProfileIdFromAllReactions(
    reactions,
    requestProfileIntent.profileId
  );
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

export function rollbackRejectedReactionInCachedDrops(
  queryClient: QueryClient,
  params: RollbackRejectedReactionParams
): void {
  CACHED_DROP_QUERY_KEYS.forEach((queryKey) => {
    queryClient.setQueriesData({ queryKey: [queryKey] }, (oldData) =>
      rollbackRejectedReaction(oldData, params)
    );
  });
}

export function reconcileServerDropForDisplay({
  activeProfileId,
  cachedDropSnapshot,
  currentProfileId: currentProfileIdInput,
  latestWaveDrop,
  queryClient,
  requestProfileId: requestProfileIdInput,
  serverDrop,
  websocketStatus,
}: ReconcileServerDropForDisplayParams): ApiDrop {
  const requestProfileId = normalizeRequestProfileId({
    activeProfileId,
    requestProfileId: requestProfileIdInput,
  });
  const currentProfileId = normalizeCurrentProfileId(
    { currentProfileId: currentProfileIdInput },
    requestProfileId
  );
  const serverReactions = getServerDropReactions(serverDrop);
  const {
    profileId: reconciliationProfileId,
    protectedIntent,
    source: protectedIntentSource,
  } = selectProtectedReactionIntent({
    allowRequestProfileFallback: serverReactions !== undefined,
    currentProfileId,
    dropId: serverDrop.id,
    requestProfileId,
  });

  recordReactionRealtimeReconciliation({
    drop: {
      id: serverDrop.id,
      wave: { id: serverDrop.wave.id },
      context_profile_context: serverDrop.context_profile_context,
    },
    activeProfileId: reconciliationProfileId,
    ...(websocketStatus !== undefined ? { websocketStatus } : {}),
    protectedIntent,
  });

  const serverReaction = serverDrop.context_profile_context?.reaction ?? null;
  const isSameProfileResponse = requestProfileId === currentProfileId;
  if (protectedIntent === null) {
    if (serverReactions !== undefined) {
      return serverDrop as ApiDrop;
    }

    const latestCachedDrops = findDropsInCachedDrops(
      queryClient,
      serverDrop.id
    );
    const localDrop = selectLocalDrop({
      cachedDropSnapshot,
      latestCachedDrops,
      latestWaveDrop,
    });
    const fallbackReactions = localDrop?.reactions ?? [];

    return {
      ...serverDrop,
      reactions: isSameProfileResponse
        ? fallbackReactions
        : removeStaleRequestProfileFromCachedReactions({
            dropId: serverDrop.id,
            reactions: fallbackReactions,
            serverContextReaction: serverReaction,
            requestProfileId,
          }),
    };
  }

  const serverContextMatchesProtectedIntent =
    serverReaction === protectedIntent.reaction;
  const allowServerContextProfileContext =
    isSameProfileResponse ||
    (protectedIntentSource === "request" &&
      serverContextMatchesProtectedIntent);

  if (
    allowServerContextProfileContext &&
    serverContextMatchesProtectedIntent &&
    serverReactions !== undefined &&
    serverReactionsMatchProtectedIntent(serverReactions, protectedIntent)
  ) {
    return serverDrop as ApiDrop;
  }

  const latestCachedDrops = findDropsInCachedDrops(queryClient, serverDrop.id);
  const selectedLocalDrop = selectProtectedLocalDrop({
    cachedDropSnapshot,
    latestCachedDrops,
    latestWaveDrop,
    protectedIntent,
  });

  return preserveProtectedReactionFields(
    serverDrop,
    selectedLocalDrop.drop,
    protectedIntent,
    {
      allowServerContextProfileContext,
      allowLocalContextProfileContext:
        isSameProfileResponse || selectedLocalDrop.matchesProtectedIntent,
    }
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
  activeProfileId,
  currentProfileId,
  latestWaveDrops,
  queryClient,
  requestProfileId,
  serverDrops,
  websocketStatus,
}: {
  readonly activeProfileId?: string | null;
  readonly requestProfileId?: string | null;
  readonly currentProfileId?: string | null;
  readonly latestWaveDrops?: readonly IdentifiedDropReactionState[];
  readonly queryClient: QueryClient;
  readonly serverDrops: readonly ServerDropForDisplay[];
  readonly websocketStatus?: WebSocketStatus | string | null;
}): ApiDrop[] {
  const profileParams = {
    ...(activeProfileId !== undefined ? { activeProfileId } : {}),
    ...(requestProfileId !== undefined ? { requestProfileId } : {}),
    ...(currentProfileId !== undefined ? { currentProfileId } : {}),
  };

  return serverDrops.map((serverDrop) =>
    reconcileServerDropForDisplay({
      ...profileParams,
      queryClient,
      serverDrop,
      latestWaveDrop:
        latestWaveDrops?.find((drop) => drop.id === serverDrop.id) ?? null,
      ...(websocketStatus !== undefined ? { websocketStatus } : {}),
    })
  );
}

export function reconcileDropsWithoutWaveForDisplay<
  TDrop extends DropWithoutWaveReactionState,
>({
  activeProfileId,
  currentProfileId,
  queryClient,
  requestProfileId,
  serverDrops,
  wave,
  websocketStatus,
}: {
  readonly activeProfileId?: string | null;
  readonly requestProfileId?: string | null;
  readonly currentProfileId?: string | null;
  readonly queryClient: QueryClient;
  readonly serverDrops: readonly TDrop[];
  readonly wave: ApiDrop["wave"];
  readonly websocketStatus?: WebSocketStatus | string | null;
}): TDrop[] {
  const profileParams = {
    ...(activeProfileId !== undefined ? { activeProfileId } : {}),
    ...(requestProfileId !== undefined ? { requestProfileId } : {}),
    ...(currentProfileId !== undefined ? { currentProfileId } : {}),
  };

  return serverDrops.map((drop) => {
    const serverDrop = { ...drop, wave } as ServerDropForDisplay & TDrop;
    const displayDrop = reconcileServerDropForDisplay({
      ...profileParams,
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
