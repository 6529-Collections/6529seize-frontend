"use client";

import MediaTypeBadge from "@/components/drops/media/MediaTypeBadge";
import DropListItemContentMedia from "@/components/drops/view/item/content/media/DropListItemContentMedia";
import MemeDropTraits from "@/components/memes/drops/MemeDropTraits";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "@/components/user/utils/UserCICAndLevel";
import CommonDropdownItemsMobileWrapper from "@/components/utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import UserProfileTooltipWrapper from "@/components/utils/tooltip/UserProfileTooltipWrapper";
import WaveDropActionsOpen from "@/components/waves/drops/WaveDropActionsOpen";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";
import WaveDropMobileMenuCopyLink from "@/components/waves/drops/WaveDropMobileMenuCopyLink";
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import { DropAuthorBadges } from "@/components/waves/drops/DropAuthorBadges";
import { getRankHoverBorderClass } from "@/components/waves/drops/dropRankStyles";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import { TOOLTIP_STYLES } from "@/helpers/tooltip.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import WaveWinnersDropHeaderAuthorPfp from "./header/WaveWinnersDropHeaderAuthorPfp";
import { WaveWinnerIdentity } from "../identity/WaveWinnerIdentity";
import MainStageMemeCardLink from "@/components/memes/drops/MainStageMemeCardLink";

interface MemesWaveWinnersDropProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const getRankHoverClass = (place: number | null): string => {
  return getRankHoverBorderClass(place);
};

const isClickFromCardDom = (
  event: React.MouseEvent<HTMLDivElement>
): boolean => {
  return event.currentTarget.contains(event.target as Node);
};

const getNonEmptyText = (
  value: string | null | undefined
): string | undefined => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : undefined;
};

const getMetadataValue = (
  winner: ApiWaveDecisionWinner,
  dataKey: string
): string | undefined =>
  getNonEmptyText(
    winner.drop.metadata.find((metadata) => metadata.data_key === dataKey)
      ?.data_value
  );

