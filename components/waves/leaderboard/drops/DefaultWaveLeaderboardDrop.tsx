"use client";

import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import WaveDropActionsOptions from "@/components/waves/drops/WaveDropActionsOptions";
import WaveDropMobileMenuDelete from "@/components/waves/drops/WaveDropMobileMenuDelete";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import { ApiWave } from "@/generated/models/ObjectSerializer";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import React, { useState } from "react";
import { createPortal } from "react-dom";
import { WaveLeaderboardDropContent } from "../content/WaveLeaderboardDropContent";
import { WaveLeaderboardDropFooter } from "./footer/WaveLeaderboardDropFooter";
import { WaveLeaderboardDropHeader } from "./header/WaveLeaderboardDropHeader";
import { WaveLeaderboardDropRaters } from "./header/WaveleaderboardDropRaters";

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
  const { hasTouchScreen } = useDeviceInfo();
  const isMobileScreen = useIsMobileScreen();

  // Use the hook for long press interactions
  const { isActive, setIsActive, touchHandlers } = useLongPressInteraction({
    hasTouchScreen,
  });

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
      className="tw-@container tw-group tw-cursor-pointer tw-rounded-xl tw-transition tw-duration-300 tw-ease-out tw-w-full tw-relative">
      <div className={getBorderClasses()} {...touchHandlers}>
        <div className="tw-flex tw-flex-col tw-gap-3">
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
              <WaveLeaderboardDropContent drop={drop} isCompetitionDrop={true} />
            </div>
          </div>
          <div className="tw-mt-3 tw-inline-flex tw-flex-col @[700px]:tw-flex-row tw-justify-between @[700px]:tw-items-center sm:tw-ml-[3.5rem] tw-space-y-3 @[700px]:tw-space-y-0 tw-gap-x-2">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-y-2 tw-gap-x-4">
              <WaveLeaderboardDropRaters drop={drop} />
              <WaveLeaderboardDropFooter drop={drop} wave={wave} />
            </div>
            {canShowVote && (
              <div
                className="tw-flex tw-justify-center tw-pt-4 @[700px]:tw-pt-0 @[700px]:tw-ml-auto tw-border-t tw-border-iron-800 tw-border-solid tw-border-x-0 tw-border-b-0 @[700px]:tw-border-t-0"
                onClick={(e) => e.stopPropagation()}>
                <VotingModalButton
                  drop={drop}
                  onClick={() => setIsVotingModalOpen(true)}
                />
              </div>
            )}
          </div>
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

      {/* Mobile menu slide-up */}
      {hasTouchScreen &&
        createPortal(
          <CommonDropdownItemsMobileWrapper
            isOpen={isActive}
            setOpen={setIsActive}>
            <div className="tw-grid tw-grid-cols-1 tw-gap-y-2">
              {/* Open drop option */}
              <WaveDropMobileMenuOpen
                drop={drop}
                onOpenChange={() => setIsActive(false)}
              />

              {/* Delete option - only if user can delete */}
              {canDelete && (
                <WaveDropMobileMenuDelete
                  drop={drop}
                  onDropDeleted={() => setIsActive(false)}
                />
              )}
            </div>
          </CommonDropdownItemsMobileWrapper>,
          document.body
        )}
    </div>
  );
};
