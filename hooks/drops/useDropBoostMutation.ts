"use client";

import { AuthContext } from "@/components/auth/Auth";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { DropSize } from "@/helpers/waves/drop.helpers";
import {
  commonApiDelete,
  commonApiPostWithoutBodyAndResponse,
} from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useContext, useRef } from "react";

interface BoostMutationParams {
  readonly drop: ExtendedDrop;
  readonly action: "boost" | "unboost";
}

interface UseDropBoostMutationReturn {
  readonly boostDrop: (drop: ExtendedDrop) => void;
  readonly unboostDrop: (drop: ExtendedDrop) => void;
  readonly toggleBoost: (drop: ExtendedDrop) => void;
  readonly isPending: boolean;
}

export const useDropBoostMutation = (): UseDropBoostMutationReturn => {
  const { setToast, connectedProfile } = useContext(AuthContext);
  const myStreamContext = useMyStreamOptional();
  const rollbackRef = useRef<(() => void) | null>(null);
  const pendingDropIdRef = useRef<string | null>(null);

  const applyOptimisticBoost = useCallback(
    (drop: ExtendedDrop, action: "boost" | "unboost") => {
      if (!myStreamContext?.applyOptimisticDropUpdate) {
        return null;
      }

      const handle = myStreamContext.applyOptimisticDropUpdate({
        waveId: drop.wave.id,
        dropId: drop.id,
        update: (draft) => {
          if (draft.type !== DropSize.FULL) {
            return draft;
          }

          const isCurrentlyBoosted =
            draft.context_profile_context?.boosted ?? false;
          const currentBoosts = draft.boosts;

          if (action === "boost" && !isCurrentlyBoosted) {
            draft.boosts = currentBoosts + 1;
          } else if (action === "unboost" && isCurrentlyBoosted) {
            draft.boosts = Math.max(0, currentBoosts - 1);
          }

          const baseContext: ApiDropContextProfileContext =
            draft.context_profile_context ?? {
              rating: 0,
              min_rating: 0,
              max_rating: 0,
              reaction: null,
              boosted: false,
            };

          draft.context_profile_context = {
            ...baseContext,
            boosted: action === "boost",
          };

          return draft;
        },
      });

      return handle?.rollback ?? null;
    },
    [myStreamContext]
  );

  const mutation = useMutation({
    mutationFn: async ({ drop, action }: BoostMutationParams) => {
      const endpoint = `drops/${drop.id}/boosts`;

      if (action === "boost") {
        await commonApiPostWithoutBodyAndResponse({ endpoint });
      } else {
        await commonApiDelete({ endpoint });
      }

      return { drop, action };
    },
    onMutate: ({ drop, action }) => {
      // Apply optimistic update
      rollbackRef.current?.();
      rollbackRef.current = applyOptimisticBoost(drop, action);
      pendingDropIdRef.current = drop.id;
    },
    onSuccess: () => {
      rollbackRef.current = null;
      pendingDropIdRef.current = null;
    },
    onError: (error, { action }) => {
      console.error(`Failed to ${action} drop:`, error);

      // Rollback optimistic update
      rollbackRef.current?.();
      rollbackRef.current = null;
      pendingDropIdRef.current = null;

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      setToast({
        message:
          action === "boost"
            ? `Failed to boost drop: ${errorMessage}`
            : `Failed to remove boost: ${errorMessage}`,
        type: "error",
      });
    },
  });

  const boostDrop = useCallback(
    (drop: ExtendedDrop) => {
      if (!connectedProfile) {
        setToast({
          message: "Please connect your wallet to boost drops",
          type: "warning",
        });
        return;
      }

      // Prevent boosting if already pending for this drop
      if (pendingDropIdRef.current === drop.id) {
        return;
      }

      // Prevent boosting temporary drops
      if (drop.id.startsWith("temp-")) {
        return;
      }

      mutation.mutate({ drop, action: "boost" });
    },
    [connectedProfile, mutation, setToast]
  );

  const unboostDrop = useCallback(
    (drop: ExtendedDrop) => {
      if (!connectedProfile) {
        return;
      }

      // Prevent unboosting if already pending for this drop
      if (pendingDropIdRef.current === drop.id) {
        return;
      }

      mutation.mutate({ drop, action: "unboost" });
    },
    [connectedProfile, mutation]
  );

  const toggleBoost = useCallback(
    (drop: ExtendedDrop) => {
      const isBoosted = drop.context_profile_context?.boosted ?? false;

      if (isBoosted) {
        unboostDrop(drop);
      } else {
        boostDrop(drop);
      }
    },
    [boostDrop, unboostDrop]
  );

  return {
    boostDrop,
    unboostDrop,
    toggleBoost,
    isPending: mutation.isPending,
  };
};

export default useDropBoostMutation;
