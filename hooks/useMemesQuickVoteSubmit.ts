"use client";

import type { DropRateChangeRequest } from "@/entities/IDrop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  addRecentQuickVoteAmount,
  getQuickVoteAbsoluteRemainingPower,
  getQuickVoteRatingRange,
  normalizeQuickVoteAmount,
} from "@/hooks/memesQuickVote.helpers";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import type { UseMutationResult } from "@tanstack/react-query";
import type { Dispatch, ReactNode, SetStateAction } from "react";
import { useCallback, useRef, useState } from "react";
import type { TypeOptions } from "react-toastify";

const DEFAULT_DROP_RATE_CATEGORY = "Rep";

type SetToast = (options: {
  readonly message: string | ReactNode;
  readonly type: TypeOptions;
}) => void;

type PersistNumberArray = (updater: (current: number[]) => number[]) => void;

type QueuedRating = {
  readonly amount: number;
  readonly currentRating: number;
  readonly drop: ExtendedDrop;
  readonly remainingPower: number;
  readonly type: "skip" | "vote";
};

type UseMemesQuickVoteSubmitOptions = {
  readonly requestAuth: () => Promise<{ success: boolean }>;
  readonly setToast: SetToast;
  readonly setAndPersistRecentAmounts: PersistNumberArray;
  readonly onRatingFailure: (
    drop: ExtendedDrop,
    amount: number,
    type: QueuedRating["type"]
  ) => void;
  readonly onRatingQueued: (
    drop: ExtendedDrop,
    amount: number,
    type: QueuedRating["type"]
  ) => void;
  readonly onRatingSuccess: (
    drop: ExtendedDrop,
    amount: number,
    nextRemainingPower: number,
    type: QueuedRating["type"]
  ) => void;
};

type UseMemesQuickVoteSubmitResult = {
  readonly isVoting: boolean;
  readonly pendingDropIds: readonly string[];
  readonly submitSkip: (drop: ExtendedDrop) => Promise<boolean>;
  readonly submitVote: (
    drop: ExtendedDrop,
    amount: number | string
  ) => Promise<boolean>;
};

type RefValue<T> = {
  current: T;
};

const getQueuedRatingAppliedAmount = ({
  nextRating,
  queuedRating,
}: {
  readonly nextRating: number | undefined;
  readonly queuedRating: QueuedRating;
}): number => {
  if (queuedRating.type === "skip") {
    return 0;
  }

  if (typeof nextRating === "number") {
    return Math.abs(nextRating - queuedRating.currentRating);
  }

  return Math.abs(queuedRating.amount);
};

const getQueuedRatingErrorMessage = ({
  error,
  type,
}: {
  readonly error: unknown;
  readonly type: QueuedRating["type"];
}): string => {
  if (error instanceof Error) {
    return error.message;
  }

  return type === "skip"
    ? "Quick vote couldn't skip that meme."
    : "Quick vote couldn't submit that vote.";
};

const flushMemesQuickVoteRatings = async ({
  isFlushingRef,
  onRatingFailure,
  onRatingSuccess,
  queuedDropIdsRef,
  ratingMutation,
  ratingQueueRef,
  requestAuth,
  setPendingDropIds,
  setPendingRatingCount,
  setToast,
}: {
  readonly isFlushingRef: RefValue<boolean>;
  readonly onRatingFailure: UseMemesQuickVoteSubmitOptions["onRatingFailure"];
  readonly onRatingSuccess: UseMemesQuickVoteSubmitOptions["onRatingSuccess"];
  readonly queuedDropIdsRef: RefValue<Set<string>>;
  readonly ratingMutation: UseMutationResult<
    ApiDrop,
    Error,
    {
      readonly amount: number;
      readonly dropId: string;
    }
  >;
  readonly ratingQueueRef: RefValue<QueuedRating[]>;
  readonly requestAuth: UseMemesQuickVoteSubmitOptions["requestAuth"];
  readonly setPendingDropIds: Dispatch<SetStateAction<string[]>>;
  readonly setPendingRatingCount: Dispatch<SetStateAction<number>>;
  readonly setToast: SetToast;
}) => {
  if (isFlushingRef.current) {
    return;
  }

  isFlushingRef.current = true;

  try {
    while (ratingQueueRef.current.length > 0) {
      const queuedRating = ratingQueueRef.current[0];

      if (!queuedRating) {
        break;
      }

      try {
        const { success } = await requestAuth();

        if (!success) {
          throw new Error("Quick vote couldn't verify your session.");
        }

        const response = await ratingMutation.mutateAsync({
          amount: queuedRating.amount,
          dropId: queuedRating.drop.id,
        });
        const appliedAmount = getQueuedRatingAppliedAmount({
          nextRating: response.context_profile_context?.rating,
          queuedRating,
        });
        const nextRemainingPower = Math.max(
          0,
          queuedRating.remainingPower - appliedAmount
        );

        onRatingSuccess(
          queuedRating.drop,
          queuedRating.amount,
          nextRemainingPower,
          queuedRating.type
        );
      } catch (error) {
        setToast({
          message: getQueuedRatingErrorMessage({
            error,
            type: queuedRating.type,
          }),
          type: "error",
        });
        onRatingFailure(
          queuedRating.drop,
          queuedRating.amount,
          queuedRating.type
        );
      } finally {
        ratingQueueRef.current.shift();
        queuedDropIdsRef.current.delete(queuedRating.drop.id);
        setPendingDropIds((current) =>
          current.filter((dropId) => dropId !== queuedRating.drop.id)
        );
        setPendingRatingCount(ratingQueueRef.current.length);
      }
    }
  } finally {
    isFlushingRef.current = false;
  }
};

