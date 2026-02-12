"use client";

import { useAuth } from "@/components/auth/Auth";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import type { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import { DropSize } from "@/helpers/waves/drop.helpers";
import {
  commonApiDelete,
  commonApiPostWithoutBodyAndResponse,
} from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useRef } from "react";

export interface DropCurationTarget {
  readonly dropId: string;
  readonly waveId: string;
  readonly isCuratable: boolean;
  readonly isCurated: boolean;
}

interface CurationMutationParams {
  readonly target: DropCurationTarget;
  readonly action: "curate" | "uncurate";
}

interface UseDropCurationMutationReturn {
  readonly addCuration: (target: DropCurationTarget) => void;
  readonly removeCuration: (target: DropCurationTarget) => void;
  readonly toggleCuration: (target: DropCurationTarget) => void;
  readonly isPending: boolean;
}

const FALLBACK_DROP_CONTEXT: ApiDropContextProfileContext = {
  rating: 0,
  min_rating: 0,
  max_rating: 0,
  reaction: null,
  boosted: false,
  bookmarked: false,
  curatable: false,
  curated: false,
};

export const useDropCurationMutation = (): UseDropCurationMutationReturn => {
  const { connectedProfile, setToast } = useAuth();
  const myStreamContext = useMyStreamOptional();
  const rollbackRef = useRef<(() => void) | null>(null);
  const pendingDropIdRef = useRef<string | null>(null);

  const applyOptimisticCuration = useCallback(
    (target: DropCurationTarget, curated: boolean) => {
      if (!myStreamContext?.applyOptimisticDropUpdate) {
        return null;
      }

      const handle = myStreamContext.applyOptimisticDropUpdate({
        waveId: target.waveId,
        dropId: target.dropId,
        update: (draft) => {
          if (draft.type !== DropSize.FULL) {
            return draft;
          }

          const baseContext: ApiDropContextProfileContext =
            draft.context_profile_context ?? {
              ...FALLBACK_DROP_CONTEXT,
              curatable: target.isCuratable,
              curated: target.isCurated,
            };

          draft.context_profile_context = {
            ...baseContext,
            curated,
          };

          return draft;
        },
      });

      return handle?.rollback ?? null;
    },
    [myStreamContext]
  );

  const mutation = useMutation({
    mutationFn: async ({ target, action }: CurationMutationParams) => {
      const endpoint = `drops/${target.dropId}/curations`;

      if (action === "curate") {
        await commonApiPostWithoutBodyAndResponse({ endpoint });
      } else {
        await commonApiDelete({ endpoint });
      }

      return { target, action };
    },
    onMutate: ({ target, action }) => {
      rollbackRef.current?.();
      rollbackRef.current = applyOptimisticCuration(
        target,
        action === "curate"
      );
      pendingDropIdRef.current = target.dropId;
    },
    onSuccess: () => {
      rollbackRef.current = null;
      pendingDropIdRef.current = null;
    },
    onError: (error, { action }) => {
      rollbackRef.current?.();
      rollbackRef.current = null;
      pendingDropIdRef.current = null;

      const errorMessage =
        error instanceof Error ? error.message : String(error);

      setToast({
        message:
          action === "curate"
            ? `Failed to curate drop: ${errorMessage}`
            : `Failed to remove curation: ${errorMessage}`,
        type: "error",
      });
    },
  });

  const canMutate = useCallback(
    (target: DropCurationTarget) => {
      if (!connectedProfile) {
        setToast({
          message: "Please connect your wallet to curate drops",
          type: "warning",
        });
        return false;
      }

      if (!target.isCuratable) {
        return false;
      }

      if (target.dropId.startsWith("temp-")) {
        return false;
      }

      if (pendingDropIdRef.current === target.dropId || mutation.isPending) {
        return false;
      }

      return true;
    },
    [connectedProfile, mutation.isPending, setToast]
  );

  const addCuration = useCallback(
    (target: DropCurationTarget) => {
      if (!canMutate(target)) {
        return;
      }

      mutation.mutate({ target, action: "curate" });
    },
    [canMutate, mutation]
  );

  const removeCuration = useCallback(
    (target: DropCurationTarget) => {
      if (!canMutate(target)) {
        return;
      }

      mutation.mutate({ target, action: "uncurate" });
    },
    [canMutate, mutation]
  );

  const toggleCuration = useCallback(
    (target: DropCurationTarget) => {
      if (target.isCurated) {
        removeCuration(target);
      } else {
        addCuration(target);
      }
    },
    [addCuration, removeCuration]
  );

  return {
    addCuration,
    removeCuration,
    toggleCuration,
    isPending: mutation.isPending,
  };
};
