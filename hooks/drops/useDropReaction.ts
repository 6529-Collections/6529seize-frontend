"use client";

import { useAuth } from "@/components/auth/Auth";
import { QueryKey as AppQueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import { useMyStreamActions } from "@/contexts/wave/MyStreamContext";
import { useWaveEligibility } from "@/contexts/wave/WaveEligibilityContext";
import type { ApiDropReaction } from "@/generated/models/ApiDropReaction";
import { ChatRestriction } from "@/hooks/useDropPriviledges";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import { recordReaction } from "@/helpers/reactions/reactionHistory";
import { enqueueDropReactionRequest } from "@/helpers/reactions/dropReactionRequestQueue";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { COMMUNITY_CURATIONS_DROPS_QUERY_KEY } from "@/hooks/useCommunityCurationsDrops";
import {
  useCanonicalNotificationDropUpdate,
  useOptimisticNotificationDropReaction,
} from "@/hooks/drops/useOptimisticNotificationDropReaction";
import {
  applyOptimisticReactionQueryCacheUpdate,
  EMPTY_DROP_CONTEXT_PROFILE_CONTEXT,
} from "@/hooks/drops/optimisticReactionQueryCache";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { sendDropReaction } from "@/services/api/signed-drop-writes";
import { isSignedWriteCancelled } from "@/lib/device-signing/signing-decision";
import { useWebsocketStatus } from "@/services/websocket/useWebSocketMessage";
import type { InfiniteData } from "@tanstack/react-query";
import { useDropReactionRecovery } from "@/hooks/drops/useDropReactionRecovery";
import { t } from "@/i18n/messages";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useRef, type RefObject } from "react";
import {
  applyProfileReactionToEntries,
  cloneReactionEntries,
  getReactionErrorMessage,
  toProfileMin,
} from "@/components/waves/drops/reaction-utils";
import {
  beginReactionMutation,
  deriveReactionAction,
  recordReactionOptimisticApplied,
  recordReactionRequestFailed,
  recordReactionRequestSent,
  recordReactionRequestSucceeded,
  recordReactionRollbackApplied,
  type ReactionSource,
} from "@/utils/monitoring/dropReactionMonitoring";
import {
  isExpectedWaveReactionDisabledError,
  isReactionRequestOutcomeUncertain,
} from "@/utils/monitoring/dropReactionErrorClassification";
import {
  getDropReactionAuthStateFingerprint,
  isDropReactionAuthRecoveryPending,
  useDropReactionAuthRecovery,
} from "@/hooks/drops/useDropReactionAuthRecovery";

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
type OwnedOptimisticRollback = {
  readonly mutationId: string;
  readonly rollback: () => void;
} | null;
type ReactionMutation = ReturnType<typeof beginReactionMutation>;

type ReactionCacheDrop = {
  readonly id: string;
  readonly reactions: readonly ApiDropReaction[];
  readonly context_profile_context?: ApiDropContextProfileContext | null;
};

type ReactionCachePage = {
  readonly data: readonly ReactionCacheDrop[];
};

type ReactionCacheData = InfiniteData<ReactionCachePage>;

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

const toOwnedRollback = (
  mutationId: string,
  rollback: OptimisticRollback
): OwnedOptimisticRollback =>
  rollback === null ? null : { mutationId, rollback };

const clearRollbackForMutation = (
  rollbackRef: RefObject<OwnedOptimisticRollback>,
  mutationId: string
): void => {
  if (rollbackRef.current?.mutationId === mutationId) {
    rollbackRef.current = null;
  }
};

const runRollbackForMutation = (
  rollbackRef: RefObject<OwnedOptimisticRollback>,
  mutationId: string
): boolean => {
  if (rollbackRef.current?.mutationId !== mutationId) {
    return false;
  }

  rollbackRef.current.rollback();
  rollbackRef.current = null;
  return true;
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

  const previousReaction =
    drop.context_profile_context?.reaction ?? baseContext?.reaction ?? null;
  const reactions = applyProfileReactionToEntries({
    entries: cloneReactionEntries(drop.reactions),
    nextReaction: reactionCode,
    previousReaction,
    profileMin,
  });

  return {
    ...drop,
    reactions,
    context_profile_context: {
      ...(drop.context_profile_context ??
        baseContext ??
        EMPTY_DROP_CONTEXT_PROFILE_CONTEXT),
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
    typeof useMyStreamActions
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
            nextDrop.context_profile_context ??
            EMPTY_DROP_CONTEXT_PROFILE_CONTEXT;

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

      return applyOptimisticReactionQueryCacheUpdate({
        isTargetQueryKey: isReactionCurationQueryKey,
        queryClient,
        updateData: (currentData) =>
          updateReactionCacheData({
            baseContext: contextProfileContext,
            data: currentData,
            dropId,
            profileMin,
            reactionCode,
          }),
      });
    },
    [connectedProfile, contextProfileContext, dropId, enabled, queryClient]
  );
};

