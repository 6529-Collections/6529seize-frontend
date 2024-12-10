import { ApiDrop } from "../../../../generated/models/ObjectSerializer";
import { useState, useEffect } from "react";
import WaveDropVoteQuick from "./WaveDropVoteQuick";
import { WaveDropVoteInput } from "./WaveDropVoteInput";
import { TabToggle } from "../../../common/TabToggle";
import dynamic from "next/dynamic";
import { WaveDropVoteStats } from "./WaveDropVoteStats";

export enum WaveDropVoteSize {
  NORMAL = "NORMAL",
  COMPACT = "COMPACT",
}

interface WaveDropVoteProps {
  readonly drop: ApiDrop;
  readonly size?: WaveDropVoteSize;
}

const WaveDropVoteSubmit = dynamic(() => import("./WaveDropVoteSubmit"), {
  ssr: false,
});

const WaveDropVoteSlider = dynamic(() => import("./WaveDropVoteSlider"), {
  ssr: false,
});

export const WaveDropVote: React.FC<WaveDropVoteProps> = ({
  drop,
  size = WaveDropVoteSize.NORMAL,
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
        <WaveDropVoteSubmit drop={drop} newRating={Number(voteValue)} />
      </div>
    );
  }

  return (
    <div
      className="tw-flex tw-flex-col tw-gap-4 tw-p-5 tw-rounded-xl tw-bg-iron-900 tw-backdrop-blur-lg tw-border tw-border-iron-800 tw-border-solid tw-relative"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="tw-relative">
        <div className="tw-absolute tw-top-[-12px] tw-right-[-12px]">
          <TabToggle
            options={voteOptions}
            activeKey={isSliderMode ? "slider" : "numeric"}
            onSelect={(key) => setIsSliderMode(key === "slider")}
          />
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-6 tw-mt-6 md:tw-mt-4">
        <div className="sm:tw-h-[38px] tw-w-full">
          <div className="tw-relative tw-w-full tw-h-full">
            <div
              className={`tw-absolute tw-inset-0 tw-transition-all tw-duration-300 tw-ease-in-out
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

            <div className={`${!isSliderMode ? "tw-h-16 min-[488px]:tw-h-10 sm:tw-h-full" : ""}`}>
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
                />
              </div>
            </div>
          </div>
        </div>

        <div className="tw-flex tw-flex-col md:tw-gap-y-2 tw-mt-2 md:tw-mt-0">
          {drop.rank !== 1 && (
            <WaveDropVoteStats
              currentRating={drop.context_profile_context?.rating ?? 0}
              maxRating={maxRating}
            />
          )}

          <div className="tw-flex tw-justify-between tw-items-center tw-mt-2 md:tw-mt-0">
            {drop.rank === 1 ? (
              <WaveDropVoteStats
                currentRating={drop.context_profile_context?.rating ?? 0}
                maxRating={maxRating}
              />
            ) : (
              <WaveDropVoteQuick drop={drop} setValue={setVoteValue} />
            )}
            <WaveDropVoteSubmit drop={drop} newRating={Number(voteValue)} />
          </div>
        </div>
      </div>
    </div>
  );
};
