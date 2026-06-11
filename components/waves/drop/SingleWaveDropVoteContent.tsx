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
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExchange } from "@fortawesome/free-solid-svg-icons";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useSingleWaveDropVoteState } from "./useSingleWaveDropVoteState";

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

export const SingleWaveDropVoteContent: FC<SingleWaveDropVoteContentProps> = ({
  drop,
  size,
  onVoteSuccess,
  onVoteRequestStarted,
  submissionMode = SingleWaveDropVoteSubmissionMode.WAIT_FOR_CONFIRMATION,
  voteMode,
  onVoteModeChange,
}) => {
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
    handleBackgroundVoteApplied,
  } = useSingleWaveDropVoteState({ drop });
  const [uncontrolledVoteMode, setUncontrolledVoteMode] =
    useState<SingleWaveDropVoteMode>(
      size !== SingleWaveDropVoteSize.MINI ? "slider" : "numeric"
    );
  const voteModeControl = getVoteModeControlState({
    voteMode,
    onVoteModeChange,
    uncontrolledVoteMode,
    setUncontrolledVoteMode,
  });
  const hasExternalVoteModeControl = voteModeControl.isControlled;
  const currentVoteMode = voteModeControl.value;
  const setCurrentVoteMode = voteModeControl.setValue;
  const isSliderMode = currentVoteMode === "slider";

  const voteLabel =
    WAVE_VOTING_LABELS[displayDrop.wave.voting_credit_type] || "votes";
  const creditScope =
    (displayDrop.wave as Partial<typeof displayDrop.wave>)
      .voting_credit_scope ?? ApiWaveCreditScope.Wave;

  const submitRef = useRef<SingleWaveDropVoteSubmitHandles | null>(null);
  const isBackgroundSubmission =
    submissionMode === SingleWaveDropVoteSubmissionMode.BACKGROUND_AFTER_AUTH;
  const handleSubmitVoteApplied = (updatedDrop: ApiDrop) => {
    if (isBackgroundSubmission) {
      handleBackgroundVoteApplied();
      return;
    }

    handleVoteApplied(updatedDrop);
  };

  const handleSubmit = () => {
    void submitRef.current?.handleClick();
  };

  if (size === SingleWaveDropVoteSize.MINI) {
    return (
      <div
        className="tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-px-2 tw-py-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <button
            onClick={() =>
              setCurrentVoteMode(isSliderMode ? "numeric" : "slider")
            }
            className="tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-font-medium tw-transition-all desktop-hover:hover:tw-bg-iron-600"
            title={isSliderMode ? "Switch to numeric" : "Switch to slider"}
            aria-label={
              isSliderMode
                ? "Switch to numeric input"
                : "Switch to slider input"
            }
          >
            <FontAwesomeIcon
              icon={faExchange}
              className="tw-size-3 tw-flex-shrink-0 tw-text-white"
              flip={isSliderMode ? "horizontal" : "vertical"}
            />
          </button>

          <div className="tw-h-8 tw-min-w-0 tw-flex-1">
            {isSliderMode ? (
              <SingleWaveDropVoteSlider
                voteValue={voteValue}
                minValue={minRating}
                maxValue={maxRating}
                label={voteLabel}
                setVoteValue={setVoteValue}
                onValueAccepted={handleSliderValueAccepted}
                rank={displayDrop.rank}
                size={size}
              />
            ) : (
              <SingleWaveDropVoteInput
                voteValue={voteValue}
                minValue={minRating}
                maxValue={maxRating}
                setVoteValue={setVoteValue}
                onSubmit={handleSubmit}
                label={voteLabel}
                size={size}
              />
            )}
          </div>

          <div className="tw-h-8 tw-flex-shrink-0">
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
              submitBlockReason={submitBlockReason}
            />
          </div>
        </div>

        <div className="tw-mt-3">
          <SingleWaveDropVoteStats
            currentRating={displayDrop.context_profile_context?.rating ?? 0}
            maxRating={maxRating}
            label={voteLabel}
            creditScope={creditScope}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="tw-space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className={isSliderMode ? undefined : "tw-min-h-[92px]"}>
        {isSliderMode ? (
          <SingleWaveDropVoteSlider
            voteValue={voteValue}
            minValue={minRating}
            maxValue={maxRating}
            setVoteValue={setVoteValue}
            onValueAccepted={handleSliderValueAccepted}
            rank={displayDrop.rank}
            label={voteLabel}
          />
        ) : (
          <SingleWaveDropVoteInput
            voteValue={voteValue}
            minValue={minRating}
            maxValue={maxRating}
            setVoteValue={setVoteValue}
            onSubmit={handleSubmit}
            label={voteLabel}
          />
        )}
      </div>

      <div
        className={`tw-flex tw-items-center tw-justify-between tw-gap-4 ${
          isSliderMode ? "tw-pt-5" : ""
        }`}
      >
        <SingleWaveDropVoteStats
          currentRating={displayDrop.context_profile_context?.rating ?? 0}
          maxRating={maxRating}
          label={voteLabel}
          creditScope={creditScope}
          className={
            hasExternalVoteModeControl ? "tw-w-full tw-justify-between" : ""
          }
        />
        {!hasExternalVoteModeControl && (
          <button
            onClick={() =>
              setCurrentVoteMode(isSliderMode ? "numeric" : "slider")
            }
            className="tw-flex-shrink-0 tw-border-0 tw-bg-transparent tw-p-0 tw-text-[11px] tw-font-medium tw-text-primary-400 tw-transition-colors desktop-hover:hover:tw-text-primary-300"
            title="Switch mode"
            aria-label={
              isSliderMode
                ? "Switch to numeric input"
                : "Switch to slider input"
            }
          >
            {isSliderMode ? "Switch to numeric" : "Switch to slider"}
          </button>
        )}
      </div>

      <div className="wave-drop-vote-submit-full">
        <SingleWaveDropVoteSubmit
          drop={displayDrop}
          newRating={submitVoteValue}
          voteLabel={voteLabel}
          ref={submitRef}
          onVoteApplied={handleSubmitVoteApplied}
          onVoteSuccess={onVoteSuccess}
          onVoteRequestStarted={onVoteRequestStarted}
          submissionMode={submissionMode}
          submitBlockReason={submitBlockReason}
        />
      </div>
    </div>
  );
};
