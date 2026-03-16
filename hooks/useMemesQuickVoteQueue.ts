"use client";

import { AuthContext } from "@/components/auth/Auth";
import { ReactQueryWrapperContext } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { DropRateChangeRequest } from "@/entities/IDrop";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  addRecentQuickVoteAmount,
  appendSkippedSerial,
  buildMemesQuickVoteQueue,
  deriveMemesQuickVoteStats,
  getDisplayQuickVoteAmounts,
  normalizeQuickVoteAmount,
} from "@/hooks/memesQuickVote.helpers";
import { useMemesWaveParticipatoryDrops } from "@/hooks/useMemesWaveParticipatoryDrops";
import { useMemesQuickVoteStorage } from "@/hooks/useMemesQuickVoteStorage";
import { commonApiPost } from "@/services/api/common-api";
import { useMutation } from "@tanstack/react-query";
import { useCallback, useContext, useMemo, useState } from "react";

const DEFAULT_DROP_RATE_CATEGORY = "Rep";

type UseMemesQuickVoteQueueResult = {
  readonly activeDrop: ExtendedDrop | null;
  readonly queue: ExtendedDrop[];
  readonly isReady: boolean;
  readonly isLoading: boolean;
  readonly isVoting: boolean;
  readonly latestUsedAmount: number | null;
  readonly recentAmounts: number[];
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
  readonly submitVote: (
    drop: ExtendedDrop,
    amount: number | string
  ) => Promise<boolean>;
  readonly skipDrop: (drop: ExtendedDrop) => void;
};

export const useMemesQuickVoteQueue = (): UseMemesQuickVoteQueueResult => {
  const { requestAuth, setToast } = useContext(AuthContext);
  const { invalidateDrops } = useContext(ReactQueryWrapperContext);
  const {
    drops,
    contextProfile,
    isPending,
    isRefetching,
    memesWaveId,
    refetch,
  } = useMemesWaveParticipatoryDrops();

  const [dismissedSerials, setDismissedSerials] = useState<number[]>([]);
  const {
    liveSkippedSerials,
    recentAmountsByRecency,
    setAndPersistRecentAmounts,
    setAndPersistSkippedSerials,
  } = useMemesQuickVoteStorage({
    drops,
    contextProfile,
    memesWaveId,
  });

  const rawQueue = useMemo(
    () => buildMemesQuickVoteQueue(drops, liveSkippedSerials),
    [drops, liveSkippedSerials]
  );

  const queue = useMemo(() => {
    if (dismissedSerials.length === 0) {
      return rawQueue;
    }

    const dismissedSet = new Set(dismissedSerials);
    return rawQueue.filter((drop) => !dismissedSet.has(drop.serial_no));
  }, [dismissedSerials, rawQueue]);

  const stats = useMemo(() => deriveMemesQuickVoteStats(drops), [drops]);
  const activeDrop = queue[0] ?? null;
  const recentAmounts = useMemo(
    () => getDisplayQuickVoteAmounts(recentAmountsByRecency),
    [recentAmountsByRecency]
  );
  const latestUsedAmount = recentAmountsByRecency.at(-1) ?? null;

  const voteMutation = useMutation({
    mutationFn: async ({
      dropId,
      amount,
    }: {
      readonly dropId: string;
      readonly amount: number;
    }) =>
      await commonApiPost<DropRateChangeRequest, ApiDrop>({
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

  const markDismissed = useCallback((serialNo: number) => {
    setDismissedSerials((current) =>
      current.includes(serialNo) ? current : [...current, serialNo]
    );
  }, []);

  const submitVote = useCallback(
    async (drop: ExtendedDrop, amount: number | string) => {
      const maxRating = drop.context_profile_context?.max_rating ?? 0;
      const normalizedAmount = normalizeQuickVoteAmount(amount, maxRating);

      if (normalizedAmount === null) {
        return false;
      }

      const { success } = await requestAuth();

      if (!success) {
        return false;
      }

      try {
        await voteMutation.mutateAsync({
          dropId: drop.id,
          amount: normalizedAmount,
        });
      } catch {
        return false;
      }

      markDismissed(drop.serial_no);
      setAndPersistRecentAmounts((current) =>
        addRecentQuickVoteAmount(current, normalizedAmount)
      );
      setAndPersistSkippedSerials((current) =>
        current.filter((serialNo) => serialNo !== drop.serial_no)
      );
      invalidateDrops();
      void refetch();

      return true;
    },
    [
      invalidateDrops,
      markDismissed,
      refetch,
      requestAuth,
      setAndPersistRecentAmounts,
      setAndPersistSkippedSerials,
      voteMutation,
    ]
  );

  const skipDrop = useCallback(
    (drop: ExtendedDrop) => {
      markDismissed(drop.serial_no);
      setAndPersistSkippedSerials((current) =>
        appendSkippedSerial(current, drop.serial_no)
      );
    },
    [markDismissed, setAndPersistSkippedSerials]
  );

  return {
    activeDrop,
    queue,
    isReady: typeof stats.uncastPower === "number" && queue.length > 0,
    isLoading: isPending || isRefetching,
    isVoting: voteMutation.isPending,
    latestUsedAmount,
    recentAmounts,
    uncastPower: stats.uncastPower,
    votingLabel: stats.votingLabel,
    submitVote,
    skipDrop,
  };
};
