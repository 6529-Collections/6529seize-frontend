import { useEffect, useRef, useState } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
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
}

export const SingleWaveDropVoteContent: React.FC<
  SingleWaveDropVoteContentProps
> = ({ drop, size }) => {
  const currentVoteValue = drop.context_profile_context?.rating ?? 0;
  const minRating = drop.context_profile_context?.min_rating ?? 0;
  const maxRating = drop.context_profile_context?.max_rating ?? 0;
  const [voteValue, setVoteValue] = useState<number | string>(currentVoteValue);
  const [isSliderMode, setIsSliderMode] = useState(true);

  useEffect(() => {
    setVoteValue(currentVoteValue);
  }, [drop.context_profile_context?.rating]);

  const submitRef = useRef<SingleWaveDropVoteSubmitHandles | null>(null);

  const handleSubmit = async () => {
    if (submitRef.current) {
      await submitRef.current.handleClick();
    }
  };

  // Clean, sleek design with button on far left
  return (
    <div
      className="tw-bg-iron-800 tw-backdrop-blur-sm tw-border tw-border-iron-700d tw-rounded-lg tw-p-4"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Main row with all controls */}
      <div className="tw-flex tw-items-start tw-gap-2.5">
        {/* Toggle button on far left */}
        <div className="tw-flex-shrink-0">
          <button
            onClick={() => setIsSliderMode(!isSliderMode)}
            className="tw-h-8 tw-w-8 tw-rounded-md tw-border tw-border-solid tw-border-iron-650 tw-bg-iron-700 
                    tw-flex tw-items-center tw-justify-center tw-transition-colors
                    desktop-hover:hover:tw-bg-iron-650"
            title="Switch mode"
          >
            <FontAwesomeIcon 
              icon={faExchange} 
              className="tw-text-iron-300 tw-size-3.5 tw-flex-shrink-0" 
              flip={isSliderMode ? "horizontal" : "vertical"}
            />
          </button>
        </div>

        {/* Input controls - flex-1 to take available space */}
        <div className="tw-flex-1 tw-min-w-0 tw-h-14">
          {/* Slider mode */}
          {isSliderMode && (
            <SingleWaveDropVoteSlider
              voteValue={voteValue}
              minValue={minRating}
              maxValue={maxRating}
              creditType={drop.wave.voting_credit_type}
              setVoteValue={setVoteValue}
              rank={drop.rank}
            />
          )}

          {/* Numeric mode */}
          {!isSliderMode && (
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

        {/* Vote button on right side */}
        <div className="tw-flex-shrink-0">
          <SingleWaveDropVoteSubmit
            drop={drop}
            newRating={Number(voteValue)}
            ref={submitRef}
          />
        </div>
      </div>

      {/* Stats row - just showing stats on the right */}
      <div className="tw-flex tw-items-center tw-ml-11 tw-mt-2">
        <SingleWaveDropVoteStats
          currentRating={drop.context_profile_context?.rating ?? 0}
          maxRating={maxRating}
          creditType={drop.wave.voting_credit_type}
        />
      </div>
    </div>
  );
};
