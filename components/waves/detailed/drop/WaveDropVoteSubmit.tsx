import { FC, useContext, useState } from "react";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import { useMutation } from "@tanstack/react-query";
import { commonApiPost } from "../../../../services/api/common-api";
import { DropRateChangeRequest } from "../../../../entities/IDrop";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import CircleLoader from "../../../distribution-plan-tool/common/CircleLoader";

interface WaveDropVoteSubmitProps {
  readonly rate: number;
  readonly dropId: string;
  readonly onSubmit: () => void;
}

const DEFAULT_DROP_RATE_CATEGORY = "Rep";

export const WaveDropVoteSubmit: FC<WaveDropVoteSubmitProps> = ({
  rate,
  dropId,
  onSubmit,
}) => {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { onDropRateChange } = useContext(ReactQueryWrapperContext);
  const [mutating, setMutating] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);

  const rateChangeMutation = useMutation({
    mutationFn: async (param: { rate: number; category: string }) =>
      await commonApiPost<DropRateChangeRequest, ApiDrop>({
        endpoint: `drops/${dropId}/ratings`,
        body: {
          rating: param.rate,
          category: param.category,
        },
      }),
    onSuccess: (response: ApiDrop) => {
      setSuccess(true);
      setToast({
        message: `Voted successfully`,
        type: "success",
      });
      onDropRateChange({
        drop: response,
        giverHandle: connectedProfile?.profile?.handle ?? null,
      });
      setTimeout(() => {
        onSubmit();
      }, 1000);
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

  const disabled = false;

  const handleSubmit = async () => {
    if (mutating || !rate) return;
    setMutating(true);
    await rateChangeMutation.mutateAsync({ rate, category: DEFAULT_DROP_RATE_CATEGORY });
  };

  return (
    <div
      className={`${
        disabled || mutating
          ? "tw-from-primary-400/50 tw-to-primary-500/50"
          : " tw-from-primary-400 tw-to-primary-500"
      } tw-p-[1px] tw-w-16 tw-flex tw-rounded-lg tw-bg-gradient-to-b`}
    >
      <button
        onClick={handleSubmit}
        disabled={disabled || mutating}
        type="button"
        className={`${
          disabled || mutating
            ? "tw-opacity-30 tw-text-iron-300"
            : "tw-text-white desktop-hover:hover:tw-bg-primary-600 desktop-hover:hover:tw-border-primary-600"
        } tw-flex tw-w-16 tw-gap-x-1.5 tw-items-center tw-justify-center tw-border tw-border-solid tw-border-primary-500 tw-rounded-lg tw-bg-primary-500 tw-py-2 tw-px-3 tw-text-sm tw-font-semibold tw-shadow-sm focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-primary-600 tw-transition tw-duration-300 tw-ease-out`}
      >
        {mutating ? <CircleLoader /> : "Vote!"}
      </button>
    </div>
  );
};
