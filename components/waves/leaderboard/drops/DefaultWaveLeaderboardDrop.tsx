import React from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveLeaderboardDropHeader } from "./header/WaveLeaderboardDropHeader";
import { WaveLeaderboardDropContent } from "../content/WaveLeaderboardDropContent";
import { WaveLeaderboardDropFooter } from "./footer/WaveLeaderboardDropFooter";
import { ApiWave } from "../../../../generated/models/ObjectSerializer";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";
import { WaveLeaderboardDropRaters } from "./header/WaveleaderboardDropRaters";
import { SingleWaveDropVote } from "../../drop/SingleWaveDropVote";

interface DefaultWaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const DefaultWaveLeaderboardDrop: React.FC<DefaultWaveLeaderboardDropProps> = ({
  drop,
  wave,
  onDropClick,
}) => {
  const { canShowVote } = useDropInteractionRules(drop);
  
  const getBorderClasses = () => {
    const rank = drop.rank && drop.rank <= 3 ? drop.rank : 'default';
    
    const baseClasses = "tw-rounded-xl tw-bg-iron-950 tw-p-4 md:tw-px-5 tw-border tw-border-transparent tw-border-l tw-transition-all tw-duration-200 tw-ease-out";
    
    if (rank === 1) {
      return `${baseClasses} tw-shadow-[inset_1.5px_0_0_#fbbf24,inset_0_1px_0_rgba(251,191,36,0.13),inset_-1px_0_0_rgba(251,191,36,0.13),inset_0_-1px_0_rgba(251,191,36,0.13)]`;
    } else if (rank === 2) {
      return `${baseClasses} tw-shadow-[inset_1.5px_0_0_#94a3b8,inset_0_1px_0_rgba(148,163,184,0.13),inset_-1px_0_0_rgba(148,163,184,0.13),inset_0_-1px_0_rgba(148,163,184,0.13)]`;
    } else if (rank === 3) {
      return `${baseClasses} tw-shadow-[inset_1.5px_0_0_#CD7F32,inset_0_1px_0_rgba(205,127,50,0.13),inset_-1px_0_0_rgba(205,127,50,0.13),inset_0_-1px_0_rgba(205,127,50,0.13)]`;
    } else {
      return `${baseClasses} tw-shadow-[inset_1.5px_0_0_#848490,inset_0_1px_0_rgba(132,132,144,0.13),inset_-1px_0_0_rgba(132,132,144,0.13),inset_0_-1px_0_rgba(132,132,144,0.13)]`;
    }
  };

  return (
    <div
      onClick={() => onDropClick(drop)}
      className="tw-group tw-cursor-pointer tw-rounded-xl tw-transition tw-duration-300 tw-ease-out tw-w-full"
    >
      <div className={getBorderClasses()}>
        <div className="tw-flex tw-flex-col">
          <div className="tw-flex tw-flex-col tw-gap-3">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
              <WaveLeaderboardDropHeader drop={drop} />
              <div>
                <WaveLeaderboardDropRaters drop={drop} />
              </div>
            </div>
          </div>

          <div className="tw-ml-[3.35rem] tw-space-y-2">
            <WaveLeaderboardDropContent drop={drop} />

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
