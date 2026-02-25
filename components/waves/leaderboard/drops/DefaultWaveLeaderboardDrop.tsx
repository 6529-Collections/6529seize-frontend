"use client";

import React, { useState } from "react";
import { createPortal } from "react-dom";

import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import DropCurationButton from "@/components/waves/drops/DropCurationButton";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import WaveDropActionsOptions from "@/components/waves/drops/WaveDropActionsOptions";
import WaveDropMobileMenuDelete from "@/components/waves/drops/WaveDropMobileMenuDelete";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import { startDropOpen } from "@/utils/monitoring/dropOpenTiming";

import { WaveLeaderboardDropContent } from "../content/WaveLeaderboardDropContent";

import { WaveLeaderboardDropFooter } from "./footer/WaveLeaderboardDropFooter";
import { WaveLeaderboardDropHeader } from "./header/WaveLeaderboardDropHeader";
import { WaveLeaderboardDropRaters } from "./header/WaveleaderboardDropRaters";

interface DefaultWaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const DefaultWaveLeaderboardDrop: React.FC<
  DefaultWaveLeaderboardDropProps
> = ({ drop, onDropClick }) => {
  const { canShowVote, canDelete } = useDropInteractionRules(drop);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState(false);
  const { hasTouchScreen } = useDeviceInfo();
  const isMobileScreen = useIsMobileScreen();

  // Use the hook for long press interactions
  const { isActive, setIsActive, touchHandlers } = useLongPressInteraction({
    hasTouchScreen,
  });

  const getBorderClasses = () => {
    return "tw-rounded-xl tw-bg-iron-950 tw-p-4 md:tw-px-5 tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden desktop-hover:hover:tw-border-iron-700";
  };

  return (
    <div
      onClick={() => {
        startDropOpen({
          dropId: drop.id,
          waveId: drop.wave.id,
          source: "leaderboard_list",
          isMobile: isMobileScreen,
        });
        onDropClick(drop);
      }}
      className="tw-group tw-relative tw-w-full tw-cursor-pointer tw-rounded-xl tw-transition tw-duration-300 tw-ease-out tw-@container"
    >
      <div className={getBorderClasses()} {...touchHandlers}>
        <div className="tw-flex tw-flex-col tw-gap-3">
          <div className="tw-flex tw-flex-col tw-gap-3">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
              <WaveLeaderboardDropHeader drop={drop} />
              <div className="tw-flex tw-items-center">
                <div className="tw-hidden tw-h-8 lg:tw-block">
                  <WaveDropActionsOpen drop={drop} />
                </div>
                <div className="tw-hidden tw-h-8 lg:tw-block">
                  {canDelete && <WaveDropActionsOptions drop={drop} />}
                </div>
              </div>
            </div>
          </div>

          <div className="tw-space-y-2">
            <div className="tw-ml-14">
              <WaveLeaderboardDropContent
                drop={drop}
                isCompetitionDrop={true}
              />
            </div>
          </div>
          <div className="tw-inline-flex tw-flex-col tw-justify-between tw-gap-x-2 tw-space-y-3 @[700px]:tw-flex-row @[700px]:tw-items-center @[700px]:tw-space-y-0 sm:tw-ml-14">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
              <WaveLeaderboardDropRaters drop={drop} />
              <WaveLeaderboardDropFooter drop={drop} />
            </div>
            <div
              className="tw-flex tw-items-center tw-justify-center tw-gap-1.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4 @[700px]:tw-ml-auto @[700px]:tw-border-t-0 @[700px]:tw-pt-0"
              onClick={(e) => e.stopPropagation()}
            >
              <DropCurationButton
                dropId={drop.id}
                waveId={drop.wave.id}
                isCuratable={drop.context_profile_context?.curatable ?? false}
                isCurated={drop.context_profile_context?.curated ?? false}
              />
              {canShowVote && (
                <VotingModalButton
                  drop={drop}
                  onClick={() => setIsVotingModalOpen(true)}
                  variant="subtle"
                />
              )}
            </div>
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
            setOpen={setIsActive}
          >
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
