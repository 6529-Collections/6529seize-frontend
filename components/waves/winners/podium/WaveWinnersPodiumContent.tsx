import React from "react";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { WavePodiumItem } from "./WavePodiumItem";

interface WaveWinnersPodiumContentProps {
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly firstPlaceWinner?: ApiWaveDecisionWinner;
  readonly secondPlaceWinner?: ApiWaveDecisionWinner;
  readonly thirdPlaceWinner?: ApiWaveDecisionWinner;
}

export const WaveWinnersPodiumContent: React.FC<WaveWinnersPodiumContentProps> = ({
  onDropClick,
  firstPlaceWinner,
  secondPlaceWinner,
  thirdPlaceWinner
}) => {
  return (
    <div className="tw-relative tw-mx-auto tw-rounded-xl tw-overflow-hidden tw-pt-6 lg:tw-px-4 tw-bg-iron-950/60">
      <div className="md:tw-max-w-3xl tw-mx-auto">
        <div className="tw-grid tw-grid-cols-3 tw-gap-x-2 lg:tw-gap-x-4 tw-items-end">
          <div>
            <WavePodiumItem
              winner={secondPlaceWinner}
              onDropClick={onDropClick}
              position="second"
              customAnimationIndex={1}
            />
          </div>
          <div>
            <WavePodiumItem
              winner={firstPlaceWinner}
              onDropClick={onDropClick}
              position="first"
              customAnimationIndex={0}
            />
          </div>
          <div>
            <WavePodiumItem
              winner={thirdPlaceWinner}
              onDropClick={onDropClick}
              position="third"
              customAnimationIndex={2}
            />
          </div>
        </div>
      </div>
    </div>
  );
};