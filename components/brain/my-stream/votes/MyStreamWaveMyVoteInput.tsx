"use client";

import { useContext, useId, useState } from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { AuthContext } from "@/components/auth/Auth";
import type { DropRateChangeRequest } from "@/entities/IDrop";
import { getToastErrorDetails } from "@/helpers/toast.helpers";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { commonApiPost } from "@/services/api/common-api";
import { applyWaveDropVoteUpdate } from "@/hooks/waves/invalidateWaveApprovalStatusQueries";
import {
  getWaveVoteScopeMaxLabel,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import Button from "@/components/utils/button/Button";
import BodyPortalTooltip from "@/components/utils/tooltip/BodyPortalTooltip";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";

interface MyStreamWaveMyVoteInputProps {
  readonly drop: ExtendedDrop;
  readonly isResetting?: boolean | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly onExplainVote?:
    | ((voteTotal: number, voteChange: number) => void)
    | undefined;
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

interface LastAppliedVoteChange {
  readonly dropId: string;
  readonly voteTotal: number;
  readonly voteChange: number;
}

interface VoteMutationVariables {
  readonly rate: number;
  readonly previousRate: number;
}

const getRationaleVoteChange = (
  lastAppliedVoteChange: LastAppliedVoteChange | null,
  dropId: string,
  currentVoteValue: number
): number =>
  lastAppliedVoteChange?.dropId === dropId &&
  lastAppliedVoteChange.voteTotal === currentVoteValue
    ? lastAppliedVoteChange.voteChange
    : 0;

const DEFAULT_DROP_RATE_CATEGORY = "Rep";
const MyStreamWaveMyVoteInput: React.FC<MyStreamWaveMyVoteInputProps> = ({
  drop,
  isResetting = false,
  isVotingClosed = false,
  onExplainVote,
}) => {
  const locale = useBrowserLocale();
  const explainTooltipId = useId();
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isVoteInputFocused, setIsVoteInputFocused] = useState(false);
  const [voteLimitMessage, setVoteLimitMessage] = useState<string | null>(null);
  const [optimisticVoteState, setOptimisticVoteState] =
    useState<OptimisticVoteState | null>(null);
  const [voteDraftState, setVoteDraftState] = useState<VoteDraftState | null>(
    null
  );
  const [lastAppliedVoteChange, setLastAppliedVoteChange] =
    useState<LastAppliedVoteChange | null>(null);
  const rawCurrentVoteValue = drop.context_profile_context?.rating ?? 0;
  const rawMinRating = drop.context_profile_context?.min_rating ?? 0;
  const maxRating = drop.context_profile_context?.max_rating ?? 0;
  const minRating = drop.wave.forbid_negative_votes
    ? Math.max(0, rawMinRating)
    : rawMinRating;
  const currentVoteValue = rawCurrentVoteValue;
  const hasMatchingOptimisticState =
    optimisticVoteState !== null &&
    optimisticVoteState.dropId === drop.id &&
    optimisticVoteState.baseCurrentVoteValue === currentVoteValue &&
    optimisticVoteState.baseMaxRating === maxRating;
  const {
    nextCurrentVoteValue: liveCurrentVoteValue,
    nextMaxRating: liveMaxRating,
  } = hasMatchingOptimisticState
    ? optimisticVoteState
    : { nextCurrentVoteValue: currentVoteValue, nextMaxRating: maxRating };
  const liveCurrentVoteValueString = String(liveCurrentVoteValue);
  const voteSourceKey = `${drop.id}:${liveCurrentVoteValue}:${minRating}:${liveMaxRating}`;
  const { value: voteValue, limitMessage: activeVoteLimitMessage } =
    voteDraftState?.sourceKey === voteSourceKey
      ? { value: voteDraftState.value, limitMessage: voteLimitMessage }
      : { value: liveCurrentVoteValueString, limitMessage: null };
  const parsedVoteValue = Number.parseInt(voteValue, 10);
  const hasValidVoteValue = !Number.isNaN(parsedVoteValue);
  const isVoteValueOutOfRange =
    parsedVoteValue < minRating || parsedVoteValue > liveMaxRating;
  const displayVoteValue =
    isVoteInputFocused ||
    voteValue === "" ||
    voteValue === "-" ||
    !hasValidVoteValue
      ? voteValue
      : formatInteger(locale, parsedVoteValue);
  const isEditing =
    hasValidVoteValue && parsedVoteValue !== liveCurrentVoteValue;
  const voteLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const maxRatingLabel = getWaveVoteScopeMaxLabel(
    drop.wave.voting_credit_scope
  );
  const voteInputId = `my-vote-input-${drop.id}`;
  const maxRatingId = `${voteInputId}-max`;
  const voteLimitMessageId = `${voteInputId}-limit`;

  const setVoteDraftValue = (nextValue: string) => {
    setVoteDraftState({
      sourceKey: voteSourceKey,
      value: nextValue,
    });
  };

  const clampVoteValue = (value: number) => {
    return Math.min(Math.max(value, minRating), liveMaxRating);
  };

  const getVoteLimitMessage = (value: number) => {
    if (value > liveMaxRating) {
      return t(locale, "waves.myVotes.limit.maximum", {
        label: maxRatingLabel,
        value: formatInteger(locale, liveMaxRating),
        credit: voteLabel,
      });
    }

    if (value < minRating) {
      return t(locale, "waves.myVotes.limit.minimum", {
        value: formatInteger(locale, minRating),
        credit: voteLabel,
      });
    }

    return null;
  };

  const displayedVoteLimitMessage =
    getVoteLimitMessage(parsedVoteValue) ?? activeVoteLimitMessage;
  const voteInputDescription = displayedVoteLimitMessage
    ? `${maxRatingId} ${voteLimitMessageId}`
    : maxRatingId;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isVotingClosed) {
      return;
    }

    const inputValue = e.target.value.replaceAll(",", "").trim();
    if (inputValue === "") {
      setVoteLimitMessage(null);
      setVoteDraftValue("");
      return;
    }

    if (inputValue === "-") {
      setVoteLimitMessage(null);
      setVoteDraftValue(inputValue);
      return;
    }

    if (!/^-?\d+$/.test(inputValue)) return;

    const value = Number.parseInt(inputValue, 10);
    if (Number.isNaN(value)) return;
    setVoteLimitMessage(getVoteLimitMessage(value));
    setVoteDraftValue(String(clampVoteValue(value)));
  };

  const handleBlur = () => {
    setIsVoteInputFocused(false);

    if (isVotingClosed) {
      return;
    }

    if (!hasValidVoteValue || voteValue === "" || voteValue === "-") {
      setVoteLimitMessage(null);
      setVoteDraftState(null);
      return;
    }

    if (parsedVoteValue === liveCurrentVoteValue) {
      setVoteLimitMessage(null);
      setVoteDraftState(null);
      return;
    }

    const clampedValue = clampVoteValue(parsedVoteValue);
    setVoteLimitMessage(displayedVoteLimitMessage);
    setVoteDraftValue(String(clampedValue));
  };

  const rateChangeMutation = useMutation({
    mutationFn: async (param: VoteMutationVariables) =>
      await commonApiPost<DropRateChangeRequest, ApiDrop>({
        endpoint: `drops/${drop.id}/ratings`,
        body: {
          rating: param.rate,
          category: DEFAULT_DROP_RATE_CATEGORY,
        },
      }),
    onSuccess: (response: ApiDrop, variables: VoteMutationVariables) => {
      const nextVoteValue =
        response.context_profile_context?.rating ?? variables.rate;
      const nextMaxRating =
        response.context_profile_context?.max_rating ?? liveMaxRating;
      setLastAppliedVoteChange({
        dropId: drop.id,
        voteTotal: nextVoteValue,
        voteChange: nextVoteValue - variables.previousRate,
      });
      setOptimisticVoteState({
        dropId: drop.id,
        baseCurrentVoteValue: currentVoteValue,
        baseMaxRating: maxRating,
        nextCurrentVoteValue: nextVoteValue,
        nextMaxRating,
      });
      setVoteDraftState(null);
      setVoteLimitMessage(null);
      setToast({
        message: t(locale, "waves.myVotes.voteUpdated"),
        type: "success",
      });
      applyWaveDropVoteUpdate(queryClient, response, drop.wave.id, {
        contextProfile: activeProfileProxy
          ? undefined
          : connectedProfile?.handle,
      });
    },
    onError: (error) => {
      setToast({
        type: "error",
        title: t(locale, "waves.myVotes.voteUpdateError"),
        description: t(locale, "waves.myVotes.tryAgain"),
        details: getToastErrorDetails(error),
      });
    },
  });

  const handleSubmit = async () => {
    if (isProcessing || isResetting || isVotingClosed) return;

    if (!hasValidVoteValue) {
      setVoteLimitMessage(null);
      setVoteDraftState(null);
      return;
    }

    if (parsedVoteValue === liveCurrentVoteValue) {
      setVoteLimitMessage(null);
      setVoteDraftState(null);
      return;
    }

    const clampedValue = clampVoteValue(parsedVoteValue);
    const nextVoteLimitMessage = getVoteLimitMessage(parsedVoteValue);
    setVoteDraftValue(String(clampedValue));
    setVoteLimitMessage(nextVoteLimitMessage);

    if (nextVoteLimitMessage) {
      return;
    }

    setIsProcessing(true);

    try {
      const { success } = await requestAuth();
      if (!success) {
        setToast({
          message: t(locale, "waves.myVotes.authError"),
          type: "error",
        });
        setIsProcessing(false);
        return;
      }

      await rateChangeMutation.mutateAsync({
        rate: clampedValue,
        previousRate: liveCurrentVoteValue,
      });
    } catch (error) {
      console.error("Failed to submit vote:", error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      void handleSubmit();
    }
  };

  const currentRationaleVoteChange = getRationaleVoteChange(
    lastAppliedVoteChange,
    drop.id,
    liveCurrentVoteValue
  );

  const canExplainVote =
    !!onExplainVote &&
    liveCurrentVoteValue !== 0 &&
    !isProcessing &&
    !isResetting &&
    !isVotingClosed;

  const handleExplainVote = () => {
    if (!onExplainVote || !canExplainVote) {
      return;
    }

    onExplainVote(liveCurrentVoteValue, currentRationaleVoteChange);
  };

  return (
    <div
      data-vote-controls
      className="tw-col-span-3 tw-row-start-3 tw-grid tw-w-full tw-min-w-0 tw-cursor-default tw-grid-cols-[minmax(0,1fr)_auto] tw-items-center tw-gap-x-2 tw-gap-y-1 tw-@container/vote-controls @[32rem]/my-vote:tw-col-span-2 @[32rem]/my-vote:tw-col-start-2 @[46rem]/my-vote:tw-col-span-1 @[46rem]/my-vote:tw-col-start-4 @[46rem]/my-vote:tw-row-span-2 @[46rem]/my-vote:tw-row-start-1 @[46rem]/my-vote:tw-self-start"
    >
      <label htmlFor={voteInputId} className="tw-sr-only">
        {t(locale, "waves.myVotes.yourVotes")}{" "}
        {t(locale, "waves.myVotes.inCredit", { credit: voteLabel })}
      </label>
      <div
        className={`${onExplainVote ? "@[24rem]/vote-controls:tw-col-span-1" : ""} tw-col-span-2 tw-flex tw-min-w-0 tw-items-center tw-gap-2 tw-rounded-lg tw-bg-iron-900 tw-pr-1 tw-ring-1 tw-ring-inset tw-transition-colors tw-duration-200 focus-within:tw-ring-2 motion-reduce:tw-transition-none ${
          isVoteValueOutOfRange
            ? "tw-ring-rose-400 focus-within:!tw-ring-rose-400"
            : "tw-ring-iron-700 focus-within:!tw-ring-primary-400"
        }`}
      >
        <div className="tw-flex tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2">
          <input
            id={voteInputId}
            onClick={(e) => {
              e.stopPropagation();
            }}
            type="text"
            value={displayVoteValue}
            onChange={handleInputChange}
            onFocus={() => setIsVoteInputFocused(true)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            disabled={isResetting || isVotingClosed}
            pattern={minRating < 0 ? "-?[0-9,]*" : "[0-9,]*"}
            inputMode="numeric"
            aria-describedby={voteInputDescription}
            aria-invalid={isVoteValueOutOfRange ? true : undefined}
            className="tw-h-11 tw-w-full tw-min-w-0 tw-flex-1 tw-rounded-lg tw-border-0 tw-bg-transparent tw-py-0 tw-pl-3 tw-pr-0 tw-text-base tw-font-semibold tw-tabular-nums tw-text-iron-50 tw-placeholder-iron-400 tw-outline-none focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-opacity-50 @[46rem]/my-vote:tw-h-10 @[46rem]/my-vote:tw-text-sm"
          />
          <span className="tw-flex-shrink-0 tw-whitespace-nowrap tw-py-1 tw-text-sm tw-leading-4 tw-text-iron-400">
            {voteLabel}
          </span>
        </div>

        <Button
          onClick={(e) => {
            e.stopPropagation();
            void handleSubmit();
          }}
          disabled={!isEditing || isProcessing || isResetting || isVotingClosed}
          variant={isEditing ? "primary" : "tertiary"}
          size="sm"
          loading={isProcessing || isResetting}
          hideChildrenWhenLoading
          className="!tw-h-11 tw-min-w-11 !tw-border-0 !tw-bg-transparent !tw-px-0 !tw-py-1 !tw-text-xs !tw-shadow-none @[46rem]/my-vote:!tw-h-10"
          aria-label={t(locale, "waves.myVotes.submitVote")}
        >
          <span
            className={`tw-flex tw-h-9 tw-w-full tw-items-center tw-justify-center tw-rounded-md tw-px-2 @[46rem]/my-vote:tw-h-8 ${isEditing ? "tw-bg-iron-200 tw-text-iron-950" : ""}`}
          >
            {t(locale, "waves.myVotes.vote")}
          </span>
        </Button>
      </div>
      <div className="tw-contents">
        <p
          id={maxRatingId}
          className="tw-row-start-2 tw-m-0 tw-flex tw-items-center tw-text-xs tw-font-normal tw-text-iron-400 @[24rem]/vote-controls:tw-col-span-2 @[46rem]/my-vote:tw-min-h-8"
        >
          {maxRatingLabel} {formatInteger(locale, liveMaxRating)}
        </p>
        {onExplainVote && (
          <>
            <Button
              onClick={(e) => {
                e.stopPropagation();
                handleExplainVote();
              }}
              disabled={!canExplainVote}
              variant="tertiary"
              size="sm"
              aria-label={t(locale, "waves.voteRationale.explainAriaLabel")}
              data-tooltip-id={explainTooltipId}
              data-tooltip-content={t(
                locale,
                "waves.voteRationale.savedDescription"
              )}
              className="tw-relative tw-col-start-2 tw-row-start-2 tw-my-1 after:tw-absolute after:tw-inset-x-0 after:tw-top-1/2 after:tw-h-11 after:-tw-translate-y-1/2 after:tw-content-[''] @[24rem]/vote-controls:tw-row-start-1 @[46rem]/my-vote:tw-my-0 @[46rem]/my-vote:tw-h-8"
            >
              {t(locale, "waves.voteRationale.explain")}
            </Button>
            <BodyPortalTooltip
              id={explainTooltipId}
              place="top"
              offset={8}
              opacity={1}
              style={TOOLTIP_STYLES}
              className="tw-max-w-64 tw-whitespace-normal"
              closeEvents={{ mouseleave: true, blur: true, click: true }}
              globalCloseEvents={{
                escape: true,
                clickOutsideAnchor: true,
                scroll: true,
              }}
            />
          </>
        )}
      </div>
      {displayedVoteLimitMessage && (
        <output
          id={voteLimitMessageId}
          className="tw-col-span-2 tw-mb-0 tw-mt-2 tw-min-w-0 tw-text-sm tw-leading-5 tw-text-amber-300"
        >
          {displayedVoteLimitMessage}
        </output>
      )}
    </div>
  );
};

export default MyStreamWaveMyVoteInput;
