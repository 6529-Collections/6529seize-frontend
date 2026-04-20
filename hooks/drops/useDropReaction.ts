"use client";

import { useAuth } from "@/components/auth/Auth";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiAddReactionToDropRequest } from "@/generated/models/ApiAddReactionToDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import {
  buildEmojiReactionDebugState,
  createEmojiReactionAttemptId,
  getEmojiReactionDebugError,
  getEmojiReactionDebugValueShape,
  logEmojiReactionDebug,
  type EmojiReactionDebugMeta,
} from "@/helpers/reactions/emojiReactionDebug";
import { recordReaction } from "@/helpers/reactions/reactionHistory";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiDelete, commonApiPost } from "@/services/api/common-api";
import { useCallback, useRef } from "react";
import {
  cloneReactionEntries,
  findReactionIndex,
  removeUserFromReactions,
  toProfileMin,
} from "@/components/waves/drops/reaction-utils";

interface UseDropReactionResult {
  readonly react: (
    reactionCode: string,
    debugMeta?: EmojiReactionDebugMeta
  ) => Promise<void>;
  readonly canReact: boolean;
}

export function useDropReaction(
  drop: ExtendedDrop,
  onSuccess?: () => void
): UseDropReactionResult {
  const { setToast, connectedProfile } = useAuth();
  const { applyOptimisticDropUpdate } = useMyStream();
  const rollbackRef = useRef<(() => void) | null>(null);

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
    async (reactionCode: string, debugMeta?: EmojiReactionDebugMeta) => {
      if (!canReact) return;

      const isRemoving = reactionCode === contextProfileContext?.reaction;
      const attemptId = debugMeta?.attemptId ?? createEmojiReactionAttemptId();
      const source = debugMeta?.source ?? "unknown";
      const profileId = connectedProfile?.id ?? null;
      const previousReaction = contextProfileContext?.reaction ?? null;

      logEmojiReactionDebug("click", {
        attemptId,
        source,
        dropId,
        waveId,
        profileId,
        reaction: reactionCode,
        previous_reaction: previousReaction,
        next_reaction: isRemoving ? null : reactionCode,
        is_removing: isRemoving,
      });

      if (rollbackRef.current) {
        logEmojiReactionDebug("rollback", {
          attemptId,
          source,
          dropId,
          waveId,
          profileId,
          reason: "superseded_attempt",
        });
        rollbackRef.current();
      }
      rollbackRef.current = applyOptimisticReaction(
        isRemoving ? null : reactionCode
      );

      logEmojiReactionDebug("optimistic_applied", {
        attemptId,
        source,
        dropId,
        waveId,
        profileId,
        previous_reaction: previousReaction,
        next_reaction: isRemoving ? null : reactionCode,
        is_removing: isRemoving,
        has_rollback: Boolean(rollbackRef.current),
        before_state: buildEmojiReactionDebugState(drop, profileId),
      });

      if (!isRemoving) {
        recordReaction(reactionCode);
      }

      const endpoint = `drops/${drop.id}/reaction`;
      const method = isRemoving ? "DELETE" : "POST";
      const startedAt = performance.now();

      logEmojiReactionDebug("request_start", {
        attemptId,
        source,
        dropId,
        waveId,
        profileId,
        method,
        endpoint,
        reaction: reactionCode,
      });

      try {
        let responseShape = "void";
        if (isRemoving) {
          await commonApiDelete({ endpoint });
        } else {
          const response = await commonApiPost<
            ApiAddReactionToDropRequest,
            ApiDrop
          >({
            endpoint,
            body: { reaction: reactionCode },
          });
          responseShape = getEmojiReactionDebugValueShape(response);
        }
        logEmojiReactionDebug("request_success", {
          attemptId,
          source,
          dropId,
          waveId,
          profileId,
          method,
          endpoint,
          reaction: reactionCode,
          duration_ms: Math.round(performance.now() - startedAt),
          response_shape: responseShape,
        });
        rollbackRef.current = null;
        onSuccess?.();
      } catch (error) {
        logEmojiReactionDebug("request_error", {
          attemptId,
          source,
          dropId,
          waveId,
          profileId,
          method,
          endpoint,
          reaction: reactionCode,
          duration_ms: Math.round(performance.now() - startedAt),
          ...getEmojiReactionDebugError(error),
        });
        let errorMessage = isRemoving
          ? "Error removing reaction"
          : "Error adding reaction";
        if (typeof error === "string") {
          errorMessage = error;
        }
        setToast({ message: errorMessage, type: "error" });
        logEmojiReactionDebug("rollback", {
          attemptId,
          source,
          dropId,
          waveId,
          profileId,
          reason: "api_error",
        });
        rollbackRef.current?.();
        rollbackRef.current = null;
      }
    },
    [
      canReact,
      applyOptimisticReaction,
      contextProfileContext?.reaction,
      drop.id,
      drop,
      dropId,
      waveId,
      connectedProfile?.id,
      setToast,
      onSuccess,
    ]
  );

  return { react, canReact };
}
