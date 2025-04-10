import React, { useState } from "react";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import { WaveLeaderboardDropHeader } from "./header/WaveLeaderboardDropHeader";
import { WaveLeaderboardDropContent } from "../content/WaveLeaderboardDropContent";
import { WaveLeaderboardDropFooter } from "./footer/WaveLeaderboardDropFooter";
import { ApiWave } from "../../../../generated/models/ObjectSerializer";
import { useDropInteractionRules } from "../../../../hooks/drops/useDropInteractionRules";
import { WaveLeaderboardDropRaters } from "./header/WaveleaderboardDropRaters";
import WaveDropActionsOptions from "../../drops/WaveDropActionsOptions";
import WaveDropActionsOpen from "../../drops/WaveDropActionsOpen";
import { VotingModal, MobileVotingModal } from "../../../../components/voting";
import VotingModalButton from "../../../../components/voting/VotingModalButton";
import useIsMobileScreen from "../../../../hooks/isMobileScreen";

interface DefaultWaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const DefaultWaveLeaderboardDrop: React.FC<
  DefaultWaveLeaderboardDropProps
> = ({ drop, wave, onDropClick }) => {
  const { canShowVote, canDelete } = useDropInteractionRules(drop);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const isMobileScreen = useIsMobileScreen();

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
      className="tw-group tw-cursor-pointer tw-rounded-xl tw-transition tw-duration-300 tw-ease-out tw-w-full tw-relative"
    >
      <div className={getBorderClasses()}>
        <div className="tw-flex tw-flex-col">
          <div className="tw-flex tw-flex-col tw-gap-3">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
              <WaveLeaderboardDropHeader drop={drop} />
              <div className="tw-flex tw-items-center">
                <div className="tw-h-8 tw-hidden lg:tw-block">
                  <WaveDropActionsOpen drop={drop} />
                </div>
                <div className="tw-h-8 tw-hidden lg:tw-block">
                  {canDelete && <WaveDropActionsOptions drop={drop} />}
                </div>
              </div>
            </div>
          </div>

          <div className="tw-space-y-2">
            <div className="tw-ml-[3.35rem]">
              <WaveLeaderboardDropContent drop={drop} />
            </div>
          </div>
          <div className="tw-mt-3 sm:tw-grid sm:tw-grid-cols-[auto,1fr] tw-gap-x-4 sm:tw-items-center sm:tw-ml-[3.25rem] tw-space-y-3 sm:tw-space-y-0">
            <div className="sm:tw-contents">
              <WaveLeaderboardDropRaters drop={drop} />
            </div>
            <div className="sm:tw-justify-self-end">
              <WaveLeaderboardDropFooter drop={drop} wave={wave} />
            </div>
          </div>

          {canShowVote && (
            <div
              className="tw-flex tw-justify-center md:tw-ml-auto tw-pt-4 tw-mt-4 tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 md:tw-border-t-0 md:mt-0 md:tw-pt-0"
              onClick={(e) => e.stopPropagation()}
            >
              <VotingModalButton
                drop={drop}
                onClick={() => setIsVotingModalOpen(true)}
              />
            </div>
          )}
        </div>
      </div>

      {/* Voting modal */}
      {isMobileScreen ? (
        <MobileVotingModal
          drop={drop}
          isOpen={isVotingModalOpen}
          onClose={() => setIsVotingModalOpen(false)}
        />
      ) : (
        <VotingModal
          drop={drop}
          isOpen={isVotingModalOpen}
          onClose={() => setIsVotingModalOpen(false)}
        />
      )}
    </div>
  );
};
