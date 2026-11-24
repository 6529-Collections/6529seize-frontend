"use client";

import { useContext, useState } from "react";
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
import { useChainWavesWriters } from "@/components/chain-waves/useChainWavesWriters";
import { isUserRejectedSigningError } from "@/helpers/wallet-error.helpers";
import { withViewerVote } from "@/lib/chain-waves/optimistic";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import { MyVotesInput } from "./MyVotesInput";
import { triggerVoteSuccessHaptic } from "@/helpers/vote-haptics";

interface MyStreamWaveMyVoteInputProps {
  readonly drop: ExtendedDrop;
  readonly mobile?: boolean;
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
  mobile = false,
  isResetting = false,
  isVotingClosed = false,
  onExplainVote,
}) => {
  const locale = useBrowserLocale();
  const { requestAuth, setToast, connectedProfile, activeProfileProxy } =
    useContext(AuthContext);
  const chainWriters = useChainWavesWriters();
  const queryClient = useQueryClient();
  const [isProcessing, setIsProcessing] = useState(false);
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
  const voteLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];
  const maxRatingLabel = getWaveVoteScopeMaxLabel(
    drop.wave.voting_credit_scope
  );
  const voteInputId = `my-vote-input-${drop.id}`;

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
  const handleInputChange = (rawValue: string) => {
    if (isVotingClosed) {
      return;
    }

    const inputValue = rawValue.replaceAll(",", "").trim();
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
    mutationFn: async (param: VoteMutationVariables): Promise<ApiDrop> => {
      if (chainWriters) {
        await chainWriters.vote({ dropId: drop.id, amount: param.rate });
        return withViewerVote(drop, param.rate);
      }
      return await commonApiPost<DropRateChangeRequest, ApiDrop>({
        endpoint: `drops/${drop.id}/ratings`,
        body: {
          rating: param.rate,
          category: DEFAULT_DROP_RATE_CATEGORY,
        },
      });
    },
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
      if (mobile) triggerVoteSuccessHaptic();
    },
    onError: (error) => {
      // Cancelled at the wallet prompt: nothing was sent.
      if (isUserRejectedSigningError(error)) {
        return;
      }
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
      // On the 6529 Network each vote carries its own signature.
      const { success } = chainWriters
        ? { success: true }
        : await requestAuth();
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
    <MyVotesInput
      mobile={mobile}
      alwaysShowHelper={!mobile}
      id={voteInputId}
      label={t(locale, "waves.myVotes.yourVotesInCredit", {
        credit: voteLabel,
      })}
      value={voteValue}
      currentVote={liveCurrentVoteValue}
      unit={voteLabel}
      min={minRating}
      valid={hasValidVoteValue && !isVoteValueOutOfRange}
      disabled={isResetting || isVotingClosed}
      busy={isProcessing}
      helperText={t(locale, "waves.myVotes.maxRating", {
        label: maxRatingLabel,
        value: formatInteger(locale, liveMaxRating),
      })}
      error={displayedVoteLimitMessage}
      saveLabel={t(locale, "competitions.vote")}
      explainLabel={t(locale, "waves.voteRationale.explainAriaLabel")}
      explainDescription={t(locale, "waves.voteRationale.savedDescription")}
      canExplain={canExplainVote}
      onChange={handleInputChange}
      onBlur={handleBlur}
      onSubmit={() => void handleSubmit()}
      onExplain={onExplainVote ? handleExplainVote : undefined}
    />
  );
};

export default MyStreamWaveMyVoteInput;
