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
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import useLongPressClickSuppression from "@/hooks/useLongPressClickSuppression";
import useCardTouchNavigationGuard from "@/hooks/useCardTouchNavigationGuard";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import type { WaveDropsLeaderboardSort } from "@/hooks/useWaveDropsLeaderboard";
import { startDropOpen } from "@/utils/monitoring/dropOpenTiming";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowUpRightFromSquare } from "@fortawesome/free-solid-svg-icons";
import Link from "next/link";
import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { WaveLeaderboardGridItemMobileActionsMenu } from "../grid/WaveLeaderboardGridItemMobileActionsMenu";
import { WaveLeaderboardIdentity } from "../identity/WaveLeaderboardIdentity";
import WaveLeaderboardGalleryItemVotes from "./WaveLeaderboardGalleryItemVotes";
import ApprovalStatusBadge from "@/components/waves/approval/ApprovalStatusBadge";
import { isOfficiallyApprovedDrop } from "@/helpers/waves/approve-wave.helpers";
import { AdditionalActionPromiseBadge } from "@/components/waves/drops/AdditionalActionPromiseBadge";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

interface WaveLeaderboardGalleryItemProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly onVoteClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly artFocused?: boolean | undefined;
  readonly activeSort?: WaveDropsLeaderboardSort | undefined;
  readonly animationKey?: number | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly isVotingControlsLocked?: boolean | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
}

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

function LeaderboardMediaPreview({
  drop,
  title,
  opensWholeCard,
  hasTouchScreen,
  isHighlighting,
  onOpen,
}: {
  readonly drop: ExtendedDrop;
  readonly title: string;
  readonly opensWholeCard: boolean;
  readonly hasTouchScreen: boolean;
  readonly isHighlighting: boolean;
  readonly onOpen: () => void;
}) {
  const locale = useBrowserLocale();
  const isTabletOrSmaller = useMediaQuery("(max-width: 1023px)");
  const primaryMedia = drop.parts[0]?.media[0];
  const mediaImageScale = isTabletOrSmaller
    ? ImageScale.AUTOx450
    : ImageScale.AUTOx1080;
  const previewImageUrl = useMemo(
    () => getDropPreviewImageUrl(drop.metadata),
    [drop.metadata]
  );
  const hasStaticMediaPreview =
    primaryMedia?.mime_type.includes("image") === true ||
    Boolean(previewImageUrl);
  const highlightAnimation =
    isHighlighting && !hasTouchScreen ? "tw-animate-gallery-reveal" : "";
  const imageContainerClass =
    "tw-aspect-square tw-relative tw-flex-shrink-0 tw-touch-pan-y tw-overflow-hidden tw-bg-iron-900 tw-group/image";
  const imageScaleClasses =
    hasTouchScreen || !hasStaticMediaPreview
      ? ""
      : `tw-transform tw-duration-700 tw-ease-out group-hover/image:tw-scale-105 ${highlightAnimation}`;
  const mediaContent = (
    <div
      className={`tw-flex tw-h-full tw-w-full tw-items-center tw-justify-center ${imageScaleClasses}`}
    >
      <MediaDisplay
        media_mime_type={primaryMedia?.mime_type ?? "image/jpeg"}
        media_url={primaryMedia?.url ?? ""}
        disableMediaInteraction={true}
        isInertPreview={opensWholeCard}
        fillVideoContainer={true}
        imageScale={mediaImageScale}
        previewImageUrl={previewImageUrl}
      />
    </div>
  );

  if (opensWholeCard) {
    return (
      <div
        inert
        className={`${imageContainerClass} tw-m-0 tw-w-full tw-rounded-lg`}
      >
        {mediaContent}
      </div>
    );
  }

  if (hasStaticMediaPreview) {
    return (
      <button
        type="button"
        onClick={onOpen}
        aria-label={t(locale, "waves.leaderboard.grid.openNamed", { title })}
        className={`${imageContainerClass} tw-m-0 tw-w-full tw-cursor-pointer tw-rounded-lg tw-border-none tw-bg-transparent tw-p-0 tw-text-left`}
      >
        {mediaContent}
      </button>
    );
  }

  return (
    <div className={`${imageContainerClass} tw-m-0 tw-w-full tw-rounded-lg`}>
      {mediaContent}
      <button
        type="button"
        onClick={onOpen}
        aria-label={t(locale, "drop.media.openMedia")}
        title={t(locale, "drop.media.openMedia")}
        className="tw-absolute tw-right-2 tw-top-2 tw-z-20 tw-flex tw-size-8 tw-cursor-pointer tw-items-center tw-justify-center tw-rounded-md tw-border tw-border-solid tw-border-white/[0.08] tw-bg-black/70 tw-p-0 tw-text-iron-300 tw-shadow-md tw-backdrop-blur-sm tw-transition-colors tw-duration-200 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-900 desktop-hover:hover:tw-text-iron-100"
      >
        <FontAwesomeIcon
          icon={faArrowUpRightFromSquare}
          className="tw-size-3.5"
          aria-hidden="true"
        />
      </button>
    </div>
  );
}

