import { useContext, useState, useCallback, useRef, useEffect } from "react";
import { DropRateChangeRequest } from "../../../../../../entities/IDrop";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../../services/api/common-api";
import { AuthContext } from "../../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import dynamic from "next/dynamic";
import { ApiDrop } from "../../../../../../generated/models/ApiDrop";
import { DropVoteState, VOTE_STATE_ERRORS } from "../../DropsListItem";

const DropListItemRateGiveClap = dynamic(
  () => import("./clap/DropListItemRateGiveClap"),
  { ssr: false }
);

const DEFAULT_DROP_RATE_CATEGORY = "Rep";
const DEBOUNCE_DELAY = 300; // milliseconds

export default function DropListItemRateGiveSubmit({
  rate,
  drop,
  voteState,
  availableCredit,
  canVote,
  onSuccessfulRateChange,
  isMobile = false
}: {
  readonly rate: number;
  readonly drop: ApiDrop;
  readonly availableCredit: number;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly onSuccessfulRateChange: () => void;
  readonly isMobile?: boolean;
}) {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { onDropChange } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState<boolean>(false);
  const [clickCount, setClickCount] = useState<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      setToast({
        message: `Voted successfully`,
        type: "success",
      });
      onDropChange({
        drop: response,
        giverHandle: connectedProfile?.profile?.handle ?? null,
      });
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
  }, [canVote, rate, mutating, requestAuth, drop, clickCount, rateChangeMutation, voteState, setToast]);

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
        availableCredit={availableCredit}
        isMobile={isMobile}
      />
    </div>
  );
}
