"use client";

import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import { useVotingModalState } from "@/components/voting/useVotingModalState";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import WaveDropActionsOptions from "@/components/waves/drops/WaveDropActionsOptions";
import DropCurationButton from "@/components/waves/drops/DropCurationButton";
import WaveDropMobileMenuDelete from "@/components/waves/drops/WaveDropMobileMenuDelete";
import WaveDropMobileMenuCopyLink from "@/components/waves/drops/WaveDropMobileMenuCopyLink";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import type { DropContentPresentation } from "@/components/waves/drops/dropContentPresentation";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import { startDropOpen } from "@/utils/monitoring/dropOpenTiming";
import React from "react";
import { createPortal } from "react-dom";
import { WaveLeaderboardDropContent } from "../content/WaveLeaderboardDropContent";
import { WaveLeaderboardDropAuthorAvatar } from "./header/WaveLeaderboardDropAuthor";
import { WaveLeaderboardDropHeader } from "./header/WaveLeaderboardDropHeader";
import { WaveLeaderboardDropRaters } from "./header/WaveleaderboardDropRaters";

interface DefaultWaveLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly mediaContainerHeightClassName?: string | undefined;
  readonly contentPresentation?: DropContentPresentation;
}

const isClickFromCardDom = (
  event: React.MouseEvent<HTMLDivElement>
): boolean => {
  return event.currentTarget.contains(event.target as Node);
};

export const DefaultWaveLeaderboardDrop: React.FC<
  DefaultWaveLeaderboardDropProps
> = ({
  drop,
  onDropClick,
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  mediaContainerHeightClassName,
  contentPresentation = "default",
}) => {
  const { canShowVote, canDelete } = useDropInteractionRules(drop);
  const isVotingActionLocked = isVotingClosed || isVotingControlsLocked;
  const canShowVotingAction = canShowVote && !isVotingActionLocked;
  const {
    isOpen: isVoteModalOpen,
    open: openVoteModal,
    close: closeVoteModal,
  } = useVotingModalState(isVotingActionLocked);
  const { hasTouchScreen } = useDeviceInfo();
  const isMobileScreen = useIsMobileScreen();
  const suppressNextClickRef = React.useRef(false);

  const handleInteractionStart = React.useCallback(() => {
    suppressNextClickRef.current = true;
  }, []);

  const handleClickCapture = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!suppressNextClickRef.current) {
        return;
      }

      suppressNextClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  const clearPendingLongPressClick = React.useCallback(() => {
    suppressNextClickRef.current = false;
  }, []);

  // Use the hook for long press interactions
  const { isActive, setIsActive, touchHandlers } = useLongPressInteraction({
    hasTouchScreen,
    onInteractionStart: handleInteractionStart,
    preventDefault: false,
  });

  const handleMobileMenuOpenChange = React.useCallback(
    (nextIsActive: boolean) => {
      if (!nextIsActive) {
        suppressNextClickRef.current = false;
      }

      setIsActive(nextIsActive);
    },
    [setIsActive]
  );

  const handleMobileMenuClose = React.useCallback(() => {
    handleMobileMenuOpenChange(false);
  }, [handleMobileMenuOpenChange]);

  const getBorderClasses = () => {
    return "tw-rounded-xl tw-bg-iron-950 tw-p-4 md:tw-px-5 tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden desktop-hover:hover:tw-border-iron-700";
  };

  const handleVoteButtonClick = () => {
    openVoteModal();
  };

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isClickFromCardDom(event)) {
        return;
      }

      startDropOpen({
        dropId: drop.id,
        waveId: drop.wave.id,
        source: "leaderboard_list",
        isMobile: isMobileScreen,
      });
      onDropClick(drop);
    },
    [drop, isMobileScreen, onDropClick]
  );

  return (
    <div
      onClickCapture={handleClickCapture}
      onClick={handleClick}
      className="tw-group tw-relative tw-w-full tw-cursor-pointer tw-rounded-xl tw-transition tw-duration-300 tw-ease-out tw-@container"
    >
      <div className={getBorderClasses()} {...touchHandlers}>
        <div className="tw-flex tw-gap-x-3">
          <div className="tw-flex-shrink-0 tw-self-start">
            <WaveLeaderboardDropAuthorAvatar drop={drop} />
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-col">
            <div className="tw-flex tw-items-start tw-justify-between tw-gap-4">
              <WaveLeaderboardDropHeader
                drop={drop}
                showAvatar={false}
                winningThreshold={winningThreshold}
              />
              <div className="tw-flex tw-items-center">
                <div className="tw-hidden tw-h-8 lg:tw-block">
                  <WaveDropActionsOpen drop={drop} />
                </div>
                <div className="tw-hidden tw-h-8 lg:tw-block">
                  {canDelete && <WaveDropActionsOptions drop={drop} />}
                </div>
              </div>
            </div>
            <WaveLeaderboardDropContent
              drop={drop}
              isCompetitionDrop={true}
              mediaContainerHeightClassName={mediaContainerHeightClassName}
              contentPresentation={contentPresentation}
            />
            <div className="tw-mt-3 tw-flex tw-w-full tw-flex-col tw-justify-between tw-gap-x-2 tw-space-y-3 @[700px]:tw-flex-row @[700px]:tw-items-center @[700px]:tw-space-y-0">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
                <WaveLeaderboardDropRaters
                  drop={drop}
                  winningThreshold={winningThreshold}
                  winningThresholdMinDurationMs={
                    winningThresholdMinDurationMs
                  }
                  isVotingClosed={isVotingClosed}
                />
              </div>
              <div
                className="tw-flex tw-w-full tw-items-center tw-justify-end tw-gap-1.5 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4 @[700px]:tw-ml-auto @[700px]:tw-w-auto @[700px]:tw-border-t-0 @[700px]:tw-pt-0"
                onClick={(e) => e.stopPropagation()}
              >
                <DropCurationButton
                  waveId={drop.wave.id}
                  dropId={drop.id}
                  isCuratable={drop.context_profile_context?.curatable ?? false}
                  isCurated={drop.context_profile_context?.curated ?? false}
                />
                {canShowVotingAction && (
                  <VotingModalButton
                    drop={drop}
                    onClick={handleVoteButtonClick}
                    className="tw-font-semibold"
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Voting modal */}
      {isMobileScreen ? (
        <MobileVotingModal
          drop={drop}
          isOpen={isVoteModalOpen}
          onClose={closeVoteModal}
        />
      ) : (
        <VotingModal
          drop={drop}
          isOpen={isVoteModalOpen}
          onClose={closeVoteModal}
        />
      )}

      {/* Mobile menu slide-up */}
      {hasTouchScreen &&
        createPortal(
          <div
            onPointerDownCapture={clearPendingLongPressClick}
            onTouchStartCapture={clearPendingLongPressClick}
          >
            <CommonDropdownItemsMobileWrapper
              isOpen={isActive}
              setOpen={handleMobileMenuOpenChange}
            >
              <div className="tw-grid tw-grid-cols-1 tw-gap-y-2">
                {/* Open drop option */}
                <WaveDropMobileMenuOpen
                  drop={drop}
                  onOpenChange={handleMobileMenuClose}
                />
                <WaveDropMobileMenuCopyLink
                  drop={drop}
                  onCopy={handleMobileMenuClose}
                />

                {/* Delete option - only if user can delete */}
                {canDelete && (
                  <WaveDropMobileMenuDelete
                    drop={drop}
                    onDropDeleted={handleMobileMenuClose}
                  />
                )}
              </div>
            </CommonDropdownItemsMobileWrapper>
          </div>,
          document.body
        )}
    </div>
  );
};
