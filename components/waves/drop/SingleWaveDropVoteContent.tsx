"use client";

import type { Dispatch, FC, SetStateAction } from "react";
import { useId, useRef, useState } from "react";
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
import { useSingleWaveDropVoteRationale } from "./useSingleWaveDropVoteRationale";
import styles from "./VoteButton.module.css";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

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

const getNextVoteMode = (isSliderMode: boolean): SingleWaveDropVoteMode => {
  if (isSliderMode) {
    return "numeric";
  }

  return "slider";
};

const getSwitchModeTitle = (isSliderMode: boolean): string => {
  if (isSliderMode) {
    return "Switch to numeric";
  }

  return "Switch to slider";
};

const getSwitchModeAriaLabel = (isSliderMode: boolean): string => {
  if (isSliderMode) {
    return "Switch to numeric input";
  }

  return "Switch to slider input";
};

const getExchangeIconFlip = (
  isSliderMode: boolean
): "horizontal" | "vertical" => {
  if (isSliderMode) {
    return "horizontal";
  }

  return "vertical";
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
  const hasExternalVoteModeControl = voteModeControl.isControlled;
  const showInternalVoteModeControl = hasExternalVoteModeControl === false;
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
  const rationaleTextareaId = useId();
  const rationalePanelId = useId();
  const rationaleSwitchId = useId();
  const rationaleSwitchLabelId = useId();
  const rationaleDescriptionId = useId();
  const rationaleValidationId = useId();
  const canPostRationale =
    displayDrop.wave.authenticated_user_eligible_to_chat === true;
  const shouldPostRationale =
    canPostRationale && voteRationale.shouldPostRationale;
  // The voter can delete the generated prefix while the reply switch stays on.
  const isRationaleEmpty = voteRationale.rationaleText.trim().length === 0;
  const showRationaleValidation = shouldPostRationale && isRationaleEmpty;
  const rationaleDescriptionIds = showRationaleValidation
    ? `${rationaleDescriptionId} ${rationaleValidationId}`
    : rationaleDescriptionId;
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

  if (size === SingleWaveDropVoteSize.MINI) {
    return (
      <fieldset className="tw-m-0 tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-[#1A1A1F] tw-px-2 tw-py-1.5">
        <legend className="tw-sr-only">Vote controls</legend>
        <div className="tw-flex tw-items-center tw-gap-x-2">
          <button
            type="button"
            onClick={() => setCurrentVoteMode(getNextVoteMode(isSliderMode))}
            className="tw-flex tw-h-8 tw-w-8 tw-flex-shrink-0 tw-items-center tw-justify-center tw-rounded-md tw-border-0 tw-bg-white/[0.06] tw-font-medium tw-text-iron-300 tw-transition-colors focus:tw-outline-none focus-visible:tw-ring-1 focus-visible:tw-ring-white/25 desktop-hover:hover:tw-bg-white/[0.1] desktop-hover:hover:tw-text-white"
            title={getSwitchModeTitle(isSliderMode)}
            aria-label={getSwitchModeAriaLabel(isSliderMode)}
          >
            <FontAwesomeIcon
              icon={faExchange}
              className="tw-size-3 tw-flex-shrink-0 tw-text-current"
              flip={getExchangeIconFlip(isSliderMode)}
            />
          </button>

          <div className="tw-h-8 tw-min-w-0 tw-flex-1">
            <VoteModeField
              isSliderMode={isSliderMode}
              voteValue={voteValue}
              minRating={minRating}
              maxRating={maxRating}
              label={voteLabel}
              setVoteValue={setVoteValue}
              onValueAccepted={handleSliderValueAccepted}
              onSubmit={handleSubmit}
              size={size}
            />
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
            currentRating={currentVoteValue}
            maxRating={maxRating}
            label={voteLabel}
            creditScope={creditScope}
            subtle={true}
          />
        </div>
      </fieldset>
    );
  }

  return (
    <fieldset className="tw-m-0 tw-min-w-0 tw-space-y-4 tw-border-0 tw-p-0">
      <legend className="tw-sr-only">Vote controls</legend>
      <div className={isSliderMode ? undefined : "tw-min-h-[92px]"}>
        <VoteModeField
          isSliderMode={isSliderMode}
          voteValue={voteValue}
          minRating={minRating}
          maxRating={maxRating}
          setVoteValue={setVoteValue}
          onValueAccepted={handleSliderValueAccepted}
          onSubmit={handleSubmit}
          label={voteLabel}
        />
      </div>

      <div
        className={`tw-flex tw-items-center tw-justify-between tw-gap-4 ${
          isSliderMode ? "tw-pt-5" : ""
        }`}
      >
        <SingleWaveDropVoteStats
          currentRating={currentVoteValue}
          maxRating={maxRating}
          label={voteLabel}
          creditScope={creditScope}
          className={
            hasExternalVoteModeControl ? "tw-w-full tw-justify-between" : ""
          }
        />
        {showInternalVoteModeControl && (
          <button
            type="button"
            onClick={() => setCurrentVoteMode(getNextVoteMode(isSliderMode))}
            className="tw-flex-shrink-0 tw-border-0 tw-bg-transparent tw-p-0 tw-text-[11px] tw-font-medium tw-text-primary-400 tw-transition-colors desktop-hover:hover:tw-text-primary-300"
            title="Switch mode"
            aria-label={getSwitchModeAriaLabel(isSliderMode)}
          >
            {getSwitchModeTitle(isSliderMode)}
          </button>
        )}
      </div>

      <div className="tw-grid tw-grid-cols-1 tw-gap-4">
        {canPostRationale && (
          <div>
            <label
              htmlFor={rationaleSwitchId}
              className="tw-flex tw-w-fit tw-cursor-pointer tw-flex-wrap tw-items-center tw-gap-2"
            >
              <span className="tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-items-center">
                <input
                  id={rationaleSwitchId}
                  type="checkbox"
                  role="switch"
                  checked={shouldPostRationale}
                  onChange={(event) =>
                    voteRationale.handlePostRationaleChange(
                      event.target.checked
                    )
                  }
                  className="tw-peer tw-sr-only"
                  aria-labelledby={rationaleSwitchLabelId}
                  aria-describedby={rationaleDescriptionIds}
                  aria-controls={rationalePanelId}
                  aria-expanded={shouldPostRationale}
                />
                <span
                  aria-hidden="true"
                  className={`tw-absolute tw-inset-0 tw-rounded-full tw-ring-1 tw-ring-inset tw-ring-white/10 tw-transition-colors peer-focus-visible:tw-ring-2 peer-focus-visible:tw-ring-primary-400 ${
                    shouldPostRationale
                      ? "tw-bg-primary-500"
                      : "tw-bg-iron-650"
                  }`}
                />
                <span
                  aria-hidden="true"
                  className={`tw-absolute tw-left-0.5 tw-top-0.5 tw-size-5 tw-rounded-full tw-bg-iron-50 tw-shadow tw-transition-transform ${
                    shouldPostRationale ? "tw-translate-x-5" : ""
                  }`}
                />
              </span>
              <span
                id={rationaleSwitchLabelId}
                className="tw-text-sm tw-font-medium tw-text-iron-200"
              >
                {t(locale, "waves.voteRationale.switchLabel")}
              </span>
              <span
                aria-hidden="true"
                className="tw-rounded-full tw-bg-white/[0.06] tw-px-2 tw-py-0.5 tw-text-[11px] tw-font-semibold tw-uppercase tw-text-iron-400"
              >
                {shouldPostRationale
                  ? t(locale, "waves.voteRationale.stateOn")
                  : t(locale, "waves.voteRationale.stateOff")}
              </span>
            </label>
            <p id={rationaleDescriptionId} className="tw-sr-only">
              {t(locale, "waves.voteRationale.fieldDescription")}
            </p>

            <div
              id={rationalePanelId}
              aria-hidden={!shouldPostRationale}
              inert={!shouldPostRationale}
              className={`tw-grid tw-transition-[grid-template-rows,opacity] tw-duration-200 tw-ease-out motion-reduce:tw-transition-none ${
                shouldPostRationale
                  ? "tw-grid-rows-[1fr] tw-opacity-100"
                  : "tw-grid-rows-[0fr] tw-opacity-0"
              }`}
            >
              <div className="tw-min-h-0 tw-overflow-hidden">
                <div className="tw-space-y-2 tw-pt-3">
                  <label
                    htmlFor={rationaleTextareaId}
                    className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-text-iron-400"
                  >
                    {t(locale, "waves.voteRationale.fieldLabel")}
                  </label>
                  <textarea
                    id={rationaleTextareaId}
                    value={voteRationale.rationaleText}
                    onChange={(event) =>
                      voteRationale.handleRationaleTextChange(
                        event.target.value
                      )
                    }
                    rows={4}
                    className={`tw-form-textarea tw-block tw-w-full tw-resize-y tw-rounded-lg tw-border-0 tw-bg-iron-900 tw-px-3 tw-py-2.5 tw-text-sm tw-leading-5 tw-shadow-sm tw-ring-1 tw-ring-inset tw-ring-iron-650 tw-transition placeholder:tw-text-iron-600 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-primary-400 desktop-hover:hover:tw-ring-iron-600 ${
                      voteRationale.isUsingGeneratedRationale
                        ? "tw-text-iron-600"
                        : "tw-text-iron-100"
                    }`}
                    aria-describedby={rationaleDescriptionIds}
                  />
                  {showRationaleValidation && (
                    <p id={rationaleValidationId} className="tw-sr-only">
                      {t(locale, "waves.voteRationale.emptyBlockReason")}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        <div
          className={`wave-drop-vote-submit-full tw-w-full ${styles["voteSubmitFull"] ?? ""}`}
        >
          <SingleWaveDropVoteSubmit
            drop={displayDrop}
            newRating={submitVoteValue}
            voteLabel={voteLabel}
            ref={submitRef}
            onVoteApplied={handleSubmitVoteApplied}
            onVoteSuccess={onVoteSuccess}
            onVoteRequestStarted={onVoteRequestStarted}
            submissionMode={submissionMode}
            submitBlockReason={rationaleSubmitBlockReason}
            submitLabelOverride={
              shouldPostRationale
                ? t(locale, "waves.voteRationale.submitLabel")
                : undefined
            }
          />
        </div>
      </div>
    </fieldset>
  );
};
