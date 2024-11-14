import React from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { WaveLeaderboardDropRankIndicator } from "./WaveLeaderboardDropRankIndicator";
import { WaveLeaderboardDropHeader } from "./header/WaveLeaderboardDropHeader";
import { WaveLeaderboardDropContent } from "../content/WaveLeaderboardDropContent";
import { WaveLeaderboardDropFooter } from "./footer/WaveLeaderboardDropFooter";
import {  ApiWave } from "../../../../../generated/models/ObjectSerializer";

interface WaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly setActiveDrop: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardDrop: React.FC<WaveLeaderboardDropProps> = ({
  drop,
  wave,
  setActiveDrop,
}) => {
  const getContainerClasses = (): string => {
    if (!drop.rank || drop.rank > 3) {
      return "tw-from-iron-900 tw-to-iron-900 hover:tw-from-iron-800 hover:tw-to-iron-800";
    }
    if (drop.rank === 1) {
      return "tw-from-[#E8D48A]/15 tw-to-iron-900/80 hover:tw-from-[#E8D48A]/30";
    }
    if (drop.rank === 2) {
      return "tw-from-[#dddddd]/15 tw-to-iron-900/80 hover:tw-from-[#dddddd]/30";
    }
    if (drop.rank === 3) {
      return "tw-from-[#CD7F32]/15 tw-to-iron-900/80 hover:tw-from-[#CD7F32]/30";
    }
    return "";
  };

  const containerClasses = getContainerClasses();

  return (
    <div className="tw-group tw-cursor-pointer" onClick={() => setActiveDrop(drop)}>
      <div
        className={`tw-rounded-xl tw-bg-gradient-to-b ${containerClasses} tw-p-[1px] tw-transition tw-duration-300 tw-ease-out`}
      >
        <div className="tw-rounded-xl tw-bg-iron-950 tw-p-6">
          <div className="tw-flex tw-gap-5">
            <WaveLeaderboardDropRankIndicator drop={drop} />
            <div className="tw-flex-1">
              <WaveLeaderboardDropHeader drop={drop} />
              <WaveLeaderboardDropContent drop={drop} setActiveDrop={setActiveDrop} />
              <WaveLeaderboardDropFooter drop={drop} wave={wave} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
