"use client";

import { useEffect, useRef, useState } from "react";
import { ApiDrop } from "@/generated/models/ApiDrop";
import { SingleWaveDropVoteSize } from "./SingleWaveDropVote";
import SingleWaveDropVoteSubmit, {
  SingleWaveDropVoteSubmitHandles,
} from "./SingleWaveDropVoteSubmit";
import SingleWaveDropVoteSlider from "./SingleWaveDropVoteSlider";
import { SingleWaveDropVoteInput } from "./SingleWaveDropVoteInput";
import { SingleWaveDropVoteStats } from "./SingleWaveDropVoteStats";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faExchange } from "@fortawesome/free-solid-svg-icons";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";

interface SingleWaveDropVoteContentProps {
  readonly drop: ApiDrop;
  readonly size: SingleWaveDropVoteSize;
  readonly onVoteSuccess?: () => void;
}

export const SingleWaveDropVoteContent: React.FC<
  SingleWaveDropVoteContentProps
> = ({ drop, size, onVoteSuccess }) => {

  const currentVoteValue = drop.context_profile_context?.rating ?? 0;
  const minRating = drop.context_profile_context?.min_rating ?? 0;
  const maxRating = drop.context_profile_context?.max_rating ?? 0;
  const [voteValue, setVoteValue] = useState<number | string>(currentVoteValue);
  const [isSliderMode, setIsSliderMode] = useState(size !== SingleWaveDropVoteSize.MINI);

  const voteLabel =
    WAVE_VOTING_LABELS[drop.wave.voting_credit_type as ApiWaveCreditType] ||
    "votes";

  useEffect(() => {
    setVoteValue(currentVoteValue);
  }, [currentVoteValue]);

  const submitRef = useRef<SingleWaveDropVoteSubmitHandles | null>(null);

  const handleSubmit = async () => {
    if (submitRef.current) {
      await submitRef.current.handleClick();
    }
  };

  // MINI layout uses single horizontal row, others use existing responsive layout
  if (size === SingleWaveDropVoteSize.MINI) {
    return (

      <div
        className="tw-bg-iron-900 tw-border tw-border-iron-800 tw-border-solid tw-rounded-lg tw-px-2 tw-py-1.5"
        onClick={(e) => e.stopPropagation()}
      >
        {/* MINI: Horizontal single-row layout */}
        <div className="tw-flex tw-items-center tw-gap-x-2">
          {/* Toggle button - icon only */}
          <button
            onClick={() => setIsSliderMode(!isSliderMode)}
            className="tw-h-8 tw-w-8 tw-rounded-md tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700
                    tw-flex tw-items-center tw-justify-center tw-transition-all tw-flex-shrink-0
                    desktop-hover:hover:tw-bg-iron-600 tw-font-medium"
            title={isSliderMode ? "Switch to numeric" : "Switch to slider"}
          >
            <FontAwesomeIcon
              icon={faExchange}
              className="tw-text-white tw-size-3 tw-flex-shrink-0"
              flip={isSliderMode ? "horizontal" : "vertical"}
            />
          </button>

          {/* Input controls - flex-1 to fill space */}
          <div className="tw-flex-1 tw-min-w-0 tw-h-8">
            {isSliderMode ? (
              <SingleWaveDropVoteSlider
                voteValue={voteValue}
                minValue={minRating}
                maxValue={maxRating}
                label={voteLabel}
                setVoteValue={setVoteValue}
                rank={drop.rank}
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

          {/* Submit button - compact */}
          <div className="tw-flex-shrink-0 tw-h-8">
            <SingleWaveDropVoteSubmit
              drop={drop}
              newRating={Number(voteValue)}
              ref={submitRef}
              onVoteSuccess={onVoteSuccess}
              size={size}
            />
          </div>
        </div>

        {/* Stats below the controls */}
        <div className="tw-mt-3">
          <SingleWaveDropVoteStats
            currentRating={drop.context_profile_context?.rating ?? 0}
            maxRating={maxRating}
            label={voteLabel}
          />
        </div>
      </div>
    );
  }

  // Clean, sleek design with flexbox ordering for responsive layout
  return (
    <div
      className="tw-space-y-6"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top row: Input + Submit */}
      <div className="tw-flex tw-gap-3">
        <div className="tw-flex-1 tw-min-w-0 tw-h-14">
          {isSliderMode ? (
            <SingleWaveDropVoteSlider
              voteValue={voteValue}
              minValue={minRating}
              maxValue={maxRating}
              setVoteValue={setVoteValue}
              rank={drop.rank}
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
            drop={drop}
            newRating={Number(voteValue)}
            ref={submitRef}
            onVoteSuccess={onVoteSuccess}
          />
        </div>
      </div>

      {/* Stats and mode toggle */}
      <div className="tw-flex tw-items-center tw-justify-between">
        <SingleWaveDropVoteStats
          currentRating={drop.context_profile_context?.rating ?? 0}
          maxRating={maxRating}
          label={voteLabel}
        />
        <button
          onClick={() => setIsSliderMode(!isSliderMode)}
          className="tw-bg-transparent tw-border-0 tw-p-0 tw-text-sm tw-font-medium tw-text-primary-400
                  desktop-hover:hover:tw-text-primary-300 tw-transition-colors"
          title="Switch mode"
        >
          {isSliderMode ? "Switch to numeric" : "Switch to slider"}
        </button>
      </div>
    </div>
  );
};
