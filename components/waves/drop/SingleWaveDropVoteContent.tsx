"use client";

import type { Dispatch, FC, SetStateAction } from "react";
import { useRef, useState } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { ApiWaveCreditScope } from "@/generated/models/ApiWaveCreditScope";
import {
  type SingleWaveDropVoteMode,
  SingleWaveDropVoteSize,
  SingleWaveDropVoteSubmissionMode,
} from "./SingleWaveDropVote.types";
import type { SingleWaveDropVoteSubmitHandles } from "./SingleWaveDropVoteSubmit";
import SingleWaveDropVoteSubmit from "./SingleWaveDropVoteSubmit";
import SingleWaveDropVoteSlider from "./SingleWaveDropVoteSlider";
import { SingleWaveDropVoteInput } from "./SingleWaveDropVoteInput";
import { SingleWaveDropVoteStats } from "./SingleWaveDropVoteStats";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useSingleWaveDropVoteState } from "./useSingleWaveDropVoteState";
import { useSingleWaveDropVoteRationale } from "./useSingleWaveDropVoteRationale";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { VotePanel } from "@/components/voting/VotePanel";
import { VoteModeControl } from "@/components/voting/VoteModeControl";
import { VoteRationaleControl } from "@/components/voting/VoteRationaleControl";

interface SingleWaveDropVoteContentProps {
  readonly drop: ApiDrop;
  readonly size: SingleWaveDropVoteSize;
  readonly onVoteSuccess?: (() => void) | undefined;
  readonly onVoteRequestStarted?: (() => void) | undefined;
  readonly submissionMode?: SingleWaveDropVoteSubmissionMode | undefined;
  readonly voteMode?: SingleWaveDropVoteMode | undefined;
  readonly onVoteModeChange?:
    | ((voteMode: SingleWaveDropVoteMode) => void)
    | undefined;
}

type VoteModeControlState = {
  readonly isControlled: boolean;
  readonly value: SingleWaveDropVoteMode;
  readonly setValue: (voteMode: SingleWaveDropVoteMode) => void;
};

interface VoteModeFieldProps {
  readonly isSliderMode: boolean;
  readonly voteValue: number | string;
  readonly minRating: number;
  readonly maxRating: number;
  readonly label: string;
  readonly setVoteValue: Dispatch<SetStateAction<string | number>>;
  readonly onValueAccepted: (value: number) => void;
  readonly onSubmit: () => void;
  readonly size?: SingleWaveDropVoteSize | undefined;
}

const getVoteModeControlState = ({
  voteMode,
  onVoteModeChange,
  uncontrolledVoteMode,
  setUncontrolledVoteMode,
}: {
  readonly voteMode: SingleWaveDropVoteMode | undefined;
  readonly onVoteModeChange:
    | ((voteMode: SingleWaveDropVoteMode) => void)
    | undefined;
  readonly uncontrolledVoteMode: SingleWaveDropVoteMode;
  readonly setUncontrolledVoteMode: Dispatch<
    SetStateAction<SingleWaveDropVoteMode>
  >;
}): VoteModeControlState => {
  if (voteMode !== undefined && onVoteModeChange !== undefined) {
    return {
      isControlled: true,
      value: voteMode,
      setValue: onVoteModeChange,
    };
  }

  return {
    isControlled: false,
    value: uncontrolledVoteMode,
    setValue: setUncontrolledVoteMode,
  };
};

const getInitialVoteMode = (
  size: SingleWaveDropVoteSize
): SingleWaveDropVoteMode => {
  if (size === SingleWaveDropVoteSize.MINI) {
    return "numeric";
  }

  return "slider";
};

const VoteModeField: FC<VoteModeFieldProps> = ({
  isSliderMode,
  voteValue,
  minRating,
  maxRating,
  label,
  setVoteValue,
  onValueAccepted,
  onSubmit,
  size,
}) => {
  if (isSliderMode) {
    return (
      <SingleWaveDropVoteSlider
        voteValue={voteValue}
        minValue={minRating}
        maxValue={maxRating}
        label={label}
        setVoteValue={setVoteValue}
        onValueAccepted={onValueAccepted}
        size={size}
      />
    );
  }

  return (
    <SingleWaveDropVoteInput
      voteValue={voteValue}
      minValue={minRating}
      maxValue={maxRating}
      setVoteValue={setVoteValue}
      onSubmit={onSubmit}
      label={label}
      size={size}
    />
  );
};

