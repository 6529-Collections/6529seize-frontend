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

  useEffect(() => {
    setVoteValue(currentVoteValue);
  }, [drop.context_profile_context?.rating]);

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
                    desktop-hover:hover:tw-bg-iron-600"
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
                creditType={drop.wave.voting_credit_type}
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
                creditType={drop.wave.voting_credit_type}
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
            creditType={drop.wave.voting_credit_type}
          />
        </div>
      </div>
    );
  }

  // Clean, sleek design with flexbox ordering for responsive layout
  return (
    <div
      className="tw-bg-iron-800 tw-backdrop-blur-sm tw-border tw-border-iron-700 tw-border-solid tw-rounded-lg tw-px-2 tw-py-3 sm:tw-p-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Main container using flexbox and wrapping */}
      <div className="tw-flex tw-flex-wrap tw-gap-3 sm:tw-gap-2.5">
        {/* Toggle button - first item in both layouts */}
        <div className="tw-order-1 sm:tw-order-1 tw-flex-shrink-0">
          <button
            onClick={() => setIsSliderMode(!isSliderMode)}
            className="tw-h-8 tw-px-2.5 tw-rounded-lg tw-bg-iron-700 tw-border tw-border-solid tw-border-iron-650
                    tw-flex tw-items-center tw-justify-center tw-gap-1.5 tw-transition-all
                    desktop-hover:hover:tw-bg-iron-600"
            title="Switch mode"
          >
            <FontAwesomeIcon
              icon={faExchange}
              className="tw-text-white tw-size-3 tw-flex-shrink-0"
              flip={isSliderMode ? "horizontal" : "vertical"}
            />
            <span className="tw-text-xs tw-font-medium tw-text-white">
              {isSliderMode ? "Numeric" : "Slider"}
            </span>
          </button>
        </div>

        {/* Stats - second item in mobile (first row), fourth in desktop (second row) */}
        <div className="tw-order-2 sm:tw-order-4 tw-ml-auto sm:tw-ml-0 sm:tw-w-full sm:tw-mt-2">
          <SingleWaveDropVoteStats
            currentRating={drop.context_profile_context?.rating ?? 0}
            maxRating={maxRating}
            creditType={drop.wave.voting_credit_type}
          />
        </div>

        {/* Input controls - third item in mobile (second row), second in desktop (first row) */}
        <div className="tw-order-3 sm:tw-order-2 tw-w-full sm:tw-w-auto sm:tw-flex-1 sm:tw-min-w-0 tw-h-14">
          {isSliderMode ? (
            <SingleWaveDropVoteSlider
              voteValue={voteValue}
              minValue={minRating}
              maxValue={maxRating}
              creditType={drop.wave.voting_credit_type}
              setVoteValue={setVoteValue}
              rank={drop.rank}
            />
          ) : (
            <SingleWaveDropVoteInput
              voteValue={voteValue}
              minValue={minRating}
              maxValue={maxRating}
              setVoteValue={setVoteValue}
              onSubmit={handleSubmit}
              creditType={drop.wave.voting_credit_type}
            />
          )}
        </div>

        {/* Submit button - fourth item in mobile (third row), third in desktop (first row) */}
        <div className="tw-order-4 sm:tw-order-3 tw-ml-auto sm:tw-ml-0 tw-flex-shrink-0">
          <SingleWaveDropVoteSubmit
            drop={drop}
            newRating={Number(voteValue)}
            ref={submitRef}
            onVoteSuccess={onVoteSuccess}
          />
        </div>
      </div>
    </div>
  );
};
