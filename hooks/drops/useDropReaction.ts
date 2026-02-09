"use client";

import { useAuth } from "@/components/auth/Auth";
import { useMyStream } from "@/contexts/wave/MyStreamContext";
import type { ApiAddReactionToDropRequest } from "@/generated/models/ApiAddReactionToDropRequest";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import { recordReaction } from "@/helpers/reactions/reactionHistory";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useCallback, useRef } from "react";
import {
  cloneReactionEntries,
  findReactionIndex,
  removeUserFromReactions,
  toProfileMin,
} from "@/components/waves/drops/reaction-utils";

interface UseDropReactionResult {
  readonly react: (reactionCode: string) => Promise<void>;
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
    (reactionCode: string) => {
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

          const targetIndex = findReactionIndex(
            reactionsWithoutUser,
            reactionCode
          );

          if (targetIndex >= 0) {
            const profiles = reactionsWithoutUser[targetIndex]?.profiles ?? [];
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

      rollbackRef.current?.();
      rollbackRef.current = applyOptimisticReaction(reactionCode);
      recordReaction(reactionCode);

      try {
        await commonApiPost<ApiAddReactionToDropRequest, ApiDrop>({
          endpoint: `drops/${drop.id}/reaction`,
          body: { reaction: reactionCode },
        });
        rollbackRef.current = null;
        onSuccess?.();
      } catch (error) {
        let errorMessage = "Error adding reaction";
        if (typeof error === "string") {
          errorMessage = error;
        }
        setToast({ message: errorMessage, type: "error" });
        rollbackRef.current?.();
        rollbackRef.current = null;
      }
    },
    [canReact, applyOptimisticReaction, drop.id, setToast, onSuccess]
  );

  return { react, canReact };
}
