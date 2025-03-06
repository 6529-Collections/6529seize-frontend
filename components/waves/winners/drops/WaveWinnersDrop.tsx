import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveWinnersDropHeader } from "./header/WaveWinnersDropHeader";
import { WaveWinnersDropContent } from "./WaveWinnersDropContent";
import WaveWinnersDropOutcome from "./header/WaveWinnersDropOutcome";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ApiWaveDecisionWinner } from "../../../../generated/models/ApiWaveDecisionWinner";
interface WaveWinnersDropProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const rankGradients: Record<number | "default", string> = {
  1: "tw-from-[#E8D48A]/30 tw-via-[#D9A962]/30 tw-to-[#E8D48A]/30 desktop-hover:hover:tw-from-[#E8D48A]/40 desktop-hover:hover:tw-via-[#D9A962]/40 desktop-hover:hover:tw-to-[#E8D48A]/40 tw-shadow-[0_0_32px_rgba(232,212,138,0.1)] desktop-hover:hover:tw-shadow-[0_0_48px_rgba(232,212,138,0.15)]",
  2: "tw-from-[#DDDDDD]/30 tw-via-[#C0C0C0]/30 tw-to-[#DDDDDD]/30 desktop-hover:hover:tw-from-[#DDDDDD]/40 desktop-hover:hover:tw-via-[#C0C0C0]/40 desktop-hover:hover:tw-to-[#DDDDDD]/40 tw-shadow-[0_0_32px_rgba(221,221,221,0.1)] desktop-hover:hover:tw-shadow-[0_0_48px_rgba(221,221,221,0.15)]",
  3: "tw-from-[#CD7F32]/30 tw-via-[#B87333]/30 tw-to-[#CD7F32]/30 desktop-hover:hover:tw-from-[#CD7F32]/40 desktop-hover:hover:tw-via-[#B87333]/40 desktop-hover:hover:tw-to-[#CD7F32]/40 tw-shadow-[0_0_32px_rgba(205,127,50,0.1)] desktop-hover:hover:tw-shadow-[0_0_48px_rgba(205,127,50,0.15)]",
  default:
    "tw-from-iron-800 tw-via-iron-800 tw-to-iron-800 hover:tw-from-iron-700 hover:tw-via-iron-700 hover:tw-to-iron-700",
};

export const WaveWinnersDrop: React.FC<WaveWinnersDropProps> = ({
  winner,
  wave,
  onDropClick,
}) => {
  const gradientClass =
    winner.place && winner.place <= 3
      ? rankGradients[winner.place]
      : rankGradients.default;

  return (
    <div
      onClick={() => onDropClick({
        ...winner.drop,
        stableKey: winner.drop.id,
        stableHash: winner.drop.id,
      })}
      className={`tw-group tw-cursor-pointer tw-rounded-xl tw-bg-gradient-to-b ${gradientClass} tw-p-[1px] tw-transition tw-duration-300 tw-ease-out`}
    >
      <div className="tw-rounded-xl tw-bg-iron-950 tw-p-5">
        <div className="tw-flex tw-flex-col">
          <WaveWinnersDropHeader winner={winner} />
          <WaveWinnersDropContent winner={winner} />
          <div className="tw-mt-2 md:tw-ml-16">
            <WaveWinnersDropOutcome winner={winner} wave={wave} />
          </div>
        </div>
      </div>
    </div>
  );
};
