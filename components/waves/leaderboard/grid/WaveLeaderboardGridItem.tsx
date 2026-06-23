"use client";

import { useVotingModalState } from "@/components/voting/useVotingModalState";
import { WaveLeaderboardIdentity } from "@/components/waves/leaderboard/identity/WaveLeaderboardIdentity";
import { ApiDropType } from "@/generated/models/ApiDropType";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import { startDropOpen } from "@/utils/monitoring/dropOpenTiming";
import React, { useCallback } from "react";
import type { WaveLeaderboardGridMode } from "./WaveLeaderboardGrid";
import { WaveLeaderboardGridItemCompactFooter } from "./WaveLeaderboardGridItemCompactFooter";
import { WaveLeaderboardGridItemMobileActionsMenu } from "./WaveLeaderboardGridItemMobileActionsMenu";
import { WaveLeaderboardGridItemViewport } from "./WaveLeaderboardGridItemViewport";
import { WaveLeaderboardGridItemVotingModal } from "./WaveLeaderboardGridItemVotingModal";

interface WaveLeaderboardGridItemProps {
  readonly drop: ExtendedDrop;
  readonly mode: WaveLeaderboardGridMode;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const canOpenGridItemFromClick = ({
  isMenuOpen,
  target,
}: {
  readonly isMenuOpen: boolean;
  readonly target: HTMLElement;
}): boolean => {
  if (isMenuOpen) {
    return false;
  }

  return !target.closest("a, button");
};

const isGridItemOpenKey = (key: string): boolean =>
  key === "Enter" || key === " ";

export const WaveLeaderboardGridItem: React.FC<
  WaveLeaderboardGridItemProps
> = ({
  drop,
  mode,
  isVotingClosed = false,
  isVotingControlsLocked = false,
  winningThreshold,
  winningThresholdMinDurationMs,
  onDropClick,
}) => {
  const isCompactMode = mode === "compact";
  const isContentOnlyMode = mode === "content_only";
  const isCuratable = drop.context_profile_context?.curatable ?? false;
  const isCurated = drop.context_profile_context?.curated ?? false;
  const canOpenDrop = drop.drop_type !== ApiDropType.Chat;
  const isMobileScreen = useIsMobileScreen();
  const { hasTouchScreen } = useDeviceInfo();
  const { isActive, setIsActive, touchHandlers } = useLongPressInteraction({
    hasTouchScreen,
    preventDefault: false,
  });
  const isVotingActionLocked = isVotingClosed || isVotingControlsLocked;
  const {
    isOpen: isVoteModalOpen,
    open: openVoteModal,
    close: closeVoteModal,
  } = useVotingModalState(isVotingActionLocked);
  const { canShowVote } = useDropInteractionRules(drop);
  const canShowVotingAction = canShowVote && !isVotingActionLocked;
  const canCopyLink = !drop.id.startsWith("temp-");
  const hasDesktopContentOnlyActions =
    canOpenDrop || isCuratable || canShowVotingAction;
  const hasMobileContentOnlyActions =
    hasDesktopContentOnlyActions || canCopyLink;
  const showDesktopContentOnlyActions =
    isContentOnlyMode && !hasTouchScreen && hasDesktopContentOnlyActions;
  const showMobileContentOnlyActions =
    isContentOnlyMode && hasTouchScreen && hasMobileContentOnlyActions;

  const handleVoteButtonClick = useCallback(() => {
    openVoteModal();
  }, [openVoteModal]);

  const openDrop = useCallback(() => {
    startDropOpen({
      dropId: drop.id,
      waveId: drop.wave.id,
      source: "leaderboard_grid",
      isMobile: isMobileScreen,
    });
    onDropClick(drop);
  }, [drop, isMobileScreen, onDropClick]);

  const onCardClick: React.MouseEventHandler<HTMLDivElement> = (event) => {
    const target = event.target as HTMLElement;
    if (
      !canOpenGridItemFromClick({
        isMenuOpen: showMobileContentOnlyActions && isActive,
        target,
      })
    ) {
      return;
    }
    openDrop();
  };

  const onCardKeyDown: React.KeyboardEventHandler<HTMLDivElement> = (event) => {
    if (!isGridItemOpenKey(event.key)) {
      return;
    }

    const target = event.target as HTMLElement;
    if (
      !canOpenGridItemFromClick({
        isMenuOpen: showMobileContentOnlyActions && isActive,
        target,
      })
    ) {
      return;
    }

    event.preventDefault();
    openDrop();
  };

  return (
    <div
      role="button"
      tabIndex={0}
      data-testid={`wave-leaderboard-grid-item-${drop.id}`}
      onClick={onCardClick}
      onKeyDown={onCardKeyDown}
      className="tw-group tw-cursor-pointer tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-p-0 tw-transition desktop-hover:hover:tw-border-iron-700"
      {...(showMobileContentOnlyActions ? touchHandlers : {})}
    >
      <WaveLeaderboardGridItemViewport
        drop={drop}
        isCompactMode={isCompactMode}
        isContentOnlyMode={isContentOnlyMode}
        showDesktopContentOnlyActions={showDesktopContentOnlyActions}
        canOpenDrop={canOpenDrop}
        isCuratable={isCuratable}
        isCurated={isCurated}
        canShowVotingAction={canShowVotingAction}
        onOpenDrop={openDrop}
        onVoteButtonClick={handleVoteButtonClick}
      />

      {isContentOnlyMode && (
        <WaveLeaderboardIdentity
          drop={drop}
          variant="responsive"
          cardVariant="chat"
          className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/50 tw-bg-iron-950/50 tw-p-3"
          supplementFullWidth
        />
      )}

      {isCompactMode && (
        <WaveLeaderboardGridItemCompactFooter
          drop={drop}
          winningThreshold={winningThreshold}
          winningThresholdMinDurationMs={winningThresholdMinDurationMs}
          isVotingClosed={isVotingClosed}
          canShowVotingAction={canShowVotingAction}
          onVoteButtonClick={handleVoteButtonClick}
        />
      )}

      {(isCompactMode || isContentOnlyMode) && (
        <WaveLeaderboardGridItemVotingModal
          drop={drop}
          isOpen={isVoteModalOpen}
          isMobileScreen={isMobileScreen}
          onClose={closeVoteModal}
        />
      )}

      {showMobileContentOnlyActions && (
        <WaveLeaderboardGridItemMobileActionsMenu
          drop={drop}
          isOpen={isActive}
          setIsActive={setIsActive}
          canOpenDrop={canOpenDrop}
          isCuratable={isCuratable}
          isCurated={isCurated}
          canShowVotingAction={canShowVotingAction}
          onVoteClick={handleVoteButtonClick}
        />
      )}
    </div>
  );
};
