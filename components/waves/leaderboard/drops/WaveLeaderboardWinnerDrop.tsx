import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveLeaderboardDropHeader } from "./header/WaveLeaderboardDropHeader";
import { WaveLeaderboardDropContent } from "../content/WaveLeaderboardDropContent";
import { WaveLeaderboardDropFooter } from "./footer/WaveLeaderboardDropFooter";
import { ApiWave } from "../../../../generated/models/ObjectSerializer";
import { WaveLeaderboardDropRaters } from "./header/WaveleaderboardDropRaters";

interface WaveLeaderboardWinnerDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const WaveLeaderboardWinnerDrop: React.FC<WaveLeaderboardWinnerDropProps> = ({
  drop,
  wave,
  onDropClick,
}) => {
  return (
    <div
      onClick={() => onDropClick(drop)}
      className="tw-group tw-cursor-pointer tw-rounded-xl tw-transition tw-duration-300 tw-ease-out tw-w-full"
    >
      <div 
        className="tw-rounded-xl tw-bg-iron-950 tw-p-4 md:tw-px-5 tw-border tw-border-transparent tw-border-l-2 tw-transition-all tw-duration-200 tw-ease-out tw-shadow-[inset_1px_0_0_#fbbf24,inset_0_1px_0_rgba(251,191,36,0.13),inset_-1px_0_0_rgba(251,191,36,0.13),inset_0_-1px_0_rgba(251,191,36,0.13)]">
        <div className="tw-flex tw-flex-col tw-gap-3">
          <div className="tw-flex tw-flex-col tw-gap-3">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
              <WaveLeaderboardDropHeader drop={drop} />
              <div className="tw-flex-shrink-0">
                <WaveLeaderboardDropRaters drop={drop} />
              </div>
            </div>
          </div>

          <div className="tw-pl-0 tw-space-y-2">
            <div className="tw-rounded-lg tw-pb-2">
              <WaveLeaderboardDropContent 
                drop={drop}
              />
            </div>
            <WaveLeaderboardDropFooter drop={drop} wave={wave} />
          </div>
        </div>
      </div>
    </div>
  );
}; 
