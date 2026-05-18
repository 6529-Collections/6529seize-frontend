"use client";

import type { FC } from "react";
import { useRef, useState } from "react";
import type { ApiDrop } from "@/generated/models/ApiDrop";
import { SingleWaveDropVoteSize } from "./SingleWaveDropVote.types";
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
}

export const SingleWaveDropVoteContent: FC<SingleWaveDropVoteContentProps> = ({
  drop,
  size,
  onVoteSuccess,
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
  } = useSingleWaveDropVoteState({ drop });
  const [isSliderMode, setIsSliderMode] = useState(
    size !== SingleWaveDropVoteSize.MINI
  );

  const voteLabel =
    WAVE_VOTING_LABELS[displayDrop.wave.voting_credit_type] || "votes";

  const submitRef = useRef<SingleWaveDropVoteSubmitHandles | null>(null);

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
            onClick={() => setIsSliderMode(!isSliderMode)}
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
              ref={submitRef}
              onVoteApplied={handleVoteApplied}
              onVoteSuccess={onVoteSuccess}
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
          />
        </div>
      </div>
    );
  }

  return (
    <div className="tw-space-y-6" onClick={(e) => e.stopPropagation()}>
      <div className="tw-flex tw-gap-3">
        <div className="tw-h-14 tw-min-w-0 tw-flex-1">
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
        <div className="tw-flex-shrink-0">
          <SingleWaveDropVoteSubmit
            drop={displayDrop}
            newRating={submitVoteValue}
            ref={submitRef}
            onVoteApplied={handleVoteApplied}
            onVoteSuccess={onVoteSuccess}
            submitBlockReason={submitBlockReason}
          />
        </div>
      </div>

      <div className="tw-flex tw-items-center tw-justify-between">
        <SingleWaveDropVoteStats
          currentRating={displayDrop.context_profile_context?.rating ?? 0}
          maxRating={maxRating}
          label={voteLabel}
        />
        <button
          onClick={() => setIsSliderMode(!isSliderMode)}
          className="tw-border-0 tw-bg-transparent tw-p-0 tw-text-sm tw-font-medium tw-text-primary-400 tw-transition-colors desktop-hover:hover:tw-text-primary-300"
          title="Switch mode"
          aria-label={
            isSliderMode ? "Switch to numeric input" : "Switch to slider input"
          }
        >
          {isSliderMode ? "Switch to numeric" : "Switch to slider"}
        </button>
      </div>
    </div>
  );
};
