"use client";

import { useContext, useState, useCallback, useRef, useEffect } from "react";
import { DropRateChangeRequest } from "../../../../../../entities/IDrop";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../../services/api/common-api";
import { AuthContext } from "../../../../../auth/Auth";
import dynamic from "next/dynamic";
import { ApiDrop } from "../../../../../../generated/models/ApiDrop";
import { useDropInteractionRules } from "../../../../../../hooks/drops/useDropInteractionRules";
import { DropVoteState } from "../../../../../../hooks/drops/types";

export const VOTE_STATE_ERRORS: Record<DropVoteState, string | null> = {
  [DropVoteState.NOT_LOGGED_IN]: "Connect your wallet to rate",
  [DropVoteState.NO_PROFILE]: "Create a profile to rate",
  [DropVoteState.PROXY]: "Proxy can't rate",
  [DropVoteState.CANT_VOTE]: "You are not eligible to rate",
  [DropVoteState.NO_CREDIT]: "You don't have enough credit to rate",
  [DropVoteState.CAN_VOTE]: null,
  [DropVoteState.IS_WINNER]: null,
  [DropVoteState.VOTING_NOT_STARTED]: "Voting has not started yet",
  [DropVoteState.VOTING_ENDED]: "Voting has ended",
};

const DropListItemRateGiveClap = dynamic(
  () => import("./clap/DropListItemRateGiveClap"),
  { ssr: false }
);

const DEFAULT_DROP_RATE_CATEGORY = "Rep";
const DEBOUNCE_DELAY = 300; // milliseconds

export default function DropListItemRateGiveSubmit({
  rate,
  drop,
  canVote,
  onSuccessfulRateChange,
  isMobile = false,
}: {
  readonly rate: number;
  readonly drop: ApiDrop;
  readonly canVote: boolean;
  readonly onSuccessfulRateChange: () => void;
  readonly isMobile?: boolean;
}) {
  const { requestAuth, setToast } = useContext(AuthContext);
  const [mutating, setMutating] = useState<boolean>(false);
  const [clickCount, setClickCount] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const { voteState } = useDropInteractionRules(drop);

  const rateChangeMutation = useMutation({
    mutationFn: async (param: { rate: number; category: string }) =>
      await commonApiPost<DropRateChangeRequest, ApiDrop>({
        endpoint: `drops/${drop.id}/ratings`,
        body: {
          rating: param.rate,
          category: param.category,
        },
      }),
    onSuccess: (response: ApiDrop) => {
      onSuccessfulRateChange();
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setMutating(false);
      setClickCount(0);
    },
  });

  const submitRate = useCallback(async () => {
    if (!canVote) {
      setToast({
        message: VOTE_STATE_ERRORS[voteState],
        type: "warning",
      });
      return;
    }
    if (!rate || mutating) return;
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }

    const previousRate = drop.context_profile_context?.rating ?? 0;
    const rateIncrement = rate * clickCount;
    const newRate = previousRate + rateIncrement;

    await rateChangeMutation.mutateAsync({
      rate: newRate,
      category: DEFAULT_DROP_RATE_CATEGORY,
    });
  }, [
    canVote,
    rate,
    mutating,
    requestAuth,
    drop,
    clickCount,
    rateChangeMutation,
    voteState,
    setToast,
  ]);

  useEffect(() => {
    if (clickCount > 0 && !mutating) {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        submitRate();
      }, DEBOUNCE_DELAY);
    }
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [clickCount, mutating, submitRate]);

  const onRateSubmit = () => {
    setClickCount((prevCount) => prevCount + 1);
  };

  return (
    <div>
      <DropListItemRateGiveClap
        rate={rate}
        onSubmit={onRateSubmit}
        voteState={voteState}
        canVote={canVote}
        isMobile={isMobile}
      />
    </div>
  );
}
