import React, { useContext, useState, memo, useCallback } from "react";
import { ApiWave } from "../../../../generated/models/ApiWave";
import { ExtendedDrop } from "../../../../helpers/waves/drop.helpers";
import {
  useWaveDropsLeaderboard,
  WaveDropsLeaderboardSortBy,
  WaveDropsLeaderboardSortDirection,
} from "../../../../hooks/useWaveDropsLeaderboard";
import { AuthContext } from "../../../auth/Auth";
import Link from "next/link";
import {
  formatNumberWithCommas,
  getTimeAgoShort,
} from "../../../../helpers/Helpers";
import {
  ImageScale,
  getScaledImageUri,
} from "../../../../helpers/image.helpers";
import WaveDetailedDropContent from "../drops/WaveDetailedDropContent";
import { WaveWinnersSmallOutcome } from "./WaveWinnersSmallOutcome";

interface WaveWinnersSmallProps {
  readonly wave: ApiWave;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

interface DropContentProps {
  readonly drop: ExtendedDrop;
  readonly onDropClick: (drop: ExtendedDrop) => void;
}

const rankColors = {
  1: {
    text: "tw-text-[#E8D48A]",
    bg: "tw-bg-[#E8D48A]/20",
    ring: "tw-ring-[#E8D48A]/40",
    shadow: "tw-shadow-[0_4px_12px_rgba(232,212,138,0.2)]",
    hover:
      "desktop-hover:hover:tw-from-[#E8D48A]/40 desktop-hover:hover:tw-ring-[#E8D48A]/50",
    dropShadow: "tw-drop-shadow-[0_2px_3px_rgba(232,212,138,0.4)]",
  },
  2: {
    text: "tw-text-[#DDDDDD]",
    bg: "tw-bg-[#dddddd]/20",
    ring: "tw-ring-[#dddddd]/40",
    shadow: "tw-shadow-[0_4px_12px_rgba(221,221,221,0.15)]",
    hover:
      "desktop-hover:hover:tw-from-[#dddddd]/35 desktop-hover:hover:tw-ring-[#dddddd]/50",
    dropShadow: "tw-drop-shadow-[0_2px_3px_rgba(221,221,221,0.4)]",
  },
  3: {
    text: "tw-text-[#CD7F32]",
    bg: "tw-bg-[#B87333]/20",
    ring: "tw-ring-[#CD7F32]/40",
    shadow: "tw-shadow-[0_4px_12px_rgba(205,127,50,0.15)]",
    hover:
      "desktop-hover:hover:tw-from-[#CD7F32]/35 desktop-hover:hover:tw-ring-[#CD7F32]/50",
    dropShadow: "tw-drop-shadow-[0_2px_3px_rgba(205,127,50,0.4)]",
  },
} as const;

const rankGradients = {
  1: "tw-from-[#E8D48A]/30 tw-via-[#D9A962]/30 tw-to-[#E8D48A]/30 desktop-hover:hover:tw-from-[#E8D48A]/40 desktop-hover:hover:tw-via-[#D9A962]/40 desktop-hover:hover:tw-to-[#E8D48A]/40 desktop-hover:hover:tw-shadow-[0_0_48px_rgba(232,212,138,0.15)]",
  2: "tw-from-[#DDDDDD]/30 tw-via-[#C0C0C0]/30 tw-to-[#DDDDDD]/30 desktop-hover:hover:tw-from-[#DDDDDD]/40 desktop-hover:hover:tw-via-[#C0C0C0]/40 desktop-hover:hover:tw-to-[#DDDDDD]/40 desktop-hover:hover:tw-shadow-[0_0_48px_rgba(221,221,221,0.15)]",
  3: "tw-from-[#CD7F32]/30 tw-via-[#B87333]/30 tw-to-[#CD7F32]/30 desktop-hover:hover:tw-from-[#CD7F32]/40 desktop-hover:hover:tw-via-[#B87333]/40 desktop-hover:hover:tw-to-[#CD7F32]/40 desktop-hover:hover:tw-shadow-[0_0_48px_rgba(205,127,50,0.15)]",
  default:
    "tw-from-iron-800/50 tw-via-iron-800/50 tw-to-iron-800/50 hover:tw-from-iron-700/60 hover:tw-via-iron-700/60 hover:tw-to-iron-700/60",
} as const;

const TrophyIcon = memo(() => (
  <svg
    className="tw-size-4 tw-flex-shrink-0"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 576 512"
    fill="currentColor"
  >
    <path d="M400 0L176 0c-26.5 0-48.1 21.8-47.1 48.2c.2 5.3 .4 10.6 .7 15.8L24 64C10.7 64 0 74.7 0 88c0 92.6 33.5 157 78.5 200.7c44.3 43.1 98.3 64.8 138.1 75.8c23.4 6.5 39.4 26 39.4 45.6c0 20.9-17 37.9-37.9 37.9L192 448c-17.7 0-32 14.3-32 32s14.3 32 32 32l192 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-26.1 0C337 448 320 431 320 410.1c0-19.6 15.9-39.2 39.4-45.6c39.9-11 93.9-32.7 138.2-75.8C542.5 245 576 180.6 576 88c0-13.3-10.7-24-24-24L446.4 64c.3-5.2 .5-10.4 .7-15.8C448.1 21.8 426.5 0 400 0zM48.9 112l84.4 0c9.1 90.1 29.2 150.3 51.9 190.6c-24.9-11-50.8-26.5-73.2-48.3c-32-31.1-58-76-63-142.3zM464.1 254.3c-22.4 21.8-48.3 37.3-73.2 48.3c22.7-40.3 42.8-100.5 51.9-190.6l84.4 0c-5.1 66.3-31.1 111.2-63 142.3z" />
  </svg>
));
TrophyIcon.displayName = "TrophyIcon";

const getRankGradientClasses = (rank: number) => {
  switch (rank) {
    case 1:
      return {
        gradient:
          "tw-from-[#E8D48A]/[0.02] tw-via-[#E8D48A]/[0.01] tw-to-transparent",
        borderTop: "tw-via-[#E8D48A]/25 tw-to-transparent",
        borderSide:
          "tw-from-[#E8D48A]/30 tw-via-[#E8D48A]/20 tw-to-transparent",
      };
    case 2:
      return {
        gradient:
          "tw-from-[#DDDDDD]/[0.02] tw-via-[#DDDDDD]/[0.01] tw-to-transparent",
        borderTop: "tw-via-[#DDDDDD]/25 tw-to-transparent",
        borderSide:
          "tw-from-[#DDDDDD]/30 tw-via-[#DDDDDD]/20 tw-to-transparent",
      };
    case 3:
      return {
        gradient:
          "tw-from-[#CD7F32]/[0.02] tw-via-[#CD7F32]/[0.01] tw-to-transparent",
        borderTop: "tw-via-[#CD7F32]/25 tw-to-transparent",
        borderSide:
          "tw-from-[#CD7F32]/30 tw-via-[#CD7F32]/20 tw-to-transparent",
      };
    default:
      return {
        gradient: "",
        borderTop: "",
        borderSide: "",
      };
  }
};

const DropContent = memo<DropContentProps>(({ drop, onDropClick }) => {
  const [activePartIndex, setActivePartIndex] = useState(0);

  const handleDropClick = useCallback(() => {
    onDropClick(drop);
  }, [drop, onDropClick]);

  return (
    <div>
      <WaveDetailedDropContent
        drop={drop}
        activePartIndex={activePartIndex}
        setActivePartIndex={setActivePartIndex}
        onLongPress={() => {}}
        onDropClick={handleDropClick}
        onQuoteClick={() => {}}
        setLongPressTriggered={() => {}}
      />
    </div>
  );
});
DropContent.displayName = "DropContent";

const WaveWinnerItem = memo<{
  drop: ExtendedDrop;
  onDropClick: (drop: ExtendedDrop) => void;
  wave: ApiWave;
}>(({ drop, onDropClick, wave }) => {
  const rankStyle =
    drop.rank && drop.rank <= 3
      ? rankColors[drop.rank as keyof typeof rankColors]
      : null;

  const hasUserVoted =
    drop.context_profile_context?.rating !== undefined &&
    drop.context_profile_context?.rating !== 0;

  const userVote = drop.context_profile_context?.rating ?? 0;
  const isNegativeVote = userVote < 0;

  const getRatingStyle = () => {
    if (rankStyle) {
      return rankStyle.text;
    }
    
    if (drop.rating >= 0) {
      return "tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-bg-clip-text tw-text-transparent";
    }

    return "tw-bg-gradient-to-r tw-from-rose-400 tw-to-rose-500 tw-bg-clip-text tw-text-transparent";
  };

  const ratingStyle = getRatingStyle();

  const getUserVoteStyle = () => {
    if (drop.rank && drop.rank <= 3 && rankStyle) {
      return rankStyle.text;
    }
    
    if (isNegativeVote) {
      return "tw-bg-gradient-to-r tw-from-rose-400 tw-to-rose-500 tw-bg-clip-text tw-text-transparent";
    }

    return "tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-bg-clip-text tw-text-transparent";
  };

  const userVoteStyle = getUserVoteStyle();

  const handleDropClick = useCallback(() => {
    onDropClick(drop);
  }, [drop, onDropClick]);

  return (
    <div
      key={drop.id}
      onClick={handleDropClick}
      className="tw-cursor-pointer tw-group tw-rounded-xl tw-overflow-hidden desktop-hover:hover:tw-scale-[1.01] tw-transform tw-transition-all tw-duration-300 tw-ease-out"
    >
      <div className="tw-rounded-xl tw-bg-iron-900 tw-p-4 tw-relative desktop-hover:hover:tw-bg-iron-800/60 tw-transition-all tw-duration-300 tw-ease-out">
        {drop.rank && drop.rank <= 3 && rankStyle && (
          <div className="tw-absolute tw-inset-0">
            {(() => {
              const classes = getRankGradientClasses(drop.rank);
              return (
                <>
                  <div
                    className={`tw-absolute tw-inset-0 tw-bg-gradient-to-b ${classes.gradient}`}
                  />
                  <div
                    className={`tw-absolute tw-inset-x-0 tw-top-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent ${classes.borderTop}`}
                  />
                  <div
                    className={`tw-absolute tw-inset-x-0 tw-bottom-0 tw-h-px tw-bg-gradient-to-r tw-from-transparent ${classes.borderTop}`}
                  />
                  <div
                    className={`tw-absolute tw-inset-y-0 tw-right-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-${classes.borderSide} tw-to-transparent`}
                  />
                  <div
                    className={`tw-absolute tw-inset-y-0 tw-left-0 tw-w-px tw-bg-gradient-to-b tw-from-transparent tw-via-${classes.borderSide} tw-to-transparent`}
                  />
                  <div className="tw-absolute tw-bottom-0 tw-h-3/4 tw-inset-x-0 tw-bg-gradient-to-t tw-from-black/20 tw-via-black/10 tw-to-transparent" />
                </>
              );
            })()}
          </div>
        )}
        <div className="tw-flex tw-flex-col tw-relative">
          <div className="tw-flex tw-items-start tw-justify-between tw-gap-x-4">
            <div className="tw-flex tw-items-center tw-gap-x-3">
              {drop.rank && (
                <div>
                  {rankStyle ? (
                    <div
                      className={`${rankStyle.shadow} tw-ring-1 ${rankStyle.bg} ${rankStyle.ring} tw-rounded-xl tw-h-7 tw-w-full tw-px-2.5 ${rankStyle.text} tw-font-medium tw-text-xs tw-flex tw-items-center tw-justify-center tw-gap-x-1.5 desktop-hover:${rankStyle.hover} tw-transition-all tw-duration-200`}
                    >
                      <TrophyIcon />
                      <span className={`${rankStyle.dropShadow} tw-text-sm`}>
                        #{drop.rank}
                      </span>
                    </div>
                  ) : (
                    <div className="tw-font-medium tw-text-sm tw-text-iron-300 tw-flex tw-items-center tw-justify-center tw-h-7 tw-w-full tw-px-2.5 tw-rounded-xl tw-bg-iron-800 tw-backdrop-blur-sm tw-ring-1 tw-ring-iron-700">
                      #{drop.rank}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="tw-flex tw-justify-end tw-items-center tw-gap-x-3 tw-flex-wrap">
              <div className="tw-flex tw-items-center tw-gap-x-1.5">
                <span className={`tw-text-sm tw-font-semibold ${ratingStyle}`}>
                  {formatNumberWithCommas(drop.rating)}
                </span>
                <span className="tw-text-sm tw-font-medium tw-text-iron-400">
                  {drop.wave.voting_credit_type}
                </span>
              </div>
              <div className="tw-flex tw-items-center tw-gap-x-1.5">
                <span className="tw-text-sm tw-text-iron-200">
                  {formatNumberWithCommas(drop.raters_count)}
                </span>
                <span className="tw-text-sm tw-text-iron-400">
                  {drop.raters_count === 1 ? "voter" : "voters"}
                </span>
              </div>

              {hasUserVoted && (
                <div className="tw-flex tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap">
                  <span className="tw-text-iron-400 tw-text-sm">You:</span>
                  <span
                    className={`tw-text-sm tw-font-medium ${userVoteStyle}`}
                  >
                    {formatNumberWithCommas(userVote)}{" "}
                    {drop.wave.voting_credit_type}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-gap-x-3 tw-mt-4">
          <Link
            href={`/${drop.author.handle}`}
            onClick={(e) => e.stopPropagation()}
            className="tw-block tw-flex-shrink-0 desktop-hover:group-hover:tw-opacity-90 tw-transition-opacity"
          >
            {drop.author.pfp ? (
              <img
                src={getScaledImageUri(drop.author.pfp, ImageScale.W_AUTO_H_50)}
                alt="Picture"
                className="tw-size-7 tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-object-cover"
              />
            ) : (
              <div className="tw-size-7 tw-rounded-lg tw-ring-1 tw-ring-white/10 tw-bg-iron-800" />
            )}
          </Link>

          <div className="tw-flex tw-items-center tw-gap-1.5">
            <Link
              href={`/${drop.author.handle}`}
              onClick={(e) => e.stopPropagation()}
              className="tw-no-underline tw-truncate"
            >
              <span className="tw-text-sm tw-font-semibold tw-text-iron-200 desktop-hover:hover:tw-text-iron-100 tw-transition-colors">
                {drop.author.handle}
              </span>
            </Link>
            <span className="tw-size-[3px] tw-bg-iron-600 tw-rounded-full tw-flex-shrink-0"></span>
            <span className="tw-text-sm tw-text-iron-400 tw-flex-shrink-0">
              {getTimeAgoShort(drop.created_at)}
            </span>
          </div>
        </div>

        <div className="tw-ml-10">
          <DropContent drop={drop} onDropClick={onDropClick} />
          <div className="tw-mt-2 tw-relative">
            <WaveWinnersSmallOutcome drop={drop} wave={wave} />
          </div>
        </div>
      </div>
    </div>
  );
});
WaveWinnerItem.displayName = "WaveWinnerItem";

export const WaveWinnersSmall = memo<WaveWinnersSmallProps>(
  ({ wave, onDropClick }) => {
    const { connectedProfile } = useContext(AuthContext);
    const { drops } = useWaveDropsLeaderboard({
      waveId: wave.id,
      connectedProfileHandle: connectedProfile?.profile?.handle,
      dropsSortBy: WaveDropsLeaderboardSortBy.RANK,
      sortDirection: WaveDropsLeaderboardSortDirection.ASC,
      reverse: false,
    });

    if (!drops?.length) {
      return (
        <div className="tw-p-3">
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-py-8">
            <div className="tw-mt-4 tw-text-base tw-font-semibold tw-text-iron-300">
              No Winners to Display
            </div>
            <p className="tw-mb-0 tw-mt-2 tw-text-sm tw-text-iron-400">
              This wave ended without any submissions
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="tw-p-3">
        <div className="tw-flex tw-items-center tw-justify-between tw-px-1">
          <h2 className="tw-mb-0 tw-text-base tw-font-semibold tw-text-iron-50">
            Winners
          </h2>
        </div>

        <div className="tw-space-y-3 tw-mt-3">
          {drops.map((drop) => (
            <WaveWinnerItem
              key={drop.id}
              drop={drop}
              wave={wave}
              onDropClick={onDropClick}
            />
          ))}
        </div>
      </div>
    );
  }
);
WaveWinnersSmall.displayName = "WaveWinnersSmall";
