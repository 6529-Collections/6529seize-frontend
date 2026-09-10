"use client";

import type { useAuth } from "@/components/auth/Auth";
import { updateDropInCachedDrops } from "@/components/react-query-wrapper/utils/updateAttachmentInCachedDrops";
import type { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import {
  readReactionDrop,
  reconcileDropReaction,
} from "@/helpers/reactions/reconcileDropReaction";
import { DropSize, type Drop } from "@/helpers/waves/drop.helpers";
import { getDropReactionAuthStateFingerprint } from "@/hooks/drops/useDropReactionAuthRecovery";
import { useDropReactionView } from "@/hooks/drops/useDropReactionView";
import { COMMUNITY_CURATIONS_DROPS_QUERY_KEY } from "@/hooks/useCommunityCurationsDrops";
import {
  isReactionMutationLatest,
  recordReactionTimeoutReconciled,
  type beginReactionMutation,
} from "@/utils/monitoring/dropReactionMonitoring";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef } from "react";

type ReactionMutation = ReturnType<typeof beginReactionMutation>;
type CurationCacheData = InfiniteData<{ readonly data: readonly ApiDrop[] }>;

const reconcileCurationReactions = (
  data: CurationCacheData | undefined,
  canonical: ApiDrop
): CurationCacheData | undefined => {
  if (!data) return data;
  return {
    ...data,
    pages: data.pages.map((page) => ({
      ...page,
      data: page.data.map((drop) =>
        drop.id === canonical.id
          ? {
              ...drop,
              reactions: canonical.reactions,
              context_profile_context: canonical.context_profile_context,
            }
          : drop
      ),
    })),
  };
};

export const useDropReactionRecovery = ({
  activeProfileProxy,
  applyOptimisticDropUpdate,
  connectedProfile,
  dropId,
  queryClient,
  updateNotificationQueriesWithCanonicalDrop,
  waveId,
}: {
  readonly activeProfileProxy: ReturnType<typeof useAuth>["activeProfileProxy"];
  readonly applyOptimisticDropUpdate: ReturnType<
    typeof useMyStream
  >["applyOptimisticDropUpdate"];
  readonly connectedProfile: ReturnType<typeof useAuth>["connectedProfile"];
  readonly dropId: string;
  readonly queryClient: QueryClient;
  readonly updateNotificationQueriesWithCanonicalDrop: (drop: ApiDrop) => void;
  readonly waveId: string;
}) => {
  const captureView = useDropReactionView(dropId);
  const ownerRef = useRef({ visible: true });
  useEffect(() => {
    const owner = { visible: true };
    ownerRef.current = owner;
    return () => {
      owner.visible = false;
    };
  }, [dropId, connectedProfile?.id, activeProfileProxy?.id]);

  const captureOwner = useCallback(
    (authFingerprint: string) => {
      const owner = ownerRef.current;
      const isViewVisible = captureView();
      // Chips can disappear during an optimistic removal. Their cache recovery
      // still belongs to this drop/account, but local UI callbacks must stop.
      const isCurrent = () =>
        ownerRef.current === owner &&
        getDropReactionAuthStateFingerprint() === authFingerprint;
      return {
        isCurrent,
        isMounted: () => owner.visible && isCurrent(),
        isVisible: () => isViewVisible() && isCurrent(),
      };
    },
    [captureView]
  );

  const applyCanonicalDrop = useCallback(
    (apiDrop: ApiDrop) => {
      updateDropInCachedDrops(queryClient, apiDrop);
      updateNotificationQueriesWithCanonicalDrop(apiDrop);
      queryClient.setQueriesData<CurationCacheData>(
        { queryKey: [COMMUNITY_CURATIONS_DROPS_QUERY_KEY] },
        (data) => reconcileCurationReactions(data, apiDrop)
      );
      applyOptimisticDropUpdate({
        waveId,
        dropId,
        update: (draft): Drop => {
          if (draft.type !== DropSize.FULL) {
            return draft;
          }
          return {
            ...apiDrop,
            type: DropSize.FULL,
            stableKey: draft.stableKey,
            stableHash: draft.stableHash,
          };
        },
      });
    },
    [
      applyOptimisticDropUpdate,
      dropId,
      queryClient,
      updateNotificationQueriesWithCanonicalDrop,
      waveId,
    ]
  );

  const isCurrentMutation = useCallback(
    (mutation: ReactionMutation, isCurrentOwner: () => boolean) =>
      isCurrentOwner() &&
      isReactionMutationLatest({ dropId, mutationId: mutation.mutationId }),
    [dropId]
  );

  const refreshAfterFailure = useCallback(
    async (isCurrent: () => boolean) => {
      if (!isCurrent()) return;
      const apiDrop = await readReactionDrop(dropId);
      if (apiDrop?.id === dropId && isCurrent()) {
        applyCanonicalDrop(apiDrop);
      }
    },
    [applyCanonicalDrop, dropId]
  );

  const reconcileTimeout = useCallback(
    async (
      mutation: ReactionMutation,
      intendedReaction: string | null,
      isCurrent: () => boolean
    ) => {
      const result = await reconcileDropReaction({
        dropId,
        intendedReaction,
        isCurrent,
        isConfirmed: () => typeof mutation.realtimeReconciledAt === "number",
      });
      recordReactionTimeoutReconciled(mutation, result.outcome);
      if (isCurrent() && result.drop) {
        applyCanonicalDrop(result.drop);
      }
      return result;
    },
    [applyCanonicalDrop, dropId]
  );

  return {
    captureOwner,
    isCurrentMutation,
    refreshAfterFailure,
    reconcileTimeout,
  };
};
