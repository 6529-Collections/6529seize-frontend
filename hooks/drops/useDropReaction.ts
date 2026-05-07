"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey as AppQueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { rollbackRejectedReactionInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import type { ApiAddReactionToDropRequest } from "@/generated/models/ApiAddReactionToDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import { recordReaction } from "@/helpers/reactions/reactionHistory";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { COMMUNITY_CURATIONS_DROPS_QUERY_KEY } from "@/hooks/useCommunityCurationsDrops";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import { useWebsocketStatus } from "@/services/websocket/useWebSocketMessage";
import type { InfiniteData } from "@tanstack/react-query";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef } from "react";
import {
  cloneReactionEntries,
  findReactionIndex,
  getReactionErrorMessage,
  getReactionProfileId,
  removeUserFromReactions,
  toProfileMin,
} from "@/components/waves/drops/reaction-utils";
import {
  beginReactionMutation,
  deriveReactionAction,
  isLatestReactionMutation,
  recordReactionOptimisticApplied,
  recordReactionRequestFailed,
  recordReactionRequestSent,
  recordReactionRequestSucceeded,
  recordReactionRollbackApplied,
  type ReactionSource,
} from "@/utils/monitoring/dropReactionMonitoring";

interface UseDropReactionResult {
  readonly react: (reactionCode: string) => Promise<void>;
  readonly canReact: boolean;
}

interface UseDropReactionOptions {
  readonly source?: ReactionSource | undefined;
  readonly onSuccess?: (() => void) | undefined;
  readonly updateCurationCache?: boolean | undefined;
}

type OptimisticRollback = (() => void) | null;

type ReactionCacheDrop = {
  readonly id: string;
  readonly reactions: readonly ApiDropReaction[];
  readonly context_profile_context?: ApiDropContextProfileContext | null;
};

type ReactionCachePage = {
  readonly data: readonly ReactionCacheDrop[];
};

type ReactionCacheData = InfiniteData<ReactionCachePage>;

const EMPTY_CONTEXT_PROFILE_CONTEXT: ApiDropContextProfileContext = {
  rating: 0,
  min_rating: 0,
  max_rating: 0,
  reaction: null,
  boosted: false,
  bookmarked: false,
  curatable: false,
  curated: false,
};

const combineRollbacks = (
  rollbacks: readonly OptimisticRollback[]
): OptimisticRollback => {
  const activeRollbacks = rollbacks.filter(
    (rollback): rollback is () => void => rollback !== null
  );

  if (activeRollbacks.length === 0) {
    return null;
  }

  return () => {
    for (const rollback of activeRollbacks) {
      rollback();
    }
  };
};

const isReactionCacheDrop = (value: unknown): value is ReactionCacheDrop => {
  if (value === null || typeof value !== "object") {
    return false;
  }

  const candidate = value as {
    readonly id?: unknown;
    readonly reactions?: unknown;
  };

  return typeof candidate.id === "string" && Array.isArray(candidate.reactions);
};

const isReactionCacheData = (data: unknown): data is ReactionCacheData => {
  if (data === null || typeof data !== "object") {
    return false;
  }

  const pages = (data as { readonly pages?: unknown }).pages;
  if (!Array.isArray(pages)) {
    return false;
  }

  return pages.every((page) => {
    if (page === null || typeof page !== "object") {
      return false;
    }

    const pageData = (page as { readonly data?: unknown }).data;
    return Array.isArray(pageData) && pageData.every(isReactionCacheDrop);
  });
};

const isReactionCurationQueryKey = (queryKey: readonly unknown[]): boolean => {
  if (queryKey[0] === COMMUNITY_CURATIONS_DROPS_QUERY_KEY) {
    return true;
  }

  if (queryKey[0] !== AppQueryKey.DROPS) {
    return false;
  }

  const params = queryKey[1];
  return (
    params !== null &&
    typeof params === "object" &&
    (params as { readonly context?: unknown }).context === "wave-curation-drops"
  );
};