const queueMemesQuickVoteRating = ({
  amount,
  drop,
  flushQueuedRatings,
  onRatingQueued,
  queuedDropIdsRef,
  ratingQueueRef,
  setAndPersistRecentAmounts,
  setPendingDropIds,
  setPendingRatingCount,
  type,
}: {
  readonly amount: number;
  readonly drop: ExtendedDrop;
  readonly flushQueuedRatings: () => void;
  readonly onRatingQueued: UseMemesQuickVoteSubmitOptions["onRatingQueued"];
  readonly queuedDropIdsRef: RefValue<Set<string>>;
  readonly ratingQueueRef: RefValue<QueuedRating[]>;
  readonly setAndPersistRecentAmounts: PersistNumberArray;
  readonly setPendingDropIds: Dispatch<SetStateAction<string[]>>;
  readonly setPendingRatingCount: Dispatch<SetStateAction<number>>;
  readonly type: QueuedRating["type"];
}): boolean => {
  if (queuedDropIdsRef.current.has(drop.id)) {
    return false;
  }

  ratingQueueRef.current.push({
    amount,
    currentRating: drop.context_profile_context?.rating ?? 0,
    drop,
    remainingPower: getQuickVoteAbsoluteRemainingPower(
      getQuickVoteRatingRange(drop)
    ),
    type,
  });
  queuedDropIdsRef.current.add(drop.id);
  setPendingDropIds((current) =>
    current.includes(drop.id) ? current : [...current, drop.id]
  );
  setPendingRatingCount(ratingQueueRef.current.length);

  onRatingQueued(drop, amount, type);

  if (type === "vote") {
    setAndPersistRecentAmounts((current) =>
      addRecentQuickVoteAmount(current, amount)
    );
  }

  flushQueuedRatings();

  return true;
};

export const useMemesQuickVoteSubmit = ({
  requestAuth,
  setToast,
  setAndPersistRecentAmounts,
  onRatingFailure,
  onRatingQueued,
  onRatingSuccess,
}: UseMemesQuickVoteSubmitOptions): UseMemesQuickVoteSubmitResult => {
  const ratingQueueRef = useRef<QueuedRating[]>([]);
  const queuedDropIdsRef = useRef<Set<string>>(new Set());
  const isFlushingRef = useRef(false);
  const [pendingDropIds, setPendingDropIds] = useState<string[]>([]);
  const [pendingRatingCount, setPendingRatingCount] = useState(0);

  const ratingMutation = useMutation({
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

  const flushQueuedRatings = useCallback(() => {
    void flushMemesQuickVoteRatings({
      isFlushingRef,
      onRatingFailure,
      onRatingSuccess,
      queuedDropIdsRef,
      ratingMutation,
      ratingQueueRef,
      requestAuth,
      setPendingDropIds,
      setPendingRatingCount,
      setToast,
    });
  }, [
    isFlushingRef,
    onRatingFailure,
    onRatingSuccess,
    queuedDropIdsRef,
    ratingMutation,
    ratingQueueRef,
    requestAuth,
    setPendingDropIds,
    setPendingRatingCount,
    setToast,
  ]);

  const queueRating = useCallback(
    ({
      amount,
      drop,
      type,
    }: {
      readonly amount: number;
      readonly drop: ExtendedDrop;
      readonly type: QueuedRating["type"];
    }): boolean => {
      return queueMemesQuickVoteRating({
        amount,
        drop,
        flushQueuedRatings,
        onRatingQueued,
        queuedDropIdsRef,
        ratingQueueRef,
        setAndPersistRecentAmounts,
        setPendingDropIds,
        setPendingRatingCount,
        type,
      });
    },
    [flushQueuedRatings, onRatingQueued, setAndPersistRecentAmounts]
  );

  const submitVote = useCallback(
    (drop: ExtendedDrop, amount: number | string) => {
      const normalizedAmount = normalizeQuickVoteAmount(
        amount,
        getQuickVoteRatingRange(drop)
      );

      if (normalizedAmount === null) {
        return Promise.resolve(false);
      }

      return Promise.resolve(
        queueRating({
          amount: normalizedAmount,
          drop,
          type: "vote",
        })
      );
    },
    [queueRating]
  );

  const submitSkip = useCallback(
    (drop: ExtendedDrop) =>
      Promise.resolve(
        queueRating({
          amount: 0,
          drop,
          type: "skip",
        })
      ),
    [queueRating]
  );

  return {
    isVoting: pendingRatingCount > 0 || ratingMutation.isPending,
    pendingDropIds,
    submitSkip,
    submitVote,
  };
};
