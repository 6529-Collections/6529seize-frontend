"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import ContentModerationDropActions from "@/components/content-moderation/ContentModerationDropActions";
import ReportDropModal from "@/components/content-moderation/ReportDropModal";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import MediaDisplay from "@/components/drops/view/item/content/media/MediaDisplay";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import { MobileVotingModal, VotingModal } from "@/components/voting";
import VotingModalButton from "@/components/voting/VotingModalButton";
import { DropLocation } from "@/components/waves/drops/Drop";
import { AdditionalActionPromiseBadge } from "@/components/waves/drops/AdditionalActionPromiseBadge";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import WaveDropActionsOptions from "@/components/waves/drops/WaveDropActionsOptions";
import WaveDropMobileMenuDelete from "@/components/waves/drops/WaveDropMobileMenuDelete";
import WaveDropMobileMenuCopyLink from "@/components/waves/drops/WaveDropMobileMenuCopyLink";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import MemesArtSubmissionModal from "@/components/waves/memes/MemesArtSubmissionModal";
import { MemesArtResubmitAction } from "@/components/waves/memes/submission/MemesArtResubmitAction";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";
import type { ApiWave } from "@/generated/models/ApiWave";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { getDropPreviewImageUrl } from "@/helpers/waves/drop.helpers";
import { useDropInteractionRules } from "@/hooks/drops/useDropInteractionRules";
import useIsMobileScreen from "@/hooks/isMobileScreen";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import useLongPressClickSuppression from "@/hooks/useLongPressClickSuppression";
import useCardTouchNavigationGuard from "@/hooks/useCardTouchNavigationGuard";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import { useMediaQuery } from "@/hooks/useMediaQuery";
import { startDropOpen } from "@/utils/monitoring/dropOpenTiming";
import Image from "next/image";
import Link from "next/link";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import MemeDropTraits from "./MemeDropTraits";
import MemesLeaderboardDropArtistInfo from "./MemesLeaderboardDropArtistInfo";
import MemesLeaderboardDropCard from "./MemesLeaderboardDropCard";
import MemesLeaderboardDropDescription from "./MemesLeaderboardDropDescription";
import MemesLeaderboardDropHeader from "./MemesLeaderboardDropHeader";
import MemesLeaderboardDropVoteSummary from "./MemesLeaderboardDropVoteSummary";

interface MemesLeaderboardDropProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
  readonly onVoteClick?: ((drop: ExtendedDrop) => void) | undefined;
  readonly wave?: ApiWave | undefined;
  readonly location?: DropLocation | undefined;
  readonly onSourceDropDeleted?: (() => void) | undefined;
}

const getNonEmptyText = (value: string | null | undefined): string | null => {
  const text = value?.trim();
  return text && text.length > 0 ? text : null;
};

const getMetadataValue = (drop: ExtendedDrop, dataKey: string): string | null =>
  getNonEmptyText(
    drop.metadata.find((metadata) => metadata.data_key === dataKey)?.data_value
  );

