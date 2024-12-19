import React from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { WaveWinnersDropHeader } from "./header/WaveWinnersDropHeader";
import { WaveWinnersDropContent } from "./WaveWinnersDropContent";

interface WaveWinnersDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveWinnersDrop: React.FC<WaveWinnersDropProps> = ({
  drop,
  onDropClick,
}) => {
  return (
    <div className="tw-rounded-xl tw-bg-gradient-to-b tw-p-[1px] tw-from-[#E8D48A]/20 tw-via-[#D9A962]/20 tw-to-[#E8D48A]/20">
      <div className="tw-bg-iron-950 tw-rounded-xl">
        <div className="tw-p-4">
          <WaveWinnersDropHeader drop={drop} />
          <WaveWinnersDropContent drop={drop} />
        </div>
      </div>
    </div>
  );
};
