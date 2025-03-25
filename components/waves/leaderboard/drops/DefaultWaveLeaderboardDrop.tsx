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

export const DefaultWaveLeaderboardDrop: React.FC<
  DefaultWaveLeaderboardDropProps
> = ({ drop, wave, onDropClick }) => {
  const { canShowVote } = useDropInteractionRules(drop);

  const getBorderClasses = () => {
    const rank = drop.rank && drop.rank <= 3 ? drop.rank : "default";

    // Base classes with consistent border styling for ongoing competition items
    const baseClasses =
      "tw-rounded-xl tw-bg-iron-950 tw-p-4 md:tw-px-5 tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden";

    // Match the hover effects from the other component
    if (rank === 1) {
      return `${baseClasses} desktop-hover:hover:tw-border-[#fbbf24]/40`;
    } else if (rank === 2) {
      return `${baseClasses} desktop-hover:hover:tw-border-[#94a3b8]/40`;
    } else if (rank === 3) {
      return `${baseClasses} desktop-hover:hover:tw-border-[#CD7F32]/40`;
    } else {
      // More subtle hover effect for ranks 4+
      return `${baseClasses} desktop-hover:hover:tw-border-iron-700`;
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
              {/* Removed raters from header, now always in footer */}
            </div>
          </div>

          <div className="tw-space-y-2">
            <div className="tw-ml-[3.35rem]">
              <WaveLeaderboardDropContent drop={drop} />
            </div>

            {canShowVote && (
              <div className="tw-pb-3 tw-pt-2 sm:tw-ml-[3.25rem]">
                <SingleWaveDropVote drop={drop} />
              </div>
            )}
          </div>
          {/* Responsive footer layout with pure Tailwind */}
          <div className="tw-mt-3 tw-grid tw-grid-cols-[auto,1fr] tw-gap-x-4 tw-items-center sm:tw-ml-[3.25rem]">
            <div className="tw-contents">
              <WaveLeaderboardDropRaters drop={drop} />
            </div>
            <div className="tw-justify-self-end">
              <WaveLeaderboardDropFooter drop={drop} wave={wave} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