const applyReactionToCacheDrop = ({
  baseContext,
  drop,
  profileMin,
  reactionCode,
}: {
  readonly baseContext: ApiDropContextProfileContext | null | undefined;
  readonly drop: ReactionCacheDrop;
  readonly profileMin: ReturnType<typeof toProfileMin>;
  readonly reactionCode: string | null;
}): ReactionCacheDrop => {
  if (!profileMin) {
    return drop;
  }

  const reactionsWithoutUser = removeUserFromReactions(
    cloneReactionEntries(drop.reactions),
    profileMin.id
  );

  if (reactionCode !== null) {
    const targetIndex = findReactionIndex(reactionsWithoutUser, reactionCode);

    if (targetIndex >= 0) {
      const target = reactionsWithoutUser[targetIndex]!;
      reactionsWithoutUser[targetIndex] = {
        ...target,
        profiles: [...target.profiles, profileMin],
      };
    } else {
      reactionsWithoutUser.push({
        reaction: reactionCode,
        profiles: [profileMin],
      });
    }
  }

  return {
    ...drop,
    reactions: reactionsWithoutUser,
    context_profile_context: {
      ...(drop.context_profile_context ??
        baseContext ??
        EMPTY_CONTEXT_PROFILE_CONTEXT),
      reaction: reactionCode,
    },
  };
};

const updateReactionCacheData = ({
  baseContext,
  data,
  dropId,
  profileMin,
  reactionCode,
}: {
  readonly baseContext: ApiDropContextProfileContext | null | undefined;
  readonly data: unknown;
  readonly dropId: string;
  readonly profileMin: ReturnType<typeof toProfileMin>;
  readonly reactionCode: string | null;
}): unknown => {
  if (!isReactionCacheData(data)) {
    return data;
  }

  let changed = false;
  const pages: ReactionCachePage[] = [];

  for (const page of data.pages) {
    let pageChanged = false;
    const nextData: ReactionCacheDrop[] = [];

    for (const cacheDrop of page.data) {
      if (cacheDrop.id !== dropId) {
        nextData.push(cacheDrop);
        continue;
      }

      changed = true;
      pageChanged = true;
      nextData.push(
        applyReactionToCacheDrop({
          baseContext,
          drop: cacheDrop,
          profileMin,
          reactionCode,
        })
      );
    }

    pages.push(pageChanged ? { ...page, data: nextData } : page);
  }

  return changed ? { ...data, pages } : data;
};

const useOptimisticStreamDropReaction = ({
  applyOptimisticDropUpdate,
  connectedProfile,
  contextProfileContext,
  dropId,
  waveId,
}: {
  readonly applyOptimisticDropUpdate: ReturnType<
    typeof useMyStream
  >["applyOptimisticDropUpdate"];
  readonly connectedProfile: ReturnType<typeof useAuth>["connectedProfile"];
  readonly contextProfileContext:
    | ApiDropContextProfileContext
    | null
    | undefined;
  readonly dropId: string;
  readonly waveId: string;
}) =>
  useCallback(
    (reactionCode: string | null) => {
      const profileMin = toProfileMin(connectedProfile);
      if (!profileMin) {
        return null;
      }

      const handle = applyOptimisticDropUpdate({
        waveId,
        dropId,
        update: (draft) => {
          if (draft.type !== DropSize.FULL) {
            return draft;
          }

          const nextDrop = applyReactionToCacheDrop({
            baseContext: contextProfileContext,
            drop: draft,
            profileMin,
            reactionCode,
          });
          draft.reactions = [...nextDrop.reactions];
          draft.context_profile_context =
            nextDrop.context_profile_context ?? EMPTY_CONTEXT_PROFILE_CONTEXT;

          return draft;
        },
      });

      return handle?.rollback ?? null;
    },
    [
      applyOptimisticDropUpdate,
      connectedProfile,
      contextProfileContext,
      dropId,
      waveId,
    ]
  );

const useOptimisticCurationDropReaction = ({
  connectedProfile,
  contextProfileContext,
  dropId,
  enabled,
}: {
  readonly connectedProfile: ReturnType<typeof useAuth>["connectedProfile"];
  readonly contextProfileContext:
    | ApiDropContextProfileContext
    | null
    | undefined;
  readonly dropId: string;
  readonly enabled: boolean;
}) => {
  const queryClient = useQueryClient();

  return useCallback(
    (reactionCode: string | null): OptimisticRollback => {
      if (!enabled) {
        return null;
      }

      const profileMin = toProfileMin(connectedProfile);
      if (!profileMin) {
        return null;
      }

      const matchingQueries = queryClient.getQueryCache().findAll({
        predicate: (query) => isReactionCurationQueryKey(query.queryKey),
      });

      if (matchingQueries.length === 0) {
        return null;
      }

      const snapshots: Array<{
        readonly queryKey: (typeof matchingQueries)[number]["queryKey"];
        readonly data: unknown;
      }> = [];

      for (const query of matchingQueries) {
        const currentData = query.state.data;
        const nextData = updateReactionCacheData({
          baseContext: contextProfileContext,
          data: currentData,
          dropId,
          profileMin,
          reactionCode,
        });

        if (nextData === currentData) {
          continue;
        }

        snapshots.push({
          queryKey: query.queryKey,
          data: currentData,
        });
        queryClient.setQueryData(query.queryKey, nextData);
      }

      if (snapshots.length === 0) {
        return null;
      }

      return () => {
        for (const snapshot of snapshots) {
          queryClient.setQueryData(snapshot.queryKey, snapshot.data);
        }
      };
    },
    [connectedProfile, contextProfileContext, dropId, enabled, queryClient]
  );
};

