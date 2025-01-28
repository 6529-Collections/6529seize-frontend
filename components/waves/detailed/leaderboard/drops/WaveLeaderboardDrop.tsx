import React from "react";
import { ExtendedDrop } from "../../../../../helpers/waves/drop.helpers";
import { WaveLeaderboardDropRankIndicator } from "./WaveLeaderboardDropRankIndicator";
import { WaveLeaderboardDropHeader } from "./header/WaveLeaderboardDropHeader";
import { WaveLeaderboardDropContent } from "../content/WaveLeaderboardDropContent";
import { WaveLeaderboardDropFooter } from "./footer/WaveLeaderboardDropFooter";
import { ApiWave } from "../../../../../generated/models/ObjectSerializer";
import { useDropInteractionRules } from "../../../../../hooks/drops/useDropInteractionRules";
import { WaveDropVote } from "../../drop/WaveDropVote";
import { WaveLeaderboardDropRaters } from "./header/WaveleaderboardDropRaters";

interface WaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const rankGradients: Record<number | "default", string> = {
  1: "tw-from-[#E8D48A]/20 tw-via-[#D9A962]/20 tw-to-[#E8D48A]/20 desktop-hover:hover:tw-from-[#E8D48A]/30 desktop-hover:hover:tw-via-[#D9A962]/30 desktop-hover:hover:tw-to-[#E8D48A]/30",
  2: "tw-from-[#DDDDDD]/20 tw-via-[#C0C0C0]/20 tw-to-[#DDDDDD]/20 desktop-hover:hover:tw-from-[#DDDDDD]/30 desktop-hover:hover:tw-via-[#C0C0C0]/30 desktop-hover:hover:tw-to-[#DDDDDD]/30",
  3: "tw-from-[#CD7F32]/20 tw-via-[#B87333]/20 tw-to-[#CD7F32]/20 desktop-hover:hover:tw-from-[#CD7F32]/30 desktop-hover:hover:tw-via-[#B87333]/30 desktop-hover:hover:tw-to-[#CD7F32]/30",
  default:
    "tw-from-iron-800 tw-via-iron-800 tw-to-iron-800 hover:tw-from-iron-700 hover:tw-via-iron-700 hover:tw-to-iron-700",
};

export const WaveLeaderboardDrop: React.FC<WaveLeaderboardDropProps> = ({
  drop,
  wave,
  onDropClick,
}) => {
  const { canShowVote } = useDropInteractionRules(drop);
  const gradientClass =
    drop.rank && drop.rank <= 3
      ? rankGradients[drop.rank]
      : rankGradients.default;

  return (
    <div
      onClick={() => onDropClick(drop)}
      className={`tw-group tw-cursor-pointer tw-rounded-xl tw-bg-gradient-to-b ${gradientClass} tw-p-[1px] tw-transition tw-duration-300 tw-ease-out`}
    >
      <div className="tw-rounded-xl tw-bg-iron-950 tw-p-4 md:tw-px-5">
        <div className="tw-flex tw-flex-col tw-gap-3">
          <div className="tw-flex tw-flex-col tw-gap-5">
            <div className="tw-flex tw-items-center tw-gap-4 sm:tw-hidden">
              <WaveLeaderboardDropRankIndicator drop={drop} />
              <div>
                <WaveLeaderboardDropRaters drop={drop} />
              </div>
            </div>
            
            <div className="tw-hidden sm:tw-flex tw-gap-5 tw-items-center">
              <WaveLeaderboardDropRankIndicator drop={drop} />
              <div className="tw-flex-1">
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
                  <WaveLeaderboardDropHeader drop={drop} />
                  <div>
                    <WaveLeaderboardDropRaters drop={drop} />
                  </div>
                </div>
              </div>
            </div>

            <div className="sm:tw-hidden">
              <WaveLeaderboardDropHeader drop={drop} />
            </div>
          </div>

          <div className="tw-pl-0 tw-space-y-2">
            <div className="tw-rounded-lg tw-bg-iron-900/50 tw-px-4 tw-pb-4 tw-pt-2 tw-ring-1 tw-ring-iron-800/50">
              <WaveLeaderboardDropContent
                drop={drop}
              />
            </div>

            {canShowVote && (
              <div className="tw-pb-3 tw-pt-4">
                <WaveDropVote drop={drop} />
              </div>
            )}
            <WaveLeaderboardDropFooter drop={drop} wave={wave} />
          </div>
        </div>
      </div>
    </div>
  );
};
