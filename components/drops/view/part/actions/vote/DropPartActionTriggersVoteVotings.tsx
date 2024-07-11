import { useContext, useState } from "react";
import { Drop } from "../../../../../../generated/models/Drop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import { AuthContext } from "../../../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../../../services/api/common-api";
import { DropRateChangeRequest } from "../../../../../../entities/IDrop";
import { ProfileConnectedStatus } from "../../../../../../entities/IProfile";
import Tippy from "@tippyjs/react";
import DropPartActionTriggersVoteVotingsSubmit from "./DropPartActionTriggersVoteVotingsSubmit";
import { DropVoteState } from "../../../item/DropsListItem";

const DEFAULT_DROP_RATE_CATEGORY = "Rep";

export default function DropPartActionTriggersVoteVotings({
  drop,
  voteState,
  canVote,
}: {
  readonly drop: Drop;
  readonly voteState: DropVoteState;
  readonly canVote: boolean;
}) {
  const { requestAuth, setToast, connectedProfile, connectionStatus } =
    useContext(AuthContext);
  const { onDropChange } = useContext(ReactQueryWrapperContext);
  const [loading, setLoading] = useState<boolean>(false);

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
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    },
    onSettled: () => {
      setLoading(false);
    },
  });

  const onRateSubmit = async () => {
    if (connectionStatus === ProfileConnectedStatus.NOT_CONNECTED) {
      setToast({
        message: "Connect your wallet to vote",
        type: "warning",
      });
      return;
    }
    if (connectionStatus === ProfileConnectedStatus.NO_PROFILE) {
      setToast({
        message: "Create a profile to vote",
        type: "warning",
      });
      return;
    }
    if (connectionStatus === ProfileConnectedStatus.PROXY) {
      setToast({
        message: "Proxy can't vote",
        type: "warning",
      });
      return;
    }
    if (loading) return;
    setLoading(true);
    const { success } = await requestAuth();
    if (!success) {
      setLoading(false);
      return;
    }

    const previousRate =
      drop.context_profile_context?.categories?.find(
        (c) => c.category === DEFAULT_DROP_RATE_CATEGORY
      )?.rating ?? 0;

    const newRate = previousRate + 1;

    await rateChangeMutation.mutateAsync({
      rate: newRate,
      category: DEFAULT_DROP_RATE_CATEGORY,
    });
  };
  return (
    <>
      <button
        type="button"
        disabled={!canVote || loading}
        onClick={onRateSubmit}
        className={`${
          canVote && "icon"
        } tw-text-iron-500 tw-p-0 tw-group tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300`}
      >
        <>
          <DropPartActionTriggersVoteVotingsSubmit
            drop={drop}
            voteState={voteState}
            canVote={canVote}
          />

          <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-500 tw-text-xs tw-font-normal">
            {!!drop.rating && (
              <Tippy content="Total">
                <span>{formatNumberWithCommas(drop.rating)}</span>
              </Tippy>
            )}
            {!!drop.context_profile_context?.rating && (
              <div
                className={`${
                  drop.context_profile_context.rating > 0
                    ? "tw-bg-green/10"
                    : "tw-bg-red/10"
                } tw-ml-2 tw-rounded-full tw-w-auto tw-px-1 tw-transition tw-ease-out tw-duration-300`}
              >
                <Tippy content="Your given votes">
                  <span
                    className={`${
                      drop.context_profile_context.rating > 0
                        ? "tw-text-green"
                        : "tw-text-error"
                    }`}
                  >
                    {formatNumberWithCommas(
                      drop.context_profile_context.rating
                    )}
                  </span>
                </Tippy>
              </div>
            )}
          </div>
        </>
      </button>
    </>
  );
}
