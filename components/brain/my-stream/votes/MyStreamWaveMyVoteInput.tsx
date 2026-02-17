"use client";

import { useContext, useState } from "react";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { AuthContext } from "@/components/auth/Auth";
import type { DropRateChangeRequest } from "@/entities/IDrop";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiPost } from "@/services/api/common-api";

interface MyStreamWaveMyVoteInputProps {
  readonly drop: ExtendedDrop;
  readonly isResetting?: boolean | undefined;
}

interface OptimisticVoteState {
  readonly dropId: string;
  readonly baseCurrentVoteValue: number;
  readonly baseMaxRating: number;
  readonly nextCurrentVoteValue: number;
  readonly nextMaxRating: number;
}

interface VoteDraftState {
  readonly sourceKey: string;
  readonly value: string;
}

const DEFAULT_DROP_RATE_CATEGORY = "Rep";
const MyStreamWaveMyVoteInput: React.FC<MyStreamWaveMyVoteInputProps> = ({
  drop,
  isResetting = false,
}) => {
  const { requestAuth, setToast } = useContext(AuthContext);
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [optimisticVoteState, setOptimisticVoteState] =
    useState<OptimisticVoteState | null>(null);
  const [voteDraftState, setVoteDraftState] = useState<VoteDraftState | null>(
    null
  );
  const currentVoteValue = drop.context_profile_context?.rating ?? 0;
  const minRating = drop.context_profile_context?.min_rating ?? 0;
  const maxRating = drop.context_profile_context?.max_rating ?? 0;
  const hasMatchingOptimisticState =
    optimisticVoteState !== null &&
    optimisticVoteState.dropId === drop.id &&
    optimisticVoteState.baseCurrentVoteValue === currentVoteValue &&
    optimisticVoteState.baseMaxRating === maxRating;
  const liveCurrentVoteValue = hasMatchingOptimisticState
    ? optimisticVoteState.nextCurrentVoteValue
    : currentVoteValue;
  const liveMaxRating = hasMatchingOptimisticState
    ? optimisticVoteState.nextMaxRating
    : maxRating;
  const liveCurrentVoteValueString = String(liveCurrentVoteValue);
  const voteSourceKey = `${drop.id}:${liveCurrentVoteValue}:${liveMaxRating}`;
  const voteValue =
    voteDraftState?.sourceKey === voteSourceKey
      ? voteDraftState.value
      : liveCurrentVoteValueString;
  const parsedVoteValue = Number.parseInt(voteValue, 10);
  const hasValidVoteValue = !Number.isNaN(parsedVoteValue);
  const isEditing =
    hasValidVoteValue && parsedVoteValue !== liveCurrentVoteValue;
  const availableVotes = Math.max(0, liveMaxRating - liveCurrentVoteValue);

  const setVoteDraftValue = (nextValue: string) => {
    setVoteDraftState({
      sourceKey: voteSourceKey,
      value: nextValue,
    });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    if (inputValue === "") {
      setVoteDraftValue("");
      return;
    }

    if (inputValue === "-") {
      setVoteDraftValue(inputValue);
      return;
    }

    const value = Number.parseInt(inputValue, 10);
    if (Number.isNaN(value)) return;
    const clampedValue = Math.min(Math.max(value, minRating), liveMaxRating);
    setVoteDraftValue(String(clampedValue));
  };

  const handleBlur = () => {
    if (!hasValidVoteValue || voteValue === "" || voteValue === "-") {
      setVoteDraftState(null);
      return;
    }

    const clampedValue = Math.min(
      Math.max(parsedVoteValue, minRating),
      liveMaxRating
    );
    if (clampedValue === liveCurrentVoteValue) {
      setVoteDraftState(null);
      return;
    }

    setVoteDraftValue(String(clampedValue));
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
    onSuccess: (response: ApiDrop, variables: { rate: number }) => {
      const nextVoteValue =
        response.context_profile_context?.rating ?? variables.rate;
      const nextMaxRating =
        response.context_profile_context?.max_rating ?? liveMaxRating;
      setOptimisticVoteState({
        dropId: drop.id,
        baseCurrentVoteValue: currentVoteValue,
        baseMaxRating: maxRating,
        nextCurrentVoteValue: nextVoteValue,
        nextMaxRating,
      });
      setVoteDraftState(null);
      setToast({
        message: "Vote updated",
        type: "success",
      });
      void queryClient.invalidateQueries({
        queryKey: [QueryKey.DROPS_LEADERBOARD],
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
    if (isProcessing || isResetting) return;

    if (!hasValidVoteValue) {
      setVoteDraftState(null);
      return;
    }

    const clampedValue = Math.min(
      Math.max(parsedVoteValue, minRating),
      liveMaxRating
    );
    if (clampedValue === liveCurrentVoteValue) {
      setVoteDraftState(null);
    } else {
      setVoteDraftValue(String(clampedValue));
    }

    setIsProcessing(true);

    try {
      const { success } = await requestAuth();
      if (!success) {
        setToast({
          message: "Authentication failed",
          type: "error",
        });
        setIsProcessing(false);
        return;
      }

      await rateChangeMutation.mutateAsync({
        rate: clampedValue,
      });
    } catch (error) {
      console.error("Failed to submit vote:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Something went wrong";
      setToast({
        message: errorMessage,
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleSubmit();
    }
  };
  return (
    <div className="tw-flex tw-flex-col tw-gap-y-1.5">
      <div className="tw-flex tw-items-center tw-gap-x-3">
        <div className="tw-relative tw-w-full md:tw-w-36">
          <input
            onClick={(e) => {
              e.stopPropagation();
            }}
            type="text"
            value={voteValue}
            onChange={handleInputChange}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={isResetting}
            pattern="-?[0-9]*"
            inputMode="numeric"
            className="tw-h-8 tw-w-full tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-text-base tw-font-medium tw-text-iron-50 tw-placeholder-iron-400 tw-outline-none tw-ring-1 tw-ring-iron-700 tw-transition-all focus:tw-bg-iron-950/80 focus:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-950/60 desktop-hover:hover:tw-ring-primary-400"
          />
          <div className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-xs tw-text-iron-400">
            TDH
          </div>
        </div>

        <div className="tw-flex tw-items-center">
          <button
            onClick={(e) => {
              e.stopPropagation();
              void handleSubmit();
            }}
            disabled={!isEditing || isProcessing || isResetting}
            className="tw-flex tw-h-8 tw-min-w-[60px] tw-items-center tw-justify-center tw-rounded-lg tw-border-0 tw-bg-iron-800 tw-px-3 tw-text-sm tw-font-medium tw-text-iron-300 tw-ring-1 tw-ring-iron-700 tw-transition-all tw-duration-300 active:tw-scale-95 desktop-hover:hover:tw-scale-105 desktop-hover:hover:tw-bg-iron-800/90 desktop-hover:hover:tw-text-iron-100 desktop-hover:hover:tw-ring-iron-600"
            aria-label="Submit vote"
          >
            {isProcessing || isResetting ? (
              <svg
                aria-hidden="true"
                role="status"
                className="tw-absolute tw-inline tw-h-5 tw-w-5 tw-animate-spin tw-text-primary-400"
                viewBox="0 0 100 101"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  className="tw-text-iron-600"
                  d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z"
                  fill="currentColor"
                ></path>
                <path
                  d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z"
                  fill="currentColor"
                ></path>
              </svg>
            ) : (
              "Vote"
            )}
          </button>
        </div>
      </div>
      <p className="tw-mb-0 tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-0.5 tw-text-xs tw-text-iron-500">
        <span>
          Available{" "}
          <span className="tw-tabular-nums tw-text-iron-300">
            {formatNumberWithCommas(availableVotes)}
          </span>
        </span>
        <span>
          Max{" "}
          <span className="tw-tabular-nums tw-text-iron-300">
            {formatNumberWithCommas(liveMaxRating)}
          </span>
        </span>
      </p>
    </div>
  );
};

export default MyStreamWaveMyVoteInput;