export const WaveLeaderboardGalleryItem = memo<WaveLeaderboardGalleryItemProps>(
  ({
    drop,
    onDropClick,
    onVoteClick,
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
    const locale = useBrowserLocale();
    const {
      cardRef,
      handleTouchStart: guardTouchStart,
      handleTouchMove: guardTouchMove,
      handleTouchEnd: guardTouchEnd,
      handleTouchCancel: guardTouchCancel,
      handleClickCapture: guardClickCapture,
    } = useCardTouchNavigationGuard();
    const { hasTouchScreen, isApp } = useDeviceInfo();
    const opensWholeCard = isApp && hasTouchScreen;
    const {
      markNextClickForSuppression,
      releaseSuppressionAfterTouchEnd,
      clearSuppression,
      handleClickCapture,
    } = useLongPressClickSuppression();
    const { isActive, setIsActive, touchHandlers } = useLongPressInteraction({
      hasTouchScreen: opensWholeCard,
      preventDefault: false,
      onInteractionStart: markNextClickForSuppression,
    });
    const handleMenuOpenChange = useCallback(
      (open: boolean) => {
        if (!open) clearSuppression();
        setIsActive(open);
      },
      [clearSuppression, setIsActive]
    );
    const { canShowVote } = useDropInteractionRules(drop);
    const canShowVotingAction = canShowVote && !isVotingActionLocked;
    const primaryMedia = drop.parts[0]?.media[0];

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

    const userVote = drop.context_profile_context?.rating ?? 0;
    const hasUserVoted = userVote !== 0;
    const isNegativeVote = userVote < 0;

    const votingCreditType = drop.wave.voting_credit_type;
    const votingCreditLabel =
      WAVE_VOTING_LABELS[votingCreditType] ?? votingCreditType;
    const votePrefix = isNegativeVote ? "-" : "";
    let voteButtonLabel: string | undefined;
    if (hasUserVoted) {
      voteButtonLabel = `You: ${votePrefix}${formatNumberWithCommas(
        Math.abs(userVote)
      )} ${votingCreditLabel}`;
    }
    const isApproveDrop =
      typeof winningThreshold === "number" && winningThreshold > 0;

    const openDrop = () => {
      startDropOpen({
        dropId: drop.id,
        waveId: drop.wave.id,
        source: "leaderboard_grid",
        isMobile: isMobileScreen,
      });
      onDropClick(drop);
    };

    const handleVoteButtonClick = () => {
      if (onVoteClick) {
        onVoteClick(drop);
        return;
      }
      openVoteModal();
    };

    const transitionClasses = hasTouchScreen
      ? ""
      : "tw-transition-all tw-duration-300 tw-ease-out";
    const groupClasses = artFocused ? `tw-group ${transitionClasses}` : "";
    const containerClass = `${groupClasses} ${opensWholeCard ? "touch-select-none" : ""} tw-relative tw-isolate tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-col tw-bg-iron-950/50 tw-border tw-border-solid tw-border-iron-800 tw-rounded-lg desktop-hover:hover:tw-border-iron-700 tw-shadow-lg desktop-hover:hover:tw-shadow-xl`;
    const title = drop.title?.trim()
      ? drop.title
      : t(locale, "waves.leaderboard.grid.untitled");

    return (
      <div
        ref={cardRef}
        className={containerClass}
        {...touchHandlers}
        onTouchStart={(event) => {
          if (
            !event.currentTarget.contains(event.target as Node) ||
            (event.target instanceof Element &&
              event.target.closest('[role="dialog"]'))
          ) {
            return;
          }
          if (event.touches.length !== 1) {
            touchHandlers.onTouchCancel();
            return;
          }
          touchHandlers.onTouchStart(event);
        }}
        onClickCapture={(event) => {
          if (!guardClickCapture(event)) handleClickCapture(event);
        }}
        onTouchStartCapture={(event) => {
          clearSuppression();
          guardTouchStart(event);
        }}
        onTouchMoveCapture={guardTouchMove}
        onTouchEndCapture={(event) => {
          guardTouchEnd(event);
          releaseSuppressionAfterTouchEnd();
        }}
        onTouchCancelCapture={(event) => {
          guardTouchCancel(event);
          clearSuppression();
        }}
      >
        {opensWholeCard && (
          <button
            type="button"
            onClick={openDrop}
            aria-label={t(locale, "waves.leaderboard.grid.openNamed", {
              title,
            })}
            className="tw-absolute tw-inset-0 tw-z-0 tw-cursor-pointer tw-rounded-lg tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
          />
        )}
        <div
          className={`tw-relative tw-z-10 tw-flex tw-flex-1 tw-flex-col ${opensWholeCard ? "tw-pointer-events-none [&_[data-tooltip-id]]:tw-pointer-events-auto [&_[tabindex]]:tw-pointer-events-auto [&_a]:tw-pointer-events-auto [&_button]:tw-pointer-events-auto" : ""}`}
        >
          <LeaderboardMediaPreview
            drop={drop}
            title={title}
            opensWholeCard={opensWholeCard}
            hasTouchScreen={hasTouchScreen}
            isHighlighting={isHighlighting}
            onOpen={openDrop}
          />
          <div className="tw-flex tw-flex-1 tw-flex-col tw-rounded-b-lg tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800 tw-bg-iron-950/50 tw-p-3">
            <div className="tw-mb-3 tw-min-w-0">
              <div className="tw-flex tw-min-w-0 tw-items-start tw-justify-between tw-gap-2">
                <div className="tw-flex tw-min-w-0 tw-flex-1 tw-flex-wrap tw-items-center tw-gap-1.5">
                  <MediaTypeBadge
                    mimeType={primaryMedia?.mime_type}
                    dropId={drop.id}
                    size="sm"
                    showTooltip={!opensWholeCard}
                  />
                  {drop.is_additional_action_promised === true && (
                    <AdditionalActionPromiseBadge focusable={!opensWholeCard} />
                  )}
                </div>
                <div className="tw-flex-shrink-0">
                  <LeaderboardResultBadge
                    drop={drop}
                    isApproveDrop={isApproveDrop}
                  />
                </div>
              </div>
              {(Boolean(drop.title) || opensWholeCard) && (
                <h3 className="tw-[overflow-wrap:anywhere] tw-mb-0 tw-mt-2 tw-min-w-0 tw-whitespace-normal tw-break-words tw-text-sm tw-font-bold tw-leading-tight tw-text-iron-200">
                  {opensWholeCard ? title : drop.title}
                </h3>
              )}
              {drop.author.handle && opensWholeCard && (
                <span className="tw-mt-1 tw-block tw-max-w-full tw-truncate tw-text-xs tw-text-iron-400">
                  {drop.author.handle}
                </span>
              )}
              {drop.author.handle && !opensWholeCard && (
                <UserProfileTooltipWrapper user={drop.author.handle}>
                  <Link
                    onClick={(e) => e.stopPropagation()}
                    href={`/${drop.author.handle}`}
                    aria-label={t(
                      locale,
                      "waves.leaderboard.grid.authorProfile",
                      { author: drop.author.handle }
                    )}
                    className="tw-mt-1 tw-block tw-max-w-full tw-truncate tw-text-xs tw-text-iron-400 tw-no-underline tw-transition-colors tw-duration-150 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-300 desktop-hover:hover:tw-underline"
                  >
                    {drop.author.handle}
                  </Link>
                </UserProfileTooltipWrapper>
              )}
            </div>
            <WaveLeaderboardIdentity
              drop={drop}
              variant="condensed"
              disableNavigation={opensWholeCard}
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
            </div>
            <div className="tw-mt-auto tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-3 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-iron-800/50 tw-pt-2">
              <div className="tw-flex tw-flex-shrink-0">
                <ParticipationDropVoteDetailsTrigger
                  drop={drop}
                  density="gallery"
                />
              </div>
              {canShowVotingAction && (
                <div className="tw-ml-auto tw-flex tw-min-w-0 tw-flex-1 tw-justify-end">
                  <VotingModalButton
                    drop={drop}
                    onClick={handleVoteButtonClick}
                    className="tw-box-border tw-min-w-0 tw-max-w-full"
                  >
                    {voteButtonLabel}
                  </VotingModalButton>
                </div>
              )}
            </div>
          </div>
        </div>

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
        {opensWholeCard && (
          <WaveLeaderboardGridItemMobileActionsMenu
            drop={drop}
            isOpen={isActive}
            setIsActive={handleMenuOpenChange}
            canOpenDrop
            canShowVotingAction={canShowVotingAction}
            onVoteClick={handleVoteButtonClick}
          />
        )}
      </div>
    );
  }
);

WaveLeaderboardGalleryItem.displayName = "WaveLeaderboardGalleryItem";
