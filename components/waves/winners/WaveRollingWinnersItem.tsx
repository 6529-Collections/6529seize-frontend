import React from "react";
import { ApiWaveDecision } from "../../../generated/models/ApiWaveDecision";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { WaveRollingWinnersItemHeader } from "./WaveRollingWinnersItemHeader";
import { AnimatedAccordionContent } from "../../common/AnimatedAccordionContent";
import { WaveWinnersDrops } from "./drops/WaveWinnersDrops";

interface WaveRollingWinnersItemProps {
  readonly point: ApiWaveDecision;
  readonly index: number;
  readonly totalRounds: number;
  readonly isExpanded: boolean;
  readonly toggleExpanded: () => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly wave: ApiWave;
}

export const WaveRollingWinnersItem: React.FC<WaveRollingWinnersItemProps> = ({
  point,
  index,
  totalRounds,
  isExpanded,
  toggleExpanded,
  onDropClick,
  wave,
}) => {
  const hasWinners = point.winners.length > 0;
  
  return (
    <div
      className="tw-rounded-lg tw-bg-iron-900"
    >
      <WaveRollingWinnersItemHeader
        point={point}
        index={index}
        totalRounds={totalRounds}
        isExpanded={isExpanded}
        toggleExpanded={toggleExpanded}
      />
      
      <AnimatedAccordionContent isVisible={isExpanded}>
        <div className="tw-space-y-4 tw-bg-black">
          {hasWinners ? (
            <WaveWinnersDrops
              winners={point.winners}
              onDropClick={onDropClick}
              wave={wave}
              isLoading={false}
            />
          ) : null}
        </div>
      </AnimatedAccordionContent>
    </div>
  );
};
