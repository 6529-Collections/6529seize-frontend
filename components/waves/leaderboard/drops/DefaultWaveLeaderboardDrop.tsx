"use client";

import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import ContentModerationDropActions from "@/components/content-moderation/ContentModerationDropActions";
import ReportDropModal from "@/components/content-moderation/ReportDropModal";
import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import { useVotingModalState } from "@/components/voting/useVotingModalState";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import WaveDropActionsOptions from "@/components/waves/drops/WaveDropActionsOptions";
import WaveDropMobileMenuDelete from "@/components/waves/drops/WaveDropMobileMenuDelete";
import WaveDropMobileMenuCopyLink from "@/components/waves/drops/WaveDropMobileMenuCopyLink";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import {
  PROPOSAL_LIST_CARD_SURFACE_CLASS,
  type DropContentPresentation,
} from "@/components/waves/drops/dropContentPresentation";
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
  readonly onVoteClick?: ((drop: ExtendedDrop) => void) | undefined;
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
  onVoteClick,
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
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const suppressNextClickRef = React.useRef(false);
  const isProposalCard = contentPresentation === "proposalCard";

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
    const backgroundClass = isProposalCard
      ? PROPOSAL_LIST_CARD_SURFACE_CLASS
      : "tw-bg-iron-950";
    const paddingClass = isProposalCard
      ? "tw-px-4 tw-pb-3 tw-pt-4 md:tw-px-5"
      : "tw-p-4 md:tw-px-5";

    return `tw-rounded-xl ${backgroundClass} ${paddingClass} tw-border tw-border-solid tw-border-iron-800 tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden desktop-hover:hover:tw-border-iron-700`;
  };

  const handleVoteButtonClick = () => {
    if (onVoteClick) {
      onVoteClick(drop);
      return;
    }
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
              <div className="tw-hidden tw-h-8 tw-items-center lg:tw-flex">
                {!isProposalCard && <WaveDropActionsOpen drop={drop} />}
                {canDelete && <WaveDropActionsOptions drop={drop} />}
              </div>
            </div>
            <WaveLeaderboardDropContent
              drop={drop}
              isCompetitionDrop={true}
              mediaContainerHeightClassName={mediaContainerHeightClassName}
              contentPresentation={contentPresentation}
            />
            <div
              className={`tw-flex tw-justify-between tw-gap-x-2 ${
                isProposalCard
                  ? "tw-relative tw-ml-[-3.25rem] tw-mt-1 tw-w-[calc(100%+3.25rem)] tw-flex-row tw-items-center tw-pl-[3.25rem] tw-pt-3"
                  : "tw-mt-3 tw-w-full tw-flex-col tw-space-y-3 @[700px]:tw-flex-row @[700px]:tw-items-center @[700px]:tw-space-y-0"
              }`}
            >
              {isProposalCard && (
                <span
                  aria-hidden="true"
                  className="tw-pointer-events-none tw-absolute tw-left-[-1rem] tw-right-[-1rem] tw-top-0 tw-h-px tw-bg-iron-800/60 md:tw-left-[-1.25rem] md:tw-right-[-1.25rem]"
                />
              )}
              <div
                className={`tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 ${
                  isProposalCard ? "tw-min-w-0 tw-flex-1" : ""
                }`}
              >
                <WaveLeaderboardDropRaters
                  drop={drop}
                  winningThreshold={winningThreshold}
                  winningThresholdMinDurationMs={winningThresholdMinDurationMs}
                  isVotingClosed={isVotingClosed}
                  emphasizeCurrent={isProposalCard}
                />
              </div>
              <div
                className={`tw-flex tw-items-center tw-justify-end tw-gap-1.5 ${
                  isProposalCard
                    ? "tw-ml-auto tw-w-auto tw-flex-shrink-0"
                    : "tw-w-full tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-4 @[700px]:tw-ml-auto @[700px]:tw-w-auto @[700px]:tw-border-t-0 @[700px]:tw-pt-0"
                }`}
                onClick={(e) => e.stopPropagation()}
              >
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
      {!onVoteClick &&
        (isMobileScreen ? (
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
        ))}

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
                <ContentModerationDropActions
                  drop={drop}
                  mobile
                  onReport={() => {
                    handleMobileMenuClose();
                    setIsReportOpen(true);
                  }}
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
      <ReportDropModal
        drop={drop}
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
      />
    </div>
  );
};
