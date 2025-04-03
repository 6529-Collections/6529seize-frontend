import { useContext, useEffect, useState } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { AuthContext } from "../../../auth/Auth";
import { ReactQueryWrapperContext } from "../../../react-query-wrapper/ReactQueryWrapper";
import { DropRateChangeRequest } from "../../../../entities/IDrop";
import { useMutation } from "@tanstack/react-query";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { commonApiPost } from "../../../../services/api/common-api";

interface MyStreamWaveMyVoteInputProps {
  readonly drop: ExtendedDrop;
}
const DEFAULT_DROP_RATE_CATEGORY = "Rep";
const MyStreamWaveMyVoteInput: React.FC<MyStreamWaveMyVoteInputProps> = ({
  drop,
}) => {
  const { requestAuth, setToast, connectedProfile } = useContext(AuthContext);
  const { onDropRateChange } = useContext(ReactQueryWrapperContext);
  const [isProcessing, setIsProcessing] = useState(false);
  const currentVoteValue = drop.context_profile_context?.rating ?? 0;
  const minRating = drop.context_profile_context?.min_rating ?? 0;
  const maxRating = drop.context_profile_context?.max_rating ?? 0;
  const [voteValue, setVoteValue] = useState<number>(currentVoteValue);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (currentVoteValue !== voteValue) {
      setIsEditing(true);
    }
  }, [voteValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;

    if (inputValue === "" || inputValue === "-") {
      setVoteValue(inputValue as any);
      return;
    }

    const value = parseInt(inputValue);
    if (isNaN(value)) return;
    setVoteValue(Math.min(Math.max(value, minRating), maxRating));
  };

  const rateChangeMutation = useMutation({
    mutationFn: async (param: { rate: number }) =>
      await commonApiPost<DropRateChangeRequest, ApiDrop>({
        endpoint: `drops/${drop.id}/ratings`,
        body: {
          rating: param.rate,
          category: DEFAULT_DROP_RATE_CATEGORY,
        },
      }),
    onSuccess: (response: ApiDrop) => {
      onDropRateChange({
        drop: response,
        giverHandle: connectedProfile?.profile?.handle ?? null,
      });
    },
    onError: (error) => {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
      throw error;
    },
  });

  const handleSubmit = async () => {
    if (isProcessing) return;

    setIsProcessing(true);

    try {
      const { success } = await requestAuth();
      if (!success) {
        setIsProcessing(false);
        return;
      }

      await rateChangeMutation.mutateAsync({
        rate: voteValue,
      });
    } catch (error) {
      setToast({
        message: error as unknown as string,
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSubmit();
    }
  };

  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <div className="tw-relative tw-w-full xl:tw-max-w-24">
        <input
          onClick={(e) => {
            e.stopPropagation();
          }}
          type="text"
          value={voteValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          pattern="-?[0-9]*"
          inputMode="numeric"
          className="tw-w-full tw-px-3 tw-h-8 tw-bg-iron-900 tw-rounded-lg tw-text-iron-50 tw-placeholder-iron-400 tw-text-base tw-font-medium tw-border-0 tw-ring-1 tw-ring-iron-700 focus:tw-ring-primary-400 desktop-hover:hover:tw-ring-primary-400 tw-outline-none tw-transition-all desktop-hover:hover:tw-bg-iron-950/60 focus:tw-bg-iron-950/80"
        />
        <div className="tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-xs tw-text-iron-400 tw-pointer-events-none">
          TDH
        </div>
      </div>

      <div className="tw-flex tw-items-center tw-gap-x-3">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleSubmit();
          }}
          disabled={!isEditing || isProcessing}
          className="tw-border-0 tw-flex tw-items-center tw-justify-center tw-px-3 tw-h-8 tw-rounded-lg tw-bg-iron-800 tw-ring-1 tw-ring-iron-700 desktop-hover:hover:tw-ring-iron-600 tw-text-iron-300 desktop-hover:hover:tw-text-iron-100 tw-transition-all tw-duration-300 desktop-hover:hover:tw-scale-105 desktop-hover:hover:tw-bg-iron-800/90 active:tw-scale-95 tw-text-sm tw-font-medium"
          aria-label="Save vote changes"
        >
          Vote
        </button>
      </div>
    </div>
  );
};

export default MyStreamWaveMyVoteInput;
