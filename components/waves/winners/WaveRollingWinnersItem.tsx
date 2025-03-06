import React from "react";
import { ApiWaveDecision } from "../../../generated/models/ApiWaveDecision";
import { ApiWave } from "../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../helpers/waves/drop.helpers";
import { WaveRollingWinnersItemHeader } from "./WaveRollingWinnersItemHeader";
import { AnimatedAccordionContent } from "../../common/AnimatedAccordionContent";
import { WaveWinnersRoundContent } from "./WaveWinnersRoundContent";

interface WaveRollingWinnersItemProps {
  readonly point: ApiWaveDecision;
  readonly index: number;
  readonly isExpanded: boolean;
  readonly toggleExpanded: () => void;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly wave: ApiWave;
}

export const WaveRollingWinnersItem: React.FC<WaveRollingWinnersItemProps> = ({
  point,
  index,
  isExpanded,
  toggleExpanded,
  onDropClick,
  wave,
}) => {
  return (
    <div
      className="tw-rounded-lg tw-bg-iron-900 tw-border tw-border-iron-800"
    >
      <WaveRollingWinnersItemHeader
        point={point}
        index={index}
        isExpanded={isExpanded}
        toggleExpanded={toggleExpanded}
      />
      
      <AnimatedAccordionContent isVisible={isExpanded}>
        <div className="tw-space-y-4 tw-bg-black tw-rounded-b-xl tw-border-t tw-border-iron-800">
          <WaveWinnersRoundContent
            winners={point.winners}
            onDropClick={onDropClick}
            wave={wave}
            isLoading={false}
          />
        </div>
      </AnimatedAccordionContent>
    </div>
  );
};