export const MemesLeaderboardDrop: React.FC<MemesLeaderboardDropProps> = ({
  drop,
  onDropClick,
  onVoteClick,
  wave,
  location = DropLocation.WAVE,
  onSourceDropDeleted,
}) => {
  const isMobileScreen = useIsMobileScreen();
  const isTabletOrSmaller = useMediaQuery("(max-width: 1023px)");
  const { canDelete } = useDropInteractionRules(drop);
  const [isVotingModalOpen, setIsVotingModalOpen] = useState<boolean>(false);
  const [isResubmitModalOpen, setIsResubmitModalOpen] =
    useState<boolean>(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const openResubmitAfterMenuCloseRef = useRef<boolean>(false);
  const locale = useBrowserLocale();
  const {
    cardRef,
    handleTouchStart: guardTouchStart,
    handleTouchMove: guardTouchMove,
    handleTouchEnd: guardTouchEnd,
    handleTouchCancel: guardTouchCancel,
    handleClickCapture: guardClickCapture,
  } = useCardTouchNavigationGuard();
  const {
    markNextClickForSuppression,
    releaseSuppressionAfterTouchEnd,
    clearSuppression,
    handleClickCapture,
  } = useLongPressClickSuppression();

  // Get device info from useDeviceInfo hook
  const { hasTouchScreen, isApp } = useDeviceInfo();
  const opensWholeCard = isApp && hasTouchScreen;
  const canOpenCard = opensWholeCard || !hasTouchScreen;
  let mediaImageScale = ImageScale.AUTOx800;
  if (isMobileScreen) {
    mediaImageScale = ImageScale.AUTOx450;
  } else if (isTabletOrSmaller) {
    mediaImageScale = ImageScale.AUTOx600;
  }

  const clearDeferredResubmitOpen = useCallback(() => {
    openResubmitAfterMenuCloseRef.current = false;
  }, []);

  const handleInteractionStart = useCallback(() => {
    clearDeferredResubmitOpen();
    markNextClickForSuppression();
  }, [clearDeferredResubmitOpen, markNextClickForSuppression]);

  useEffect(
    () => () => {
      clearDeferredResubmitOpen();
    },
    [clearDeferredResubmitOpen]
  );

  // Use long press interaction hook with touch screen info from device hook
  const { isActive, setIsActive, touchHandlers } = useLongPressInteraction({
    hasTouchScreen,
    onInteractionStart: handleInteractionStart,
    preventDefault: false,
  });

  const handleMobileMenuOpenChange = useCallback(
    (nextIsActive: boolean) => {
      if (!nextIsActive) {
        clearSuppression();
      }

      setIsActive(nextIsActive);
    },
    [clearSuppression, setIsActive]
  );

  const handleMobileMenuClose = useCallback(() => {
    handleMobileMenuOpenChange(false);
  }, [handleMobileMenuOpenChange]);

  const openResubmitAfterMobileMenuCloses = useCallback(() => {
    openResubmitAfterMenuCloseRef.current = true;
    handleMobileMenuClose();
  }, [handleMobileMenuClose]);

  const handleMobileMenuAfterLeave = useCallback(() => {
    if (!openResubmitAfterMenuCloseRef.current) {
      return;
    }

    clearDeferredResubmitOpen();
    setIsResubmitModalOpen(true);
  }, [clearDeferredResubmitOpen]);

  const firstPart = drop.parts.at(0);
  const title =
    getNonEmptyText(drop.title) ??
    getMetadataValue(drop, "title") ??
    "Artwork Title";
  const description =
    getNonEmptyText(firstPart?.content) ??
    getMetadataValue(drop, "description") ??
    "This is an artwork submission for The Memes collection.";

  // Get artwork media URL if available
  const artworkMedia = firstPart?.media.at(0);

  // Get top voters for votes display
  const firstThreeVoters = drop.top_raters.slice(0, 3);

  const openDrop = useCallback(() => {
    startDropOpen({
      dropId: drop.id,
      waveId: drop.wave.id,
      source: "leaderboard_memes",
      isMobile: isMobileScreen,
    });
    onDropClick(drop);
  }, [drop, isMobileScreen, onDropClick]);

  return (
    <div
      ref={cardRef}
      className="tw-w-full tw-cursor-pointer tw-rounded-xl tw-@container has-[[data-leaderboard-card-open]:focus-visible]:tw-outline has-[[data-leaderboard-card-open]:focus-visible]:tw-outline-2 has-[[data-leaderboard-card-open]:focus-visible]:tw-outline-offset-2 has-[[data-leaderboard-card-open]:focus-visible]:tw-outline-white"
      onClick={(event) => {
        if (
          !hasTouchScreen &&
          event.currentTarget.contains(event.target as Node)
        ) {
          openDrop();
        }
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
      <div className="tw-group tw-w-full">
        <div {...touchHandlers}>
          <MemesLeaderboardDropCard>
            <div className="tw-relative tw-isolate">
              {canOpenCard && (
                <button
                  type="button"
                  data-leaderboard-card-open
                  onClick={(event) => {
                    event.stopPropagation();
                    openDrop();
                  }}
                  aria-label={t(locale, "waves.leaderboard.grid.openNamed", {
                    title,
                  })}
                  className="tw-absolute tw-inset-0 tw-z-0 tw-cursor-pointer tw-rounded-xl tw-border-0 tw-bg-transparent tw-p-0 focus-visible:tw-outline-none"
                />
              )}
              <div
                className={`tw-relative tw-z-10 ${opensWholeCard ? "tw-pointer-events-none [&_[data-tooltip-id]]:tw-pointer-events-auto [&_[tabindex]]:tw-pointer-events-auto [&_a]:tw-pointer-events-auto [&_button]:tw-pointer-events-auto" : ""}`}
              >
                {/* Artist info section */}
                <div className="tw-p-4 tw-pb-3">
                  <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
                    <MemesLeaderboardDropArtistInfo
                      drop={drop}
                      isNativeTouch={opensWholeCard}
                    />
                    <div className="tw-flex tw-h-10 tw-items-center tw-gap-2 tw-text-iron-400 [&>button]:tw-flex [&>button]:tw-h-8 [&>button]:tw-items-center [&>button]:tw-justify-center [&>button]:tw-py-0">
                      {!hasTouchScreen && (
                        <>
                          <WaveDropActionsOpen drop={drop} />
                          <MemesArtResubmitAction
                            drop={drop}
                            wave={wave}
                            onSourceDropDeleted={onSourceDropDeleted}
                          />
                          {canDelete && <WaveDropActionsOptions drop={drop} />}
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Title and Description */}
                <div className="tw-px-4 tw-pb-4 tw-pt-4">
                  <div className="tw-max-w-screen-sm tw-space-y-1">
                    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-2">
                      <MediaTypeBadge
                        mimeType={artworkMedia?.mime_type}
                        dropId={drop.id}
                        size="xs"
                        showTooltip={!opensWholeCard}
                      />
                      <MemesLeaderboardDropHeader title={title} />
                      {drop.is_additional_action_promised === true && (
                        <AdditionalActionPromiseBadge
                          focusable={!opensWholeCard}
                        />
                      )}
                    </div>
                    <MemesLeaderboardDropDescription
                      description={description}
                    />
                  </div>
                </div>

                {artworkMedia && (
                  <div
                    inert={opensWholeCard}
                    className={`${opensWholeCard ? "tw-pointer-events-none" : "tw-pointer-events-auto"} tw-flex tw-h-96 tw-justify-center tw-overflow-hidden ${
                      location === DropLocation.WAVE
                        ? "tw-bg-iron-900/30"
                        : "tw-bg-iron-900/40"
                    }`}
                  >
                    {opensWholeCard ? (
                      <MediaDisplay
                        media_mime_type={artworkMedia.mime_type}
                        media_url={artworkMedia.url}
                        disableMediaInteraction
                        isInertPreview
                        fillVideoContainer
                        imageScale={mediaImageScale}
                        previewImageUrl={getDropPreviewImageUrl(drop.metadata)}
                      />
                    ) : (
                      <DropListItemContentMedia
                        media_mime_type={artworkMedia.mime_type}
                        media_url={artworkMedia.url}
                        isCompetitionDrop={true}
                        fillVideoContainer={true}
                        imageScale={mediaImageScale}
                      />
                    )}
                  </div>
                )}

                {/* Footer Section: Traits + Vote Summary + Vote Button */}
                <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-y-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-bg-iron-900/30 tw-p-4">
                  <MemeDropTraits drop={drop} />

                  <div className="tw-flex tw-flex-col tw-justify-between tw-gap-4 @[700px]:tw-flex-row @[700px]:tw-items-center">
                    <MemesLeaderboardDropVoteSummary drop={drop} />

                    <div
                      className="tw-flex tw-w-full tw-flex-shrink-0 tw-items-center tw-justify-between tw-gap-4 @[700px]:tw-w-auto @[700px]:tw-justify-end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {/* Voters - only on small containers */}
                      <div className="tw-flex tw-items-center tw-gap-2 @[700px]:tw-hidden">
                        {firstThreeVoters.length > 0 && (
                          <div className="tw-flex tw-items-center -tw-space-x-2">
                            {firstThreeVoters.map((voter) => (
                              <Link
                                key={
                                  voter.profile.handle ??
                                  voter.profile.primary_address
                                }
                                href={`/${voter.profile.handle ?? voter.profile.primary_address}`}
                                onClick={(e) => e.stopPropagation()}
                              >
                                {voter.profile.pfp ? (
                                  <Image
                                    className="tw-h-6 tw-w-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                                    src={getScaledImageUri(
                                      voter.profile.pfp,
                                      ImageScale.W_AUTO_H_50
                                    )}
                                    alt="Recent voter"
                                    width={24}
                                    height={24}
                                  />
                                ) : (
                                  <div className="tw-h-6 tw-w-6 tw-rounded-lg tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800" />
                                )}
                              </Link>
                            ))}
                          </div>
                        )}
                        <ParticipationDropVoteDetailsTrigger
                          drop={drop}
                          visualVariant="memes"
                        />
                      </div>
                      <VotingModalButton
                        drop={drop}
                        className="!tw-text-meta"
                        onClick={() => {
                          if (onVoteClick) {
                            onVoteClick(drop);
                            return;
                          }
                          setIsVotingModalOpen(true);
                        }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {!onVoteClick &&
              (isMobileScreen ? (
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
              ))}
          </MemesLeaderboardDropCard>
        </div>

        {/* Touch slide-up menu for leaderboard */}
        {hasTouchScreen &&
          createPortal(
            <CommonDropdownItemsMobileWrapper
              isOpen={isActive}
              setOpen={handleMobileMenuOpenChange}
              onAfterLeave={handleMobileMenuAfterLeave}
            >
              <div
                className="tw-grid tw-grid-cols-1 tw-gap-y-2"
                onClickCapture={clearSuppression}
              >
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

                <MemesArtResubmitAction
                  drop={drop}
                  wave={wave}
                  variant="menu"
                  onOpenModal={openResubmitAfterMobileMenuCloses}
                  onSourceDropDeleted={onSourceDropDeleted}
                />

                {/* Delete option - only if user can delete */}
                {canDelete && (
                  <WaveDropMobileMenuDelete
                    drop={drop}
                    onDropDeleted={handleMobileMenuClose}
                  />
                )}
              </div>
            </CommonDropdownItemsMobileWrapper>,
            document.body
          )}
        {wave && isResubmitModalOpen && (
          <MemesArtSubmissionModal
            isOpen={isResubmitModalOpen}
            wave={wave}
            sourceDrop={drop}
            onClose={() => setIsResubmitModalOpen(false)}
            onSourceDropDeleted={onSourceDropDeleted}
          />
        )}
        <ReportDropModal
          drop={drop}
          isOpen={isReportOpen}
          onClose={() => setIsReportOpen(false)}
        />
      </div>
    </div>
  );
};
