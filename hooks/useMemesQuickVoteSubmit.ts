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

type QueuedVote = {
  readonly amount: number;
  readonly currentRating: number;
  readonly drop: ExtendedDrop;
  readonly maxRating: number;
};

type UseMemesQuickVoteSubmitOptions = {
  readonly requestAuth: () => Promise<{ success: boolean }>;
  readonly setToast: SetToast;
  readonly invalidateDrops: () => void;
  readonly setAndPersistRecentAmounts: PersistNumberArray;
  readonly setAndPersistSkippedDropIds: PersistStringArray;
  readonly onVoteFailure: (drop: ExtendedDrop, amount: number) => void;
  readonly onVoteQueued: (drop: ExtendedDrop, amount: number) => void;
  readonly onVoteSuccess: (
    drop: ExtendedDrop,
    amount: number,
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
  onVoteFailure,
  onVoteQueued,
  onVoteSuccess,
}: UseMemesQuickVoteSubmitOptions): UseMemesQuickVoteSubmitResult => {
  const voteQueueRef = useRef<QueuedVote[]>([]);
  const queuedDropIdsRef = useRef<Set<string>>(new Set());
  const isFlushingRef = useRef(false);
  const [pendingVoteCount, setPendingVoteCount] = useState(0);

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
  });

  const flushQueuedVotes = useCallback(async () => {
    if (isFlushingRef.current) {
      return;
    }

    isFlushingRef.current = true;

    try {
      while (voteQueueRef.current.length > 0) {
        const queuedVote = voteQueueRef.current[0];
        if (!queuedVote) {
          break;
        }

        try {
          const { success } = await requestAuth();

          if (!success) {
            throw new Error("Quick vote couldn't verify your session.");
          }

          const response = await voteMutation.mutateAsync({
            dropId: queuedVote.drop.id,
            amount: queuedVote.amount,
          });
          const nextRating = response.context_profile_context?.rating;
          const appliedAmount =
            typeof nextRating === "number"
              ? Math.max(0, nextRating - queuedVote.currentRating)
              : queuedVote.amount;
          const nextRemainingPower = Math.max(
            0,
            queuedVote.maxRating - appliedAmount
          );

          onVoteSuccess(queuedVote.drop, queuedVote.amount, nextRemainingPower);
          invalidateDrops();
        } catch (error) {
          setToast({
            message:
              error instanceof Error
                ? error.message
                : "Quick vote couldn't submit that vote.",
            type: "error",
          });
          onVoteFailure(queuedVote.drop, queuedVote.amount);
        } finally {
          voteQueueRef.current.shift();
          queuedDropIdsRef.current.delete(queuedVote.drop.id);
          setPendingVoteCount(voteQueueRef.current.length);
        }
      }
    } finally {
      isFlushingRef.current = false;
    }
  }, [
    invalidateDrops,
    onVoteFailure,
    onVoteSuccess,
    requestAuth,
    setToast,
    voteMutation,
  ]);

  const submitVote = useCallback(
    async (drop: ExtendedDrop, amount: number | string) => {
      const currentRating = drop.context_profile_context?.rating ?? 0;
      const maxRating = drop.context_profile_context?.max_rating ?? 0;
      const normalizedAmount = normalizeQuickVoteAmount(amount, maxRating);

      if (normalizedAmount === null || queuedDropIdsRef.current.has(drop.id)) {
        return false;
      }

      queuedDropIdsRef.current.add(drop.id);
      voteQueueRef.current.push({
        amount: normalizedAmount,
        currentRating,
        drop,
        maxRating,
      });
      setPendingVoteCount(voteQueueRef.current.length);

      onVoteQueued(drop, normalizedAmount);
      setAndPersistRecentAmounts((current) =>
        addRecentQuickVoteAmount(current, normalizedAmount)
      );
      setAndPersistSkippedDropIds((current) =>
        current.filter((dropId) => dropId !== drop.id)
      );

      void flushQueuedVotes();

      return true;
    },
    [
      flushQueuedVotes,
      onVoteQueued,
      setAndPersistRecentAmounts,
      setAndPersistSkippedDropIds,
    ]
  );

  return {
    isVoting: pendingVoteCount > 0 || voteMutation.isPending,
    submitVote,
  };
};