export const MemesWaveWinnersDrop: React.FC<MemesWaveWinnersDropProps> = ({
  winner,
  wave,
  onDropClick,
}) => {
  // Get device info from useDeviceInfo hook
  const { hasTouchScreen } = useDeviceInfo();
  const suppressNextClickRef = React.useRef(false);

  const handleInteractionStart = React.useCallback(() => {
    suppressNextClickRef.current = true;
  }, []);

  const handleClickCapture = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isClickFromCardDom(event)) {
        return;
      }

      if (!suppressNextClickRef.current) {
        return;
      }

      suppressNextClickRef.current = false;
      event.preventDefault();
      event.stopPropagation();
    },
    []
  );

  const handleMenuClickCapture = React.useCallback(() => {
    suppressNextClickRef.current = false;
  }, []);

  // Use long press interaction hook with touch screen info from device hook
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

  const title =
    getNonEmptyText(winner.drop.title) ??
    getMetadataValue(winner, "title") ??
    "Artwork Title";
  const description =
    getNonEmptyText(winner.drop.parts.at(0)?.content) ??
    getMetadataValue(winner, "description") ??
    "This is an artwork submission for The Memes collection.";

  const artworkMedia = winner.drop.parts.at(0)?.media.at(0);

  const rating = winner.drop.rating || 0;
  const topVoters = winner.drop.top_raters.slice(0, 3);
  const creditType = WAVE_VOTING_LABELS[wave.voting.credit_type];

  // Check if user has voted
  const hasUserVoted =
    winner.drop.context_profile_context?.rating !== undefined &&
    winner.drop.context_profile_context.rating !== 0;
  const userVote = winner.drop.context_profile_context?.rating ?? 0;
  const isUserVoteNegative = userVote < 0;
  const totalVoteClass = rating < 0 ? "tw-text-rose-400" : "tw-text-iron-50";
  const userVoteClass = isUserVoteNegative
    ? "tw-text-rose-400"
    : "tw-text-iron-50";

  // Convert the drop to ExtendedDrop using the helper function
  const extendedDrop = convertApiDropToExtendedDrop(winner.drop);

  const handleClick = React.useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (!isClickFromCardDom(event)) {
        return;
      }

      onDropClick(extendedDrop);
    },
    [extendedDrop, onDropClick]
  );

  return (
    <div
      onClickCapture={handleClickCapture}
      onClick={handleClick}
      className="touch-select-none tw-w-full tw-cursor-pointer tw-rounded-xl tw-transition-all tw-duration-300 tw-ease-out"
    >
      <div
        className={`tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-transition-all tw-duration-200 tw-ease-out ${getRankHoverClass(winner.place)}`}
      >
        <div className="tw-flex tw-flex-col" {...touchHandlers}>
          <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-bg-iron-900/30 tw-p-4 tw-pb-3">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
              <div className="tw-flex tw-gap-x-2">
                <WaveWinnersDropHeaderAuthorPfp winner={winner} size="sm" />
                <div className="tw-flex tw-items-center">
                  <div className="-tw-mt-0.5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-gap-y-1">
                    {winner.drop.author.handle ? (
                      <UserProfileTooltipWrapper
                        user={winner.drop.author.handle}
                      >
                        <Link
                          href={`/${winner.drop.author.handle}`}
                          onClick={(e) => e.stopPropagation()}
                          scroll={false}
                          className="tw-no-underline desktop-hover:hover:tw-underline"
                        >
                          <span className="tw-text-sm tw-font-bold tw-text-white">
                            {winner.drop.author.handle}
                          </span>
                        </Link>
                      </UserProfileTooltipWrapper>
                    ) : (
                      <Link
                        href={`/${winner.drop.author.handle ?? winner.drop.author.primary_address}`}
                        onClick={(e) => e.stopPropagation()}
                        scroll={false}
                        className="tw-no-underline desktop-hover:hover:tw-underline"
                      >
                        <span className="tw-text-sm tw-font-bold tw-text-white">
                          {winner.drop.author.handle ?? winner.drop.author.id}
                        </span>
                      </Link>
                    )}
                    <UserCICAndLevel
                      level={winner.drop.author.level}
                      size={UserCICAndLevelSize.SMALL}
                    />
                    <DropAuthorBadges
                      profile={winner.drop.author}
                      wave={winner.drop.wave}
                      tooltipIdPrefix={`memes-winner-author-badges-${winner.drop.id}`}
                    />

                    <span className="tw-text-sm tw-text-iron-500">•</span>

                    <WaveDropTime timestamp={winner.drop.created_at} />
                  </div>
                </div>
              </div>

              {!hasTouchScreen && (
                <div className="tw-flex tw-flex-shrink-0 tw-items-center">
                  <div className="tw-h-8">
                    <WaveDropActionsOpen drop={extendedDrop} />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Title and Description */}
          <div className="tw-px-4 tw-pb-4 tw-pt-4">
            <div className="tw-space-y-1">
              <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2 tw-gap-y-1">
                <MediaTypeBadge
                  mimeType={artworkMedia?.mime_type}
                  dropId={winner.drop.id}
                  size="sm"
                />
                <h3 className="tw-mb-0 tw-mt-0 tw-text-base tw-font-semibold tw-leading-tight tw-text-iron-100">
                  {title}
                </h3>
                <MainStageMemeCardLink
                  memeCardId={winner.drop.winning_context?.meme_card_id}
                />
              </div>
              <p className="tw-mb-0 tw-line-clamp-2 tw-text-sm tw-text-iron-400">
                {description}
              </p>
            </div>
          </div>

          <WaveWinnerIdentity
            drop={winner.drop}
            variant="full"
            cardVariant="chat"
            className="tw-px-4 tw-pb-4"
          />

          {artworkMedia && (
            <div className="tw-flex tw-h-96 tw-justify-center tw-bg-iron-950">
              <DropListItemContentMedia
                media_mime_type={artworkMedia.mime_type}
                media_url={artworkMedia.url}
                isCompetitionDrop={true}
              />
            </div>
          )}

          {/* Footer Section: Traits + Vote Summary */}
          <div className="tw-mt-4 tw-space-y-4 tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/5 tw-bg-iron-900/30 tw-p-4">
            <MemeDropTraits drop={winner.drop} />

            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2 tw-pt-1">
              <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-leading-5">
                <span className={`tw-font-medium ${totalVoteClass}`}>
                  {formatNumberWithCommas(rating)}
                </span>
                <span className="tw-font-normal tw-text-iron-400">
                  {creditType} {WAVE_VOTE_STATS_LABELS.TOTAL}
                </span>
              </div>

              <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-leading-5">
                {topVoters.length > 0 && (
                  <div className="tw-flex tw-items-center -tw-space-x-2">
                    {topVoters.map((voter) => (
                      <React.Fragment key={voter.profile.handle}>
                        <Link
                          href={`/${voter.profile.handle ?? voter.profile.id}`}
                          onClick={(e) => e.stopPropagation()}
                          scroll={false}
                          className="tw-transition-transform desktop-hover:hover:tw-translate-y-[-2px]"
                          data-tooltip-id={`voter-${voter.profile.handle ?? voter.profile.primary_address}-${voter.rating}`}
                        >
                          {voter.profile.pfp ? (
                            <Image
                              className="tw-h-6 tw-w-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                              src={getScaledImageUri(
                                voter.profile.pfp,
                                ImageScale.W_AUTO_H_50
                              )}
                              alt={`${
                                voter.profile.handle ?? voter.profile.id
                              }'s profile picture`}
                              width={24}
                              height={24}
                            />
                          ) : (
                            <div className="tw-h-6 tw-w-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800" />
                          )}
                        </Link>
                        <Tooltip
                          id={`voter-${voter.profile.handle ?? voter.profile.primary_address}-${voter.rating}`}
                          place="top"
                          offset={8}
                          opacity={1}
                          positionStrategy="fixed"
                          style={TOOLTIP_STYLES}
                        >
                          {voter.profile.handle} -{" "}
                          {formatNumberWithCommas(voter.rating)}
                        </Tooltip>
                      </React.Fragment>
                    ))}
                  </div>
                )}
                <ParticipationDropVoteDetailsTrigger drop={winner.drop} />
              </div>

              {/* User's vote */}
              {hasUserVoted && (
                <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-leading-5">
                  <div className="tw-flex tw-items-baseline tw-gap-x-1">
                    <span className="tw-font-normal tw-text-iron-400">
                      {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:
                    </span>
                    <span className={`tw-font-medium ${userVoteClass}`}>
                      {isUserVoteNegative && "-"}
                      {formatNumberWithCommas(Math.abs(userVote))}{" "}
                      <span className="tw-font-normal tw-text-iron-400">
                        {creditType}
                      </span>
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Touch slide-up menu */}
          {hasTouchScreen &&
            createPortal(
              <CommonDropdownItemsMobileWrapper
                isOpen={isActive}
                setOpen={handleMobileMenuOpenChange}
              >
                <div
                  onClickCapture={handleMenuClickCapture}
                  className="tw-grid tw-grid-cols-1 tw-gap-y-2"
                >
                  {/* Open drop option */}
                  <WaveDropMobileMenuOpen
                    drop={extendedDrop}
                    onOpenChange={handleMobileMenuClose}
                  />
                  <WaveDropMobileMenuCopyLink
                    drop={extendedDrop}
                    onCopy={() => setIsActive(false)}
                  />
                </div>
              </CommonDropdownItemsMobileWrapper>,
              document.body
            )}
        </div>
      </div>
    </div>
  );
};
