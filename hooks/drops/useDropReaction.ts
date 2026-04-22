"use client";

import { useAuth } from "@/components/auth/Auth";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiAddReactionToDropRequest } from "@/generated/models/ApiAddReactionToDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import { recordReaction } from "@/helpers/reactions/reactionHistory";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import { useWebsocketStatus } from "@/services/websocket/useWebSocketMessage";
import { useCallback, useRef } from "react";
import {
  cloneReactionEntries,
  findReactionIndex,
  getReactionErrorMessage,
  removeUserFromReactions,
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

interface UseDropReactionResult {
  readonly react: (reactionCode: string) => Promise<void>;
  readonly canReact: boolean;
}

interface UseDropReactionOptions {
  readonly source?: ReactionSource | undefined;
  readonly onSuccess?: (() => void) | undefined;
}

export function useDropReaction(
  drop: ExtendedDrop,
  options?: UseDropReactionOptions
): UseDropReactionResult {
  const { setToast, connectedProfile } = useAuth();
  const { applyOptimisticDropUpdate } = useMyStream();
  const websocketStatus = useWebsocketStatus();
  const rollbackRef = useRef<(() => void) | null>(null);
  const source = options?.source ?? "picker";
  const onSuccess = options?.onSuccess;

  const canReact = !drop.id.startsWith("temp-");

  const waveId = drop.wave.id;
  const dropId = drop.id;
  const contextProfileContext = drop.context_profile_context;

  const applyOptimisticReaction = useCallback(
    (reactionCode: string | null) => {
      const profileMin = toProfileMin(connectedProfile);
      if (!profileMin) {
        return null;
      }

      const userId = profileMin.id;

      const handle = applyOptimisticDropUpdate({
        waveId: waveId,
        dropId: dropId,
        update: (draft) => {
          if (draft.type !== DropSize.FULL) {
            return draft;
          }

          const reactions = cloneReactionEntries(draft.reactions);
          const reactionsWithoutUser = removeUserFromReactions(
            reactions,
            userId
          );

          if (reactionCode !== null) {
            const targetIndex = findReactionIndex(
              reactionsWithoutUser,
              reactionCode
            );

            if (targetIndex >= 0) {
              const profiles =
                reactionsWithoutUser[targetIndex]?.profiles ?? [];
              reactionsWithoutUser[targetIndex] = {
                ...reactionsWithoutUser[targetIndex]!,
                profiles: [...profiles, profileMin],
              };
            } else {
              reactionsWithoutUser.push({
                reaction: reactionCode,
                profiles: [profileMin],
              });
            }
          }

          draft.reactions = reactionsWithoutUser;

          const baseContext: ApiDropContextProfileContext =
            draft.context_profile_context ??
              contextProfileContext ?? {
                rating: 0,
                min_rating: 0,
                max_rating: 0,
                reaction: null,
                boosted: false,
                bookmarked: false,
                curatable: false,
                curated: false,
              };

          draft.context_profile_context = {
            ...baseContext,
            reaction: reactionCode,
          };

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

  const react = useCallback(
    async (reactionCode: string) => {
      if (!canReact) return;

      const isRemoving = reactionCode === contextProfileContext?.reaction;
      const intendedReaction = isRemoving ? null : reactionCode;
      const mutation = beginReactionMutation({
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

      rollbackRef.current?.();
      rollbackRef.current = applyOptimisticReaction(intendedReaction);
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
      connectedProfile?.id,
      contextProfileContext?.reaction,
      drop.id,
      dropId,
      setToast,
      onSuccess,
      source,
      waveId,
      websocketStatus,
    ]
  );

  return { react, canReact };
}
