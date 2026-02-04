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
import WaveDropMobileMenuOpen from "@/components/waves/drops/WaveDropMobileMenuOpen";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import type { ApiWave } from "@/generated/models/ApiWave";
import type { ApiWaveCreditType } from "@/generated/models/ApiWaveCreditType";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { convertApiDropToExtendedDrop } from "@/helpers/waves/drop.helpers";
import {
  WAVE_VOTE_STATS_LABELS,
  WAVE_VOTING_LABELS,
} from "@/helpers/waves/waves.constants";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import useLongPressInteraction from "@/hooks/useLongPressInteraction";
import Link from "next/link";
import React from "react";
import { createPortal } from "react-dom";
import { Tooltip } from "react-tooltip";
import WaveWinnersDropHeaderAuthorPfp from "./header/WaveWinnersDropHeaderAuthorPfp";

interface MemesWaveWinnersDropProps {
  readonly winner: ApiWaveDecisionWinner;
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

export const MemesWaveWinnersDrop: React.FC<MemesWaveWinnersDropProps> = ({
  winner,
  wave,
  onDropClick,
}) => {
  // Get device info from useDeviceInfo hook
  const { hasTouchScreen } = useDeviceInfo();

  // Use long press interaction hook with touch screen info from device hook
  const { isActive, setIsActive, touchHandlers } = useLongPressInteraction({
    hasTouchScreen,
  });

  const title =
    winner.drop.metadata?.find((m) => m.data_key === "title")?.data_value ||
    "Artwork Title";
  const description =
    winner.drop.metadata?.find((m) => m.data_key === "description")
      ?.data_value || "This is an artwork submission for The Memes collection.";

  const artworkMedia = winner.drop.parts.at(0)?.media.at(0);

  const rating = winner.drop.rating || 0;
  const isPositive = rating >= 0;
  const ratersCount = winner.drop.raters_count || 0;
  const topVoters = winner.drop.top_raters?.slice(0, 3) || [];
  const creditType =
    WAVE_VOTING_LABELS[wave.voting?.credit_type as ApiWaveCreditType] ||
    wave.voting?.credit_type ||
    "votes";

  // Check if user has voted
  const hasUserVoted =
    winner.drop.context_profile_context?.rating !== undefined &&
    winner.drop.context_profile_context?.rating !== 0;
  const userVote = winner.drop.context_profile_context?.rating ?? 0;
  const isUserVoteNegative = userVote < 0;

  // Convert the drop to ExtendedDrop using the helper function
  const extendedDrop = convertApiDropToExtendedDrop(winner.drop);

  return (
    <div
      onClick={() => onDropClick(extendedDrop)}
      className="touch-select-none tw-w-full tw-cursor-pointer tw-rounded-xl tw-transition-all tw-duration-300 tw-ease-out"
    >
      <div className="tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-shadow-[0_0_15px_rgba(251,191,36,0.08)] tw-transition-all tw-duration-200 tw-ease-out desktop-hover:hover:tw-border-[#fbbf24]/20">
        <div className="tw-flex tw-flex-col" {...touchHandlers}>
          <div className="tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/5 tw-bg-iron-900/30 tw-p-4 tw-pb-3">
            <div className="tw-flex tw-items-center tw-justify-between tw-gap-4">
              <div className="tw-flex tw-gap-x-2">
                <WaveWinnersDropHeaderAuthorPfp winner={winner} size="sm" />
                <div className="tw-flex tw-items-center">
                  <div className="-tw-mt-0.5 tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
                    {winner.drop.author?.handle ? (
                      <UserProfileTooltipWrapper
                        user={
                          winner.drop.author.handle ?? winner.drop.author.id
                        }
                      >
                        <Link
                          href={`/${winner.drop.author?.handle ?? winner.drop.author?.id}`}
                          onClick={(e) => e.stopPropagation()}
                          scroll={false}
                          className="tw-no-underline desktop-hover:hover:tw-underline"
                        >
                          <span className="tw-text-sm tw-font-bold tw-text-white">
                            {winner.drop.author?.handle}
                          </span>
                        </Link>
                      </UserProfileTooltipWrapper>
                    ) : (
                      <Link
                        href={`/${winner.drop.author?.handle ?? winner.drop.author?.id}`}
                        onClick={(e) => e.stopPropagation()}
                        scroll={false}
                        className="tw-no-underline desktop-hover:hover:tw-underline"
                      >
                        <span className="tw-text-sm tw-font-bold tw-text-white">
                          {winner.drop.author?.handle ?? winner.drop.author?.id}
                        </span>
                      </Link>
                    )}
                    {winner.drop.author?.level && (
                      <UserCICAndLevel
                        level={winner.drop.author.level}
                        size={UserCICAndLevelSize.SMALL}
                      />
                    )}

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
              <div className="tw-flex tw-items-center tw-gap-x-2">
                <MediaTypeBadge
                  mimeType={artworkMedia?.mime_type}
                  dropId={winner.drop.id}
                  size="sm"
                />
                <h3 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-100">
                  {title}
                </h3>
              </div>
              <p className="tw-mb-0 tw-line-clamp-2 tw-text-sm tw-text-iron-400">
                {description}
              </p>
            </div>
          </div>

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

            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-4 tw-gap-y-2">
              <div className="tw-flex tw-items-center tw-gap-x-1.5">
                <span
                  className={`tw-text-sm tw-font-bold ${
                    isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
                  }`}
                >
                  {formatNumberWithCommas(rating)}
                </span>
                <span className="tw-text-sm tw-text-iron-500">
                  {creditType} {WAVE_VOTE_STATS_LABELS.TOTAL}
                </span>
              </div>

              <div className="tw-flex tw-items-center tw-gap-2">
                <div className="tw-flex tw-items-center -tw-space-x-2">
                  {topVoters.map((voter) => (
                    <React.Fragment key={voter.profile.handle}>
                      <Link
                        href={`/${voter.profile.handle ?? voter.profile.id}`}
                        onClick={(e) => e.stopPropagation()}
                        scroll={false}
                        className="tw-transition-transform desktop-hover:hover:tw-translate-y-[-2px]"
                        data-tooltip-id={`voter-${voter.profile.handle}-${voter.rating}`}
                      >
                        {voter.profile.pfp ? (
                          <img
                            className="tw-h-6 tw-w-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                            src={voter.profile.pfp}
                            alt="Recent voter"
                          />
                        ) : (
                          <div className="tw-h-6 tw-w-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800" />
                        )}
                      </Link>
                      <Tooltip
                        id={`voter-${voter.profile.handle}-${voter.rating}`}
                        style={{
                          backgroundColor: "#1F2937",
                          color: "white",
                          padding: "4px 8px",
                        }}
                      >
                        {voter.profile.handle} -{" "}
                        {formatNumberWithCommas(voter.rating)}
                      </Tooltip>
                    </React.Fragment>
                  ))}
                </div>
                <span className="tw-text-sm tw-font-semibold tw-text-iron-200">
                  {formatNumberWithCommas(ratersCount)}{" "}
                  <span className="tw-font-normal tw-text-iron-500">
                    {ratersCount === 1 ? "voter" : "voters"}
                  </span>
                </span>
              </div>

              {/* User's vote */}
              {hasUserVoted && (
                <div className="tw-flex tw-items-center tw-gap-x-1.5">
                  <div className="tw-flex tw-items-baseline tw-gap-x-1">
                    <span className="tw-text-sm tw-font-normal tw-text-iron-400">
                      {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:
                    </span>
                    <span
                      className={`tw-text-sm tw-font-semibold ${
                        isUserVoteNegative
                          ? "tw-text-rose-500"
                          : "tw-text-emerald-500"
                      }`}
                    >
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
                setOpen={setIsActive}
              >
                <div className="tw-grid tw-grid-cols-1 tw-gap-y-2">
                  {/* Open drop option */}
                  <WaveDropMobileMenuOpen
                    drop={extendedDrop}
                    onOpenChange={() => setIsActive(false)}
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