export function useDropReaction(
  drop: ExtendedDrop,
  options?: UseDropReactionOptions
): UseDropReactionResult {
  const { setToast, connectedProfile } = useAuth();
  const { applyOptimisticDropUpdate } = useMyStream();
  const queryClient = useQueryClient();
  const websocketStatus = useWebsocketStatus();
  const rollbackRef = useRef<(() => void) | null>(null);
  const source = options?.source ?? "picker";
  const onSuccess = options?.onSuccess;
  const updateCurationCache = options?.updateCurationCache ?? false;

  const canReact = !drop.id.startsWith("temp-");

  const waveId = drop.wave.id;
  const dropId = drop.id;
  const contextProfileContext = drop.context_profile_context;
  const applyOptimisticReaction = useOptimisticStreamDropReaction({
    applyOptimisticDropUpdate,
    connectedProfile,
    contextProfileContext,
    dropId,
    waveId,
  });
  const applyOptimisticReactionToCurationQueries =
    useOptimisticCurationDropReaction({
      connectedProfile,
      contextProfileContext,
      dropId,
      enabled: updateCurationCache,
    });

  const react = useCallback(
    async (reactionCode: string) => {
      if (!canReact) return;

      const previousReaction = contextProfileContext?.reaction ?? null;
      const isRemoving = reactionCode === previousReaction;
      const intendedReaction = isRemoving ? null : reactionCode;
      const rollbackProfile = toProfileMin(connectedProfile);
      const profileId = getReactionProfileId(connectedProfile);
      const mutation = beginReactionMutation({
        dropId,
        waveId,
        source,
        action: deriveReactionAction(previousReaction, intendedReaction),
        previousReaction,
        intendedReaction,
        optimisticReaction: intendedReaction,
        profileId,
        profile: rollbackProfile,
        websocketStatus,
      });

      rollbackRef.current?.();
      rollbackRef.current = combineRollbacks([
        applyOptimisticReaction(intendedReaction),
        applyOptimisticReactionToCurationQueries(intendedReaction),
      ]);
      recordReactionOptimisticApplied(mutation);

      if (!isRemoving) {
        recordReaction(reactionCode);
      }

      let succeeded = false;

      try {
        const endpoint = `drops/${drop.id}/reaction`;
        if (isRemoving) {
          recordReactionRequestSent(mutation, {
            endpoint,
            method: "DELETE",
          });
          await commonApiDelete({
            endpoint,
            errorMode: "structured",
          });
        } else {
          recordReactionRequestSent(mutation, {
            endpoint,
            method: "POST",
          });
          await commonApiPost<ApiAddReactionToDropRequest, ApiDrop>({
            endpoint,
            body: { reaction: reactionCode },
            errorMode: "structured",
          });
        }
        recordReactionRequestSucceeded(mutation);
        rollbackRef.current = null;
        succeeded = true;
      } catch (error) {
        recordReactionRequestFailed(mutation, error);
        const errorMessage = getReactionErrorMessage(
          error,
          isRemoving ? "Error removing reaction" : "Error adding reaction"
        );
        setToast({ message: errorMessage, type: "error" });
        rollbackRef.current?.();
        if (isLatestReactionMutation(mutation)) {
          rollbackRejectedReactionInCachedDrops(queryClient, {
            dropId,
            failedReaction: intendedReaction,
            previousReaction,
            profile: rollbackProfile,
          });
        }
        recordReactionRollbackApplied(mutation);
        rollbackRef.current = null;
      }

      if (succeeded) {
        try {
          onSuccess?.();
        } catch {
          // Ignore consumer callback errors so a successful request stays successful.
        }
      }
    },
    [
      canReact,
      applyOptimisticReaction,
      applyOptimisticReactionToCurationQueries,
      connectedProfile,
      contextProfileContext?.reaction,
      drop.id,
      dropId,
      queryClient,
      setToast,
      onSuccess,
      source,
      waveId,
      websocketStatus,
    ]
  );

  return { react, canReact };
}
