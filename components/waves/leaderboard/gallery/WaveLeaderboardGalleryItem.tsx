"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import { useVotingModalState } from "@/components/voting/useVotingModalState";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";
import WinnerDropBadge from "@/components/waves/drops/winner/WinnerDropBadge";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { ImageScale } from "@/helpers/image.helpers";
import {
  ExtendedDrop,
  getDropPreviewImageUrl,
} from "@/helpers/waves/drop.helpers";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { startDropOpen } from "@/utils/monitoring/dropOpenTiming";
import Link from "next/link";
import { memo, useEffect, useMemo, useRef, useState } from "react";
import { WaveLeaderboardIdentity } from "../identity/WaveLeaderboardIdentity";
import WaveLeaderboardGalleryItemVotes from "./WaveLeaderboardGalleryItemVotes";
import ApprovalStatusBadge from "@/components/waves/approval/ApprovalStatusBadge";
import { isOfficiallyApprovedDrop } from "@/helpers/waves/approve-wave.helpers";
import { AdditionalActionPromiseBadge } from "@/components/waves/drops/AdditionalActionPromiseBadge";

interface WaveLeaderboardGalleryItemProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly artFocused?: boolean | undefined;
  readonly activeSort?: WaveDropsLeaderboardSort | undefined;
  readonly animationKey?: number | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
}

const getVoteStyle = (
  isNegative: boolean,
  isZero: boolean,
  artFocused: boolean
) => {
  if (isZero || (artFocused && isNegative)) {
    return "tw-text-iron-400";
  }

  if (artFocused) {
    return "tw-text-iron-300";
  }

  return isNegative ? "tw-text-rose-500" : "tw-text-emerald-500";
};

interface LeaderboardResultBadgeProps {
  readonly drop: ExtendedDrop;
  readonly isApproveDrop: boolean;
}

function LeaderboardResultBadge({
  drop,
  isApproveDrop,
}: LeaderboardResultBadgeProps) {
  if (isApproveDrop) {
    return isOfficiallyApprovedDrop(drop) ? (
      <ApprovalStatusBadge
        approvedAt={drop.winning_context?.decision_time ?? null}
      />
    ) : null;
  }

  return (
    <WinnerDropBadge
      rank={drop.rank}
      decisionTime={drop.winning_context?.decision_time ?? null}
    />
  );
}

