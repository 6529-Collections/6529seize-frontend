import { useContext, useState } from "react";
import { Drop } from "../../../../../../generated/models/Drop";
import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import RateClapOutlineIcon from "../../../../../utils/icons/RateClapOutlineIcon";
import RateClapSolidIcon from "../../../../../utils/icons/RateClapSolidIcon";
import { AuthContext } from "../../../../../auth/Auth";
import {
  QueryKey,
  ReactQueryWrapperContext,
} from "../../../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  commonApiFetch,
  commonApiPost,
} from "../../../../../../services/api/common-api";
import { DropRateChangeRequest } from "../../../../../../entities/IDrop";
import {
  ProfileAvailableDropRateResponse,
  ProfileConnectedStatus,
} from "../../../../../../entities/IProfile";
import Tippy from "@tippyjs/react";
import DropPartActionTriggersVoteVotingsSubmit from "./DropPartActionTriggersVoteVotingsSubmit";

const DEFAULT_DROP_RATE_CATEGORY = "Rep";

export default function DropPartActionTriggersVoteVotings({
  drop,
}: {
  readonly drop: Drop;
}) {
  const { requestAuth, setToast, connectedProfile, connectionStatus } =
    useContext(AuthContext);
  const { onDropChange } = useContext(ReactQueryWrapperContext);
  const [loading, setLoading] = useState<boolean>(false);

  const { data: availableRateResponse } =
    useQuery<ProfileAvailableDropRateResponse>({
      queryKey: [
        QueryKey.PROFILE_AVAILABLE_DROP_RATE,
        connectedProfile?.profile?.handle,
      ],
      queryFn: async () =>
        await commonApiFetch<ProfileAvailableDropRateResponse>({
          endpoint: `profiles/${connectedProfile?.profile?.handle}/drops/available-credit-for-rating`,
        }),
      enabled: !!connectedProfile?.profile?.handle,
    });

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
        onClick={onRateSubmit}
        className="tw-text-iron-500 icon tw-px-0 tw-group tw-bg-transparent tw-border-0 tw-flex tw-items-center tw-gap-x-2 tw-text-[0.8125rem] tw-leading-5 tw-font-medium tw-transition tw-ease-out tw-duration-300"
      >
        <>
          <DropPartActionTriggersVoteVotingsSubmit drop={drop} />

          <div className="tw-flex tw-items-center tw-justify-center tw-rounded-full tw-text-iron-500 tw-text-xs tw-font-normal">
            {!!drop.rating && (
              <Tippy content="Total">
                <span>{formatNumberWithCommas(drop.rating)}</span>
              </Tippy>
            )}
            {!!drop.context_profile_context?.rating && (
              <div className="tw-ml-2 tw-bg-primary-400/10 tw-rounded-full tw-w-auto tw-px-1 tw-py-0.5">
                <Tippy content="Your given votes">
                  <span className="tw-text-primary-400">
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
