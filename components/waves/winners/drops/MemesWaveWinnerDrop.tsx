import React from "react";
import { createPortal } from "react-dom";
import {
  ExtendedDrop,
  convertApiDropToExtendedDrop,
} from "../../../../helpers/waves/drop.helpers";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ApiWaveDecisionWinner } from "../../../../generated/models/ApiWaveDecisionWinner";
import WaveWinnersDropHeaderAuthorPfp from "./header/WaveWinnersDropHeaderAuthorPfp";
import Link from "next/link";
import UserCICAndLevel, {
  UserCICAndLevelSize,
} from "../../../user/utils/UserCICAndLevel";
import { cicToType, formatNumberWithCommas } from "../../../../helpers/Helpers";
import { Tooltip } from "react-tooltip";
import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import MemeDropTraits from "../../../memes/drops/MemeDropTraits";
import DropListItemContentMedia from "../../../drops/view/item/content/media/DropListItemContentMedia";
import useDeviceInfo from "../../../../hooks/useDeviceInfo";
import useLongPressInteraction from "../../../../hooks/useLongPressInteraction";
import WaveDropActionsOpen from "../../../waves/drops/WaveDropActionsOpen";
import CommonDropdownItemsMobileWrapper from "../../../utils/select/dropdown/CommonDropdownItemsMobileWrapper";
import WaveDropMobileMenuOpen from "../../../waves/drops/WaveDropMobileMenuOpen";
import WaveDropTime from "../../../waves/drops/time/WaveDropTime";
import UserProfileTooltipWrapper from "../../../utils/tooltip/UserProfileTooltipWrapper";

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

  // Mobile detection is now handled by the WaveDropTime component

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
  const creditType = wave.voting?.credit_type || "votes";

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
      className="touch-select-none tw-cursor-pointer tw-rounded-xl tw-transition-all tw-duration-300 tw-ease-out tw-w-full"
    >
      <div className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 desktop-hover:hover:tw-border-[#fbbf24]/40 tw-shadow-[0_0_15px_rgba(251,191,36,0.15)] tw-transition-all tw-duration-200 tw-ease-out tw-overflow-hidden tw-bg-iron-950">
        <div className="tw-flex tw-flex-col" {...touchHandlers}>
          <div className="tw-p-4">
            <div className="tw-flex tw-flex-col tw-gap-y-1.5">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-x-3">
                  <Link
                    href={`/${winner.drop.author?.handle}`}
                    onClick={(e) => e.stopPropagation()}
                    className="tw-flex tw-items-center tw-gap-x-2 tw-no-underline group"
                  >
                    <WaveWinnersDropHeaderAuthorPfp winner={winner} />
                  </Link>
                  <div className="tw-flex tw-items-center tw-gap-x-4">
                    <div className="tw-flex tw-items-center tw-gap-x-2">
                      {winner.drop.author?.level && (
                        <UserCICAndLevel
                          level={winner.drop.author.level}
                          cicType={cicToType(winner.drop.author.cic || 0)}
                          size={UserCICAndLevelSize.SMALL}
                        />
                      )}
                      {winner.drop.author?.handle ? (
                        <UserProfileTooltipWrapper user={winner.drop.author.handle ?? winner.drop.author.id}>
                          <Link
                            href={`/${winner.drop.author?.handle}`}
                            onClick={(e) => e.stopPropagation()}
                            className="tw-no-underline desktop-hover:hover:tw-underline desktop-hover:hover:tw-opacity-80 tw-transition-opacity"
                          >
                            <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold tw-text-iron-100">
                              {winner.drop.author?.handle}
                            </span>
                          </Link>
                        </UserProfileTooltipWrapper>
                      ) : (
                        <Link
                          href={`/${winner.drop.author?.handle}`}
                          onClick={(e) => e.stopPropagation()}
                          className="tw-no-underline desktop-hover:hover:tw-underline desktop-hover:hover:tw-opacity-80 tw-transition-opacity"
                        >
                          <span className="tw-text-md tw-mb-0 tw-leading-none tw-font-semibold tw-text-iron-100">
                            {winner.drop.author?.handle}
                          </span>
                        </Link>
                      )}

                      <div className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></div>
                      
                      <WaveDropTime timestamp={winner.drop.created_at} />
                    </div>
                  </div>
                  <div className="tw-flex tw-items-center tw-rounded-md tw-font-medium tw-whitespace-nowrap tw-bg-[rgba(251,191,36,0.1)] tw-px-2 tw-py-1 tw-border tw-border-solid tw-border-[#fbbf24]/20">
                    <FontAwesomeIcon
                      icon={faTrophy}
                      className="tw-flex-shrink-0 tw-size-3 tw-text-[#fbbf24]"
                    />
                  </div>
                </div>

                {/* Show open icon when not a touch device */}
                {!hasTouchScreen && (
                  <div className="tw-flex tw-items-center">
                    <div className="tw-h-8">
                      <WaveDropActionsOpen drop={extendedDrop} />
                    </div>
                  </div>
                )}
              </div>
              <div className="tw-mt-1 sm:tw-mt-0 sm:tw-ml-[3.25rem]">
                <h3 className="tw-text-base sm:tw-text-lg tw-font-semibold tw-text-iron-100 tw-mb-0">
                  {title}
                </h3>
                <div className="tw-text-sm tw-text-iron-400">{description}</div>
              </div>
            </div>
          </div>

          {artworkMedia && (
            <div className="tw-flex tw-justify-center tw-bg-iron-900/40 tw-h-96">
              <DropListItemContentMedia
                media_mime_type={artworkMedia.mime_type}
                media_url={artworkMedia.url}
                isCompetitionDrop={true}
              />
            </div>
          )}

          <MemeDropTraits drop={winner.drop} />

          <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-x-6 tw-gap-y-2 tw-px-4 tw-pt-4 lg:tw-pt-0 tw-pb-4">
            <div className="tw-flex tw-items-center tw-gap-x-1.5">
              <span
                className={`tw-text-sm tw-font-semibold ${
                  isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
                } `}
              >
                {formatNumberWithCommas(rating)}
              </span>
              <span className="tw-text-sm tw-text-iron-400">{creditType}</span>
            </div>

            <div className="tw-flex tw-items-center tw-gap-x-2">
              <div className="tw-flex tw-items-center -tw-space-x-1.5">
                {topVoters.map((voter) => (
                  <>
                    <Link
                      key={voter.profile.handle}
                      href={`/${voter.profile.handle}`}
                      onClick={(e) => e.stopPropagation()}
                      className="tw-transition-transform desktop-hover:hover:tw-translate-y-[-2px]"
                      data-tooltip-id={`voter-${voter.profile.handle}-${voter.rating}`}
                    >
                      {voter.profile.pfp ? (
                        <img
                          className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-black tw-object-contain tw-bg-iron-800"
                          src={voter.profile.pfp}
                          alt="Recent voter"
                        />
                      ) : (
                        <div className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-black tw-object-contain tw-bg-iron-800" />
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
                      {voter.profile.handle} - {formatNumberWithCommas(voter.rating)}
                    </Tooltip>
                  </>
                ))}
              </div>
              <div className="tw-flex tw-items-baseline tw-gap-x-1">
                <span className="tw-text-sm tw-font-medium tw-text-iron-50">
                  {formatNumberWithCommas(ratersCount)}
                </span>
                <span className="tw-text-sm tw-text-iron-400">
                  {ratersCount === 1 ? "voter" : "voters"}
                </span>
              </div>
            </div>

            {/* User's vote */}
            {hasUserVoted && (
              <div className="tw-flex tw-items-center tw-gap-x-1.5">
                <div className="tw-flex tw-items-baseline tw-gap-x-1">
                  <span className="tw-text-sm tw-font-normal tw-text-iron-400">
                    Your vote:
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
                    <span className="tw-text-iron-400 tw-font-normal">
                      {creditType}
                    </span>
                  </span>
                </div>
              </div>
            )}
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
