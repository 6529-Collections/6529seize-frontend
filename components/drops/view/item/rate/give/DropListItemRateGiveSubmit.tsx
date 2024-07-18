import { useContext, useState } from "react";
import { DropRateChangeRequest } from "../../../../../../entities/IDrop";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../../services/api/common-api";
import { AuthContext } from "../../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import dynamic from "next/dynamic";
import { Drop } from "../../../../../../generated/models/Drop";
import { DropVoteState, VOTE_STATE_ERRORS } from "../../DropsListItem";

const DropListItemRateGiveClap = dynamic(
  () => import("./clap/DropListItemRateGiveClap"),
  { ssr: false }
);

const DEFAULT_DROP_RATE_CATEGORY = "Rep";

export default function DropListItemRateGiveSubmit({
  rate,
  drop,
  voteState,
  availableCredit,
  canVote,
  onSuccessfulRateChange,
}: {
  readonly rate: number;
  readonly drop: Drop;
  readonly availableCredit: number;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
  readonly onSuccessfulRateChange: () => void;
}) {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { onDropChange } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState<boolean>(false);

  const rateChangeMutation = useMutation({
    mutationFn: async (param: { rate: number; category: string }) =>
      await commonApiPost<DropRateChangeRequest, Drop>({
        endpoint: `drops/${drop.id}/ratings`,
        body: {
          rating: param.rate,
          category: param.category,
        },
      }),
    onSuccess: (response: Drop) => {
      setToast({
        message: "Voted successfully.",
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
    },
  });

  const onRateSubmit = async () => {
    if (!canVote) {
      setToast({
        message: VOTE_STATE_ERRORS[voteState],
        type: "warning",
      });
      return;
    }
    if (!rate) return;
    if (mutating) return;
    setMutating(true);
    const { success } = await requestAuth();
    if (!success) {
      setMutating(false);
      return;
    }

    const previousRate =
      drop.context_profile_context?.categories?.find(
        (c) => c.category === DEFAULT_DROP_RATE_CATEGORY
      )?.rating ?? 0;

    const newRate = previousRate + rate;

    await rateChangeMutation.mutateAsync({
      rate: newRate,
      category: DEFAULT_DROP_RATE_CATEGORY,
    });
  };

  return (
    <div>
      <DropListItemRateGiveClap
        rate={rate}
        onSubmit={onRateSubmit}
        voteState={voteState}
        canVote={canVote}
        availableCredit={availableCredit}
      />
    </div>
  );
}