export const SingleWaveDropVoteContent: FC<SingleWaveDropVoteContentProps> = ({
  drop,
  size,
  onVoteSuccess,
  onVoteRequestStarted,
  submissionMode = SingleWaveDropVoteSubmissionMode.WAIT_FOR_CONFIRMATION,
  voteMode,
  onVoteModeChange,
}) => {
  const locale = useBrowserLocale();
  const {
    displayDrop,
    minRating,
    maxRating,
    voteValue,
    setVoteValue,
    submitVoteValue,
    submitBlockReason,
    handleSliderValueAccepted,
    handleVoteApplied,
  } = useSingleWaveDropVoteState({ drop });
  const [uncontrolledVoteMode, setUncontrolledVoteMode] =
    useState<SingleWaveDropVoteMode>(() => getInitialVoteMode(size));
  const voteModeControl = getVoteModeControlState({
    voteMode,
    onVoteModeChange,
    uncontrolledVoteMode,
    setUncontrolledVoteMode,
  });
  const showInternalVoteModeControl = !voteModeControl.isControlled;
  const currentVoteMode = voteModeControl.value;
  const setCurrentVoteMode = voteModeControl.setValue;
  const isSliderMode = currentVoteMode === "slider";

  const voteLabel =
    WAVE_VOTING_LABELS[displayDrop.wave.voting_credit_type] || "votes";
  const currentVoteValue = displayDrop.context_profile_context?.rating ?? 0;
  const rationaleVoteTotal = Number.isFinite(submitVoteValue)
    ? submitVoteValue
    : currentVoteValue;
  const voteRationale = useSingleWaveDropVoteRationale({
    drop: displayDrop,
    voteTotal: rationaleVoteTotal,
    voteChange: rationaleVoteTotal - currentVoteValue,
  });
  const canPostRationale =
    displayDrop.wave.authenticated_user_eligible_to_chat === true;
  const shouldPostRationale =
    canPostRationale && voteRationale.shouldPostRationale;
  // The voter can delete the generated prefix while the reply switch stays on.
  const isRationaleEmpty = voteRationale.rationaleText.trim().length === 0;
  const showRationaleValidation = shouldPostRationale && isRationaleEmpty;
  const rationaleSubmitBlockReason = showRationaleValidation
    ? t(locale, "waves.voteRationale.emptyBlockReason")
    : submitBlockReason;
  const creditScope =
    (displayDrop.wave as Partial<typeof displayDrop.wave>)
      .voting_credit_scope ?? ApiWaveCreditScope.Wave;

  const submitRef = useRef<SingleWaveDropVoteSubmitHandles | null>(null);
  const isBackgroundSubmission =
    submissionMode === SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH;
  const handleSubmitVoteApplied = (updatedDrop: ApiDrop) => {
    if (!isBackgroundSubmission) {
      handleVoteApplied(updatedDrop);
    }

    if (canPostRationale) {
      void voteRationale.submitRationaleReply(updatedDrop);
    }
  };

  const handleSubmit = () => {
    void submitRef.current?.handleClick();
  };

  const isMini = size === SingleWaveDropVoteSize.MINI;
  return (
    <VotePanel
      mode={currentVoteMode}
      variant={isMini ? "compact" : "default"}
      modeControl={
        showInternalVoteModeControl ? (
          <VoteModeControl
            value={currentVoteMode}
            onChange={setCurrentVoteMode}
          />
        ) : undefined
      }
    >
      <div className={isSliderMode && isMini ? "tw-pt-8" : undefined}>
        <VoteModeField
          isSliderMode={isSliderMode}
          voteValue={voteValue}
          minRating={minRating}
          maxRating={maxRating}
          setVoteValue={setVoteValue}
          onValueAccepted={handleSliderValueAccepted}
          onSubmit={handleSubmit}
          label={voteLabel}
          size={size}
        />
      </div>
      <SingleWaveDropVoteStats
        currentRating={currentVoteValue}
        maxRating={maxRating}
        label={voteLabel}
        creditScope={creditScope}
        subtle={isMini}
        className="tw-justify-between"
      />
      {!isMini && canPostRationale && (
        <VoteRationaleControl
          checked={shouldPostRationale}
          onCheckedChange={voteRationale.handlePostRationaleChange}
          value={voteRationale.rationaleText}
          onChange={voteRationale.handleRationaleTextChange}
          generated={voteRationale.isUsingGeneratedRationale}
          invalid={showRationaleValidation}
        />
      )}
      <div className="tw-flex tw-w-full tw-justify-end">
        <SingleWaveDropVoteSubmit
          drop={displayDrop}
          newRating={submitVoteValue}
          voteLabel={voteLabel}
          ref={submitRef}
          onVoteApplied={handleSubmitVoteApplied}
          onVoteSuccess={onVoteSuccess}
          onVoteRequestStarted={onVoteRequestStarted}
          submissionMode={submissionMode}
          size={size}
          submitBlockReason={
            isMini ? submitBlockReason : rationaleSubmitBlockReason
          }
        />
      </div>
    </VotePanel>
  );
};
