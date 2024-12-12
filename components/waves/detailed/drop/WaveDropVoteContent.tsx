import { useEffect, useRef, useState } from "react";
import { ApiDrop } from "../../../../generated/models/ApiDrop";
import { WaveDropVoteSize } from "./WaveDropVote";
import WaveDropVoteSubmit, {
  WaveDropVoteSubmitHandles,
} from "./WaveDropVoteSubmit";
import WaveDropVoteSlider from "./WaveDropVoteSlider";
import { TabToggle } from "../../../common/TabToggle";
import { WaveDropVoteInput } from "./WaveDropVoteInput";
import { WaveDropVoteStats } from "./WaveDropVoteStats";
import WaveDropVoteQuick from "./WaveDropVoteQuick";

interface WaveDropVoteContentProps {
  readonly drop: ApiDrop;
  readonly size: WaveDropVoteSize;
}

export const WaveDropVoteContent: React.FC<WaveDropVoteContentProps> = ({
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

  const isCompact = size === WaveDropVoteSize.COMPACT;

  const submitRef = useRef<WaveDropVoteSubmitHandles | null>(null);

  const handleSubmit = async () => {
    if (submitRef.current) {
      await submitRef.current.handleClick();
    }
  };

  if (isCompact) {
    return (
      <div
        className="tw-flex tw-items-center tw-gap-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="tw-flex-1">
          <WaveDropVoteSlider
            voteValue={voteValue}
            minValue={minRating}
            maxValue={maxRating}
            setVoteValue={setVoteValue}
            rank={drop.rank}
          />
        </div>
        <WaveDropVoteSubmit
          drop={drop}
          newRating={Number(voteValue)}
          ref={submitRef}
        />
      </div>
    );
  }

  return (
    <div
      className="tw-@container tw-flex tw-flex-col tw-gap-4 tw-p-4 md:tw-p-5 tw-rounded-xl tw-bg-iron-900 tw-backdrop-blur-lg tw-border tw-border-iron-800 tw-border-solid tw-relative"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="tw-relative">
        <div className="tw-flex tw-justify-end tw-w-full">
          <TabToggle
            options={voteOptions}
            activeKey={isSliderMode ? "slider" : "numeric"}
            onSelect={(key) => setIsSliderMode(key === "slider")}
          />
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-6">
        <div className="tw-h-[38px] tw-w-full">
          <div className="tw-relative tw-w-full tw-h-full">
            <div
              className={`tw-absolute tw-inset-0 tw-transition-all tw-duration-300 tw-ease-in-out tw-mt-6
              ${
                isSliderMode
                  ? "tw-opacity-100 tw-translate-y-0"
                  : "tw-opacity-0 tw-translate-y-2 tw-pointer-events-none"
              }`}
            >
              <WaveDropVoteSlider
                voteValue={voteValue}
                setVoteValue={setVoteValue}
                minValue={minRating}
                maxValue={maxRating}
                rank={drop.rank}
              />
            </div>

            <div>
              <div
                className={`tw-absolute tw-inset-0 tw-transition-all tw-duration-300 tw-ease-in-out
              ${
                !isSliderMode
                  ? "tw-opacity-100 tw-translate-y-0"
                  : "tw-opacity-0 tw-translate-y-2 tw-pointer-events-none"
              }`}
              >
                <WaveDropVoteInput
                  voteValue={voteValue}
                  minValue={minRating}
                  maxValue={maxRating}
                  setVoteValue={setVoteValue}
                  onSubmit={handleSubmit}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="tw-flex tw-flex-col md:tw-gap-y-2 tw-mt-4">
          {drop.rank !== 1 && (
            <WaveDropVoteStats
              currentRating={drop.context_profile_context?.rating ?? 0}
              maxRating={maxRating}
            />
          )}

          <div className="tw-flex tw-justify-between tw-flex-wrap tw-items-center tw-gap-3 tw-mt-2 md:tw-mt-0">
            {drop.rank === 1 ? (
              <WaveDropVoteStats
                currentRating={drop.context_profile_context?.rating ?? 0}
                maxRating={maxRating}
              />
            ) : (
              <WaveDropVoteQuick drop={drop} setValue={setVoteValue} />
            )}
            <WaveDropVoteSubmit
              drop={drop}
              newRating={Number(voteValue)}
              ref={submitRef}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