export const WaveLeaderboardGalleryItem = memo<WaveLeaderboardGalleryItemProps>(
  ({
    drop,
    onDropClick,
    artFocused = true,
    activeSort,
    animationKey = 0,
    isVotingClosed = false,
    isVotingControlsLocked = false,
    winningThreshold,
    winningThresholdMinDurationMs,
  }) => {
    const isVotingActionLocked = isVotingClosed || isVotingControlsLocked;
    const {
      isOpen: isVoteModalOpen,
      open: openVoteModal,
      close: closeVoteModal,
    } = useVotingModalState(isVotingActionLocked);
    const [isHighlighting, setIsHighlighting] = useState(false);
    const isMobileScreen = useIsMobileScreen();
    const isTabletOrSmaller = useMediaQuery("(max-width: 1023px)");
    const { hasTouchScreen } = useDeviceInfo();
    const { canShowVote } = useDropInteractionRules(drop);
    const canShowVotingAction = canShowVote && !isVotingActionLocked;
    const primaryMedia = drop.parts[0]?.media[0];
    const isPrimaryMediaVideo = primaryMedia?.mime_type.startsWith("video/");
    const mediaImageScale = isTabletOrSmaller
      ? ImageScale.AUTOx450
      : ImageScale.AUTOx1080;

    const previewImageUrl = useMemo(
      () =>
        isPrimaryMediaVideo ? null : getDropPreviewImageUrl(drop.metadata),
      [drop.metadata, isPrimaryMediaVideo]
    );

    const isFirstRenderRef = useRef(true);
    const previousSortRef = useRef(activeSort);
    const timerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
      if (hasTouchScreen) {
        return;
      }

      const sortChanged = previousSortRef.current !== activeSort;
      const shouldAnimate =
        (isFirstRenderRef.current && animationKey > 0) ||
        (!isFirstRenderRef.current && sortChanged);

      isFirstRenderRef.current = false;
      previousSortRef.current = activeSort;

      if (!shouldAnimate) {
        return;
      }

      setIsHighlighting(true);
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      timerRef.current = setTimeout(() => {
        setIsHighlighting(false);
      }, 700);

      return () => {
        if (timerRef.current) {
          clearTimeout(timerRef.current);
          timerRef.current = null;
        }
      };
    }, [activeSort, animationKey, hasTouchScreen]);

    const hasUserVoted = drop.context_profile_context?.rating !== undefined;

    const userVote = drop.context_profile_context?.rating ?? 0;
    const isNegativeVote = userVote < 0;

    const isZeroVote = userVote === 0;
    const voteStyle = getVoteStyle(isNegativeVote, isZeroVote, artFocused);

    const votingCreditType = drop.wave.voting_credit_type;
    const votingCreditLabel =
      WAVE_VOTING_LABELS[votingCreditType] ?? votingCreditType;
    const isApproveDrop =
      typeof winningThreshold === "number" && winningThreshold > 0;

    const handleImageClick = () => {
      startDropOpen({
        dropId: drop.id,
        waveId: drop.wave.id,
        source: "leaderboard_grid",
        isMobile: isMobileScreen,
      });
      onDropClick(drop);
    };

    const handleVoteButtonClick = () => {
      openVoteModal();
    };

    const transitionClasses = hasTouchScreen
      ? ""
      : "tw-transition-all tw-duration-300 tw-ease-out";
    const groupClasses = artFocused ? `tw-group ${transitionClasses}` : "";
    const containerClass = `${groupClasses} tw-relative tw-w-full tw-min-w-0 tw-bg-iron-950/50 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg desktop-hover:hover:tw-border-iron-700 tw-shadow-lg desktop-hover:hover:tw-shadow-xl`;

    const highlightAnimation =
      isHighlighting && !hasTouchScreen ? "tw-animate-gallery-reveal" : "";

    const baseImageClasses =
      "tw-aspect-square tw-relative tw-cursor-pointer tw-touch-pan-y tw-overflow-hidden tw-bg-iron-900 tw-group/image";

    const imageScaleClasses = hasTouchScreen
      ? ""
      : `tw-transform tw-duration-700 tw-ease-out group-hover/image:tw-scale-105 ${highlightAnimation}`;

    const imageContainerClass = baseImageClasses;

    return (
      <div className={containerClass}>
        <button
          className={`${imageContainerClass} tw-m-0 tw-w-full tw-overflow-hidden tw-rounded-lg tw-border-none tw-bg-transparent tw-p-0 tw-text-left`}
          onClick={handleImageClick}
          type="button"
        >
          <div
            className={`tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center ${imageScaleClasses}`}
          >
            <MediaDisplay
              media_mime_type={primaryMedia?.mime_type ?? "image/jpeg"}
              media_url={primaryMedia?.url ?? ""}
              disableMediaInteraction={true}
              imageScale={mediaImageScale}
              previewImageUrl={previewImageUrl}
            />
          </div>
        </button>
        <div className="tw-rounded-b-lg tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950/50 tw-p-3">
          <div className="tw-mb-3 tw-flex tw-min-w-0 tw-items-start tw-justify-between tw-gap-2">
            <div className="tw-mr-2 tw-min-w-0 tw-flex-1">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-1.5">
                <MediaTypeBadge
                  mimeType={primaryMedia?.mime_type}
                  dropId={drop.id}
                  size="sm"
                />
                {drop.title && (
                  <h3 className="tw-mb-0 tw-min-w-0 tw-truncate tw-text-sm tw-font-bold tw-leading-tight tw-text-iron-200">
                    {drop.title}
                  </h3>
                )}
                {drop.is_additional_action_promised === true && (
                  <AdditionalActionPromiseBadge />
                )}
              </div>
              {drop.author?.handle && (
                <UserProfileTooltipWrapper
                  user={drop.author.handle ?? drop.author.id}
                >
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    href={`/${drop.author?.handle}`}
                    className="tw-mt-0.5 tw-block tw-max-w-full tw-truncate tw-text-xs tw-text-iron-400 tw-no-underline tw-transition-colors tw-duration-150 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-underline"
                  >
                    {drop.author?.handle}
                  </Link>
                </UserProfileTooltipWrapper>
              )}
            </div>
            <LeaderboardResultBadge drop={drop} isApproveDrop={isApproveDrop} />
          </div>
          <WaveLeaderboardIdentity
            drop={drop}
            variant="condensed"
            className="tw-mb-3"
          />
          <div className="tw-mb-3 tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-justify-between tw-gap-y-2 tw-text-xs">
            <div className="tw-min-w-0 tw-flex-1">
              <WaveLeaderboardGalleryItemVotes
                drop={drop}
                variant={artFocused ? "subtle" : "default"}
                winningThreshold={winningThreshold}
                winningThresholdMinDurationMs={winningThresholdMinDurationMs}
                isVotingClosed={isVotingClosed}
              />
            </div>
            <div className="tw-ml-auto tw-flex tw-flex-shrink-0">
              <ParticipationDropVoteDetailsTrigger
                drop={drop}
                density="compact"
              />
            </div>
          </div>
          <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/50 tw-pt-2">
            {hasUserVoted && (
              <span className="tw-min-w-0 tw-break-words tw-font-mono tw-text-[11px] tw-text-iron-500">
                {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:{" "}
                <span className={voteStyle}>
                  {isNegativeVote && "-"}
                  {formatNumberWithCommas(Math.abs(userVote))}{" "}
                  {votingCreditLabel}
                </span>
              </span>
            )}
            {canShowVotingAction && (
              <div className="tw-ml-auto tw-flex tw-min-w-0 tw-flex-1 tw-justify-end">
                <VotingModalButton
                  drop={drop}
                  onClick={handleVoteButtonClick}
                  variant={artFocused ? "subtle" : "default"}
                />
              </div>
            )}
          </div>
        </div>

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
      </div>
    );
  }
);

WaveLeaderboardGalleryItem.displayName = "WaveLeaderboardGalleryItem";
