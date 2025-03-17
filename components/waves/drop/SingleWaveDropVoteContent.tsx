import { useEffect, useRef, useState } from "react";
import { ApiDrop } from "../../../generated/models/ApiDrop";
import { SingleWaveDropVoteSize } from "./SingleWaveDropVote";
import SingleWaveDropVoteSubmit, {
  SingleWaveDropVoteSubmitHandles,
} from "./SingleWaveDropVoteSubmit";
import SingleWaveDropVoteSlider from "./SingleWaveDropVoteSlider";
import { TabToggle } from "../../common/TabToggle";
import { SingleWaveDropVoteInput } from "./SingleWaveDropVoteInput";
import { SingleWaveDropVoteStats } from "./SingleWaveDropVoteStats";
import SingleWaveDropVoteQuick from "./SingleWaveDropVoteQuick";

interface SingleWaveDropVoteContentProps {
  readonly drop: ApiDrop;
  readonly size: SingleWaveDropVoteSize;
}

export const SingleWaveDropVoteContent: React.FC<SingleWaveDropVoteContentProps> = ({
  drop,
  size,
}) => {
  const currentVoteValue = drop.context_profile_context?.rating ?? 0;
  const minRating = drop.context_profile_context?.min_rating ?? 0;
  const maxRating = drop.context_profile_context?.max_rating ?? 0;
  const [voteValue, setVoteValue] = useState<number | string>(currentVoteValue);

  useEffect(() => {
    setVoteValue(currentVoteValue);
  }, [drop.context_profile_context?.rating]);

  const [isSliderMode, setIsSliderMode] = useState(true);

  const voteOptions = [
    { key: "slider", label: "Slider" },
    { key: "numeric", label: "Numeric" },
  ] as const;

  const isCompact = size === SingleWaveDropVoteSize.COMPACT;

  const submitRef = useRef<SingleWaveDropVoteSubmitHandles | null>(null);

  const handleSubmit = async () => {
    if (submitRef.current) {
      await submitRef.current.handleClick();
    }
  };

  if (isCompact) {
    return (
      <div
        className="tw-flex tw-items-center tw-gap-3 tw-p-2 tw-rounded-lg tw-bg-iron-850/60"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tw-flex-1">
          <SingleWaveDropVoteSlider
            voteValue={voteValue}
            minValue={minRating}
            maxValue={maxRating}
            creditType={drop.wave.voting_credit_type}
            setVoteValue={setVoteValue}
            rank={drop.rank}
          />
        </div>
        <div className="tw-flex-shrink-0">
          <SingleWaveDropVoteSubmit
            drop={drop}
            newRating={Number(voteValue)}
            ref={submitRef}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className="tw-@container tw-flex tw-flex-col tw-gap-2 tw-p-3 tw-rounded-xl tw-bg-iron-800 tw-shadow tw-backdrop-blur-lg tw-border tw-border-iron-700 tw-border-solid tw-relative"
      onClick={(e) => e.stopPropagation()}
    >
      {/* Top row: Mode toggle + Stats */}
      <div className="tw-flex tw-items-center tw-justify-between tw-w-full">
        <div className="tw-flex-shrink-0">
          <TabToggle
            options={voteOptions}
            activeKey={isSliderMode ? "slider" : "numeric"}
            onSelect={(key) => setIsSliderMode(key === "slider")}
          />
        </div>
        <div className="tw-flex-shrink-0">
          <SingleWaveDropVoteStats
            currentRating={drop.context_profile_context?.rating ?? 0}
            maxRating={maxRating}
            creditType={drop.wave.voting_credit_type}
          />
        </div>
      </div>

      {/* Slider/Input area - fixed height container */}
      <div className="tw-w-full tw-mt-1 tw-h-[65px]">
        <div className="tw-relative tw-w-full">
          {/* Slider Mode */}
          <div
            className={`tw-absolute tw-inset-0 tw-transition-opacity tw-duration-150 tw-ease-in-out
            ${
              isSliderMode
                ? "tw-opacity-100 tw-visible"
                : "tw-opacity-0 tw-invisible tw-pointer-events-none"
            }`}
          >
            <div className="tw-h-[30px] tw-mt-4">
              <SingleWaveDropVoteSlider
                voteValue={voteValue}
                setVoteValue={setVoteValue}
                minValue={minRating}
                maxValue={maxRating}
                rank={drop.rank}
                creditType={drop.wave.voting_credit_type}
              />
            </div>
          </div>

          {/* Numeric Mode */}
          <div
            className={`tw-absolute tw-inset-0 tw-transition-opacity tw-duration-150 tw-ease-in-out
            ${
              !isSliderMode
                ? "tw-opacity-100 tw-visible"
                : "tw-opacity-0 tw-invisible tw-pointer-events-none"
            }`}
          >
            <SingleWaveDropVoteInput
              voteValue={voteValue}
              minValue={minRating}
              maxValue={maxRating}
              setVoteValue={setVoteValue}
              onSubmit={handleSubmit}
              creditType={drop.wave.voting_credit_type}
            />
          </div>
        </div>
      </div>

      {/* Bottom row: Quick vote buttons + Submit */}
      <div className="tw-flex tw-justify-between tw-items-center">
        <div className="tw-flex-1">
          {!isSliderMode && drop.rank !== 1 && (
            <SingleWaveDropVoteQuick drop={drop} setValue={setVoteValue} />
          )}
        </div>
        <div className="tw-flex-shrink-0">
          <SingleWaveDropVoteSubmit
            drop={drop}
            newRating={Number(voteValue)}
            ref={submitRef}
          />
        </div>
      </div>
    </div>
  );
};