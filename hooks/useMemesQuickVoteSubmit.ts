"use client";

import type { DropRateChangeRequest } from "@/entities/IDrop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  addRecentQuickVoteAmount,
  normalizeQuickVoteAmount,
} from "@/hooks/memesQuickVote.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { useCallback, useRef, useState } from "react";
import type { TypeOptions } from "react-toastify";

const DEFAULT_DROP_RATE_CATEGORY = "Rep";

type SetToast = (options: {
  readonly message: string | ReactNode;
  readonly type: TypeOptions;
}) => void;

type PersistNumberArray = (updater: (current: number[]) => number[]) => void;
type PersistStringArray = (updater: (current: string[]) => string[]) => void;

type UseMemesQuickVoteSubmitOptions = {
  readonly requestAuth: () => Promise<{ success: boolean }>;
  readonly setToast: SetToast;
  readonly invalidateDrops: () => void;
  readonly setAndPersistRecentAmounts: PersistNumberArray;
  readonly setAndPersistSkippedDropIds: PersistStringArray;
  readonly onVoteSuccess: (
    drop: ExtendedDrop,
    nextRemainingPower: number
  ) => void;
};

type UseMemesQuickVoteSubmitResult = {
  readonly isVoting: boolean;
  readonly submitVote: (
    drop: ExtendedDrop,
    amount: number | string
  ) => Promise<boolean>;
};

export const useMemesQuickVoteSubmit = ({
  requestAuth,
  setToast,
  invalidateDrops,
  setAndPersistRecentAmounts,
  setAndPersistSkippedDropIds,
  onVoteSuccess,
}: UseMemesQuickVoteSubmitOptions): UseMemesQuickVoteSubmitResult => {
  const submitInFlightRef = useRef(false);
  const [isSubmitInFlight, setIsSubmitInFlight] = useState(false);

  const voteMutation = useMutation({
    mutationFn: ({
      dropId,
      amount,
    }: {
      readonly dropId: string;
      readonly amount: number;
    }) =>
      commonApiPost<DropRateChangeRequest, ApiDrop>({
        endpoint: `drops/${dropId}/ratings`,
        body: {
          rating: amount,
          category: DEFAULT_DROP_RATE_CATEGORY,
        },
      }),
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
  });

  const submitVote = useCallback(
    async (drop: ExtendedDrop, amount: number | string) => {
      const currentRating = drop.context_profile_context?.rating ?? 0;
      const maxRating = drop.context_profile_context?.max_rating ?? 0;
      const normalizedAmount = normalizeQuickVoteAmount(amount, maxRating);

      if (normalizedAmount === null || submitInFlightRef.current) {
        return false;
      }

      submitInFlightRef.current = true;
      setIsSubmitInFlight(true);

      try {
        const { success } = await requestAuth();

        if (!success) {
          return false;
        }

        const response = await voteMutation.mutateAsync({
          dropId: drop.id,
          amount: normalizedAmount,
        });
        const nextRating = response.context_profile_context?.rating;
        const appliedAmount =
          typeof nextRating === "number"
            ? Math.max(0, nextRating - currentRating)
            : normalizedAmount;
        const nextRemainingPower = Math.max(0, maxRating - appliedAmount);

        onVoteSuccess(drop, nextRemainingPower);
        setAndPersistRecentAmounts((current) =>
          addRecentQuickVoteAmount(current, normalizedAmount)
        );
        setAndPersistSkippedDropIds((current) =>
          current.filter((dropId) => dropId !== drop.id)
        );
        invalidateDrops();

        return true;
      } catch {
        return false;
      } finally {
        submitInFlightRef.current = false;
        setIsSubmitInFlight(false);
      }
    },
    [
      invalidateDrops,
      onVoteSuccess,
      requestAuth,
      setAndPersistRecentAmounts,
      setAndPersistSkippedDropIds,
      voteMutation,
    ]
  );

  return {
    isVoting: isSubmitInFlight || voteMutation.isPending,
    submitVote,
  };
};
