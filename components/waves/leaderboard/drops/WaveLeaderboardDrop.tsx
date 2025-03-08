import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveLeaderboardDropRankIndicator } from "./WaveLeaderboardDropRankIndicator";
import { WaveLeaderboardDropHeader } from "./header/WaveLeaderboardDropHeader";
import { WaveLeaderboardDropContent } from "../content/WaveLeaderboardDropContent";
import { WaveLeaderboardDropFooter } from "./footer/WaveLeaderboardDropFooter";
import { ApiWave } from "../../../../generated/models/ObjectSerializer";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";
import { WaveLeaderboardDropRaters } from "./header/WaveleaderboardDropRaters";
import { SingleWaveDropVote } from "../../drop/SingleWaveDropVote";

interface WaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const rankColors: Record<number | "default", string> = {
  1: "#fbbf24", // Gold
  2: "#94a3b8", // Silver
  3: "#CD7F32", // Bronze
  default: "#60606C", // Default for 4th or higher
};

export const WaveLeaderboardDrop: React.FC<WaveLeaderboardDropProps> = ({
  drop,
  wave,
  onDropClick,
}) => {
  const { canShowVote } = useDropInteractionRules(drop);
  const borderColor =
    drop.rank && drop.rank <= 3 ? rankColors[drop.rank] : rankColors.default;

  return (
    <div
      onClick={() => onDropClick(drop)}
      className="tw-group tw-cursor-pointer tw-rounded-xl tw-transition tw-duration-300 tw-ease-out tw-w-full"
    >
      <div
        className="tw-rounded-xl tw-bg-iron-950 tw-p-4 md:tw-px-5"
        style={{
          border: "1px solid transparent",
          borderLeft: "2px solid transparent",
          boxShadow: `inset 2px 0 0 ${borderColor}, 
                    inset 0 1px 0 ${borderColor}20, 
                    inset -1px 0 0 ${borderColor}20, 
                    inset 0 -1px 0 ${borderColor}20`,
          transition: "box-shadow 0.2s ease, background-color 0.2s ease",
        }}
      >
        <div className="tw-flex tw-flex-col tw-gap-3">
          <div className="tw-flex tw-flex-col tw-gap-3">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
              <WaveLeaderboardDropHeader drop={drop} />
              <div>
                <WaveLeaderboardDropRaters drop={drop} />
              </div>
            </div>
          </div>

          <div className="tw-pl-0 tw-space-y-2">
            <div className="tw-rounded-lg tw-pb-2">
              <WaveLeaderboardDropContent drop={drop} />
            </div>

            {canShowVote && (
              <div className="tw-pb-3 tw-pt-2">
                <SingleWaveDropVote drop={drop} />
              </div>
            )}
            <WaveLeaderboardDropFooter drop={drop} wave={wave} />
          </div>
        </div>
      </div>
    </div>
  );
};