const sendReactionRequest = async ({
  dropId,
  endpoint,
  isRemoving,
  mutation,
  reactionCode,
  signal,
  waveId,
}: {
  readonly dropId: string;
  readonly endpoint: string;
  readonly isRemoving: boolean;
  readonly mutation: ReactionMutation;
  readonly reactionCode: string;
  readonly signal: AbortSignal;
  readonly waveId: string;
}): Promise<void> => {
  recordReactionRequestSent(mutation, {
    endpoint,
    method: isRemoving ? "DELETE" : "POST",
  });
  await sendDropReaction(
    { dropId, waveId, reaction: isRemoving ? null : reactionCode },
    { errorMode: "structured", signal }
  );
};

const runReactionSuccessCallback = (
  onSuccess: (() => void) | undefined
): void => {
  if (!onSuccess) {
    return;
  }

  try {
    onSuccess();
  } catch {
    // Ignore consumer callback errors so a successful request stays successful.
  }
};

export function useDropReaction(
  drop: ExtendedDrop,
  options?: UseDropReactionOptions
): UseDropReactionResult {
  const { setToast, connectedProfile, activeProfileProxy } = useAuth();
  const { applyOptimisticDropUpdate } = useMyStreamActions();
  const { getEligibility, updateEligibility } = useWaveEligibility();
  const queryClient = useQueryClient();
  const websocketStatus = useWebsocketStatus();
  const locale = useBrowserLocale();
  const { isRecoveryPending, recoverFromUnauthorized } =
    useDropReactionAuthRecovery();
  const rollbackRef = useRef<OwnedOptimisticRollback>(null);
  const source = options?.source ?? "picker";
  const onSuccess = options?.onSuccess;
  const updateCurationCache = options?.updateCurationCache ?? false;

  const waveId = drop.wave.id;
  const dropId = drop.id;
  const waveEligibility = getEligibility(waveId);
  const isEligibleToChat =
    waveEligibility?.authenticated_user_eligible_to_chat ??
    drop.wave.authenticated_user_eligible_to_chat;
  const isChatOnlyRestriction =
    isEligibleToChat === false &&
    (waveEligibility?.authenticated_user_chat_restriction ===
      ChatRestriction.SLOW_MODE ||
      waveEligibility?.authenticated_user_chat_restriction ===
        ChatRestriction.NO_PERMISSION);
  const canReact =
    !isRecoveryPending &&
    !activeProfileProxy &&
    !drop.id.startsWith("temp-") &&
    (isEligibleToChat !== false || isChatOnlyRestriction);
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
  const applyOptimisticReactionToNotificationQueries =
    useOptimisticNotificationDropReaction({
      connectedProfile,
      contextProfileContext,
      dropId,
    });
  const updateNotificationQueriesWithCanonicalDrop =
    useCanonicalNotificationDropUpdate({
      connectedProfile,
      dropId,
    });
  const {
    captureOwner,
    isCurrentMutation,
    refreshAfterFailure,
    reconcileRequestFailure,
  } = useDropReactionRecovery({
    activeProfileProxy,
    applyOptimisticDropUpdate,
    connectedProfile,
    dropId,
    queryClient,
    updateNotificationQueriesWithCanonicalDrop,
    waveId,
  });

  const react = useCallback(
    async (reactionCode: string) => {
      if (!canReact || isDropReactionAuthRecoveryPending()) return;

      const authStateFingerprint = getDropReactionAuthStateFingerprint();
      const owner = captureOwner(authStateFingerprint);
      const isRemoving = reactionCode === contextProfileContext?.reaction;
      const intendedReaction = isRemoving ? null : reactionCode;
      const endpoint = `drops/${drop.id}/reaction`;
      const method = isRemoving ? "DELETE" : "POST";

      const mutation = beginReactionMutation({
        isCurrentOwner: owner.isCurrent,
        dropId,
        waveId,
        source,
        action: deriveReactionAction(
          contextProfileContext?.reaction ?? null,
          intendedReaction
        ),
        previousReaction: contextProfileContext?.reaction ?? null,
        intendedReaction,
        optimisticReaction: intendedReaction,
        profileId: connectedProfile?.id ?? null,
        websocketStatus,
      });
      const isCurrent = () => isCurrentMutation(mutation, owner.isCurrent);

      rollbackRef.current = toOwnedRollback(
        mutation.mutationId,
        combineRollbacks([
          applyOptimisticReaction(intendedReaction),
          applyOptimisticReactionToCurationQueries(intendedReaction),
          applyOptimisticReactionToNotificationQueries(intendedReaction),
        ])
      );
      recordReactionOptimisticApplied(mutation);

      // The picker records its selection before invoking this callback.
      if (!isRemoving && source !== "picker") {
        void recordReaction(reactionCode);
      }

      const handleUncertainOutcome = async () => {
        const reconciliation = await reconcileRequestFailure(
          mutation,
          intendedReaction,
          isCurrent
        );
        if (!isCurrent()) return;
        clearRollbackForMutation(rollbackRef, mutation.mutationId);
        if (reconciliation.outcome === "confirmed") {
          if (owner.isMounted()) runReactionSuccessCallback(onSuccess);
        } else if (
          reconciliation.outcome === "unconfirmed" &&
          owner.isVisible()
        ) {
          setToast({
            title: t(locale, "drops.reactions.unconfirmed"),
            type: "warning",
            autoClose: 8_000,
          });
        }
      };

      const handleFailure = async (error: unknown) => {
        const result = recordReactionRequestFailed(mutation, error);
        if (!result.isLatestMutation || !isCurrent()) {
          clearRollbackForMutation(rollbackRef, mutation.mutationId);
          return;
        }

        if (isReactionRequestOutcomeUncertain(error)) {
          await handleUncertainOutcome();
          return;
        }

        const authRecovery = recoverFromUnauthorized(
          error,
          authStateFingerprint
        );

        if (
          isExpectedWaveReactionDisabledError({
            dropId,
            endpoint,
            error,
            method,
          })
        ) {
          updateEligibility(waveId, {
            authenticated_user_eligible_to_chat: false,
            authenticated_user_chat_restriction: ChatRestriction.DISABLED,
          });
        }

        const errorMessage = getReactionErrorMessage(
          error,
          isRemoving ? "Error removing reaction" : "Error adding reaction",
          locale
        );
        // A reaction cancelled at the signing prompt was never sent: roll
        // back without reporting a failure.
        if (owner.isVisible() && !isSignedWriteCancelled(error))
          setToast({ message: errorMessage, type: "error" });
        if (runRollbackForMutation(rollbackRef, mutation.mutationId)) {
          recordReactionRollbackApplied(mutation);
        }
        await refreshAfterFailure(isCurrent);
        await authRecovery;
      };

      let succeeded = false;

      try {
        await enqueueDropReactionRequest(dropId, async (signal) => {
          if (!owner.isCurrent()) return;
          await sendReactionRequest({
            dropId,
            endpoint,
            isRemoving,
            mutation,
            reactionCode,
            signal,
            waveId,
          });
        });
        const result = recordReactionRequestSucceeded(mutation);
        if (result.isLatestMutation && isCurrent()) {
          clearRollbackForMutation(rollbackRef, mutation.mutationId);
          succeeded = true;
        }
      } catch (error) {
        await handleFailure(error);
        return;
      }

      if (succeeded && owner.isMounted() && isCurrent()) {
        runReactionSuccessCallback(onSuccess);
      }
    },
    [
      canReact,
      applyOptimisticReaction,
      applyOptimisticReactionToCurationQueries,
      applyOptimisticReactionToNotificationQueries,
      connectedProfile?.id,
      contextProfileContext?.reaction,
      drop.id,
      dropId,
      locale,
      setToast,
      onSuccess,
      captureOwner,
      isCurrentMutation,
      refreshAfterFailure,
      reconcileRequestFailure,
      recoverFromUnauthorized,
      source,
      updateEligibility,
      waveId,
      websocketStatus,
    ]
  );

  return { react, canReact };
}
