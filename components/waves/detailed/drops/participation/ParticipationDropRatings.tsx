import React from "react";
import { ApiDrop } from "../../../../../generated/models/ApiDrop";
import Tippy from "@tippyjs/react";
import {
  getScaledImageUri,
  ImageScale,
} from "../../../../../helpers/image.helpers";
import { formatNumberWithCommas } from "../../../../../helpers/Helpers";

interface ParticipationDropRatingsProps {
  readonly drop: ApiDrop;
  readonly rank?: number | null;
}

export const ParticipationDropRatings: React.FC<ParticipationDropRatingsProps> = ({ 
  drop,
  rank = null
}) => {
  const hasRaters = drop.top_raters && drop.top_raters.length > 0;
  const userRating = drop.context_profile_context?.rating ?? 0;
  const totalRating = drop.rating ?? 0;

  const availableCredit = Math.abs(
    (drop.context_profile_context?.max_rating ?? 0) -
      (drop.context_profile_context?.rating ?? 0)
  );

  const getThemeColors = (rank: number | null, isNegative: boolean) => {
    const baseTheme = {
      1: {
        gradient: "tw-from-[#E8D48A] tw-to-[#D9A962]",
        text: "tw-text-[#E8D48A]",
        ring: "tw-ring-[#E8D48A]/20"
      },
      2: {
        gradient: "tw-from-[#DDDDDD] tw-to-[#C0C0C0]",
        text: "tw-text-[#DDDDDD]",
        ring: "tw-ring-[#DDDDDD]/20"
      },
      3: {
        gradient: "tw-from-[#CD7F32] tw-to-[#B87333]",
        text: "tw-text-[#CD7F32]",
        ring: "tw-ring-[#CD7F32]/20"
      },
      default: {
        gradient: "tw-from-iron-300 tw-to-iron-400",
        text: "tw-text-iron-300",
        ring: "tw-ring-iron-600"
      }
    };

    const theme = baseTheme[rank as keyof typeof baseTheme] ?? baseTheme.default;
    
    if (isNegative) {
      return {
        gradient: `${theme.gradient} tw-opacity-60`,
        text: `${theme.text} tw-opacity-60`,
        ring: theme.ring,
        indicator: "after:tw-content-[''] after:tw-absolute after:-tw-right-2 after:tw-top-1/2 after:-tw-translate-y-1/2 after:tw-w-1 after:tw-h-1 after:tw-rounded-full after:tw-bg-iron-400/40"
      };
    }

    return {
      gradient: theme.gradient,
      text: theme.text,
      ring: theme.ring,
      indicator: ""
    };
  };

  const theme = getThemeColors(rank, totalRating < 0);
  const userTheme = getThemeColors(rank, userRating < 0);

  const VoteBreakdownTooltip = () => (
    <div className="tw-p-3 tw-space-y-3 tw-min-w-[200px]">
      {hasRaters && (
        <div className="tw-space-y-2">
          <span className="tw-text-xs tw-font-medium tw-text-iron-400">Top Voters</span>
          <div className="tw-space-y-1.5">
            {drop.top_raters.map((rater) => (
              <div key={rater.profile.id} className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-2">
                  {rater.profile.pfp && (
                    <img
                      src={getScaledImageUri(rater.profile.pfp, ImageScale.W_AUTO_H_50)}
                      alt=""
                      className="tw-h-4 tw-w-4 tw-rounded-md tw-ring-1 tw-ring-white/10"
                    />
                  )}
                  <span className="tw-text-xs tw-font-medium tw-text-iron-300">{rater.profile.handle}</span>
                </div>
                <span className={`tw-text-xs tw-font-medium ${rater.rating >= 0 ? 'tw-text-emerald-400' : 'tw-text-rose-400'}`}>
                  {rater.rating > 0 && '+'}{formatNumberWithCommas(rater.rating)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {drop.context_profile_context && (
        <div className="tw-space-y-2">
          <span className="tw-text-xs tw-font-medium tw-text-iron-400">Your Voting Power</span>
          <div className="tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-xs tw-text-iron-300">Available</span>
            <span className="tw-text-xs tw-font-medium tw-text-iron-300">
              {formatNumberWithCommas(availableCredit)} TDH
            </span>
          </div>
          <div className="tw-flex tw-items-center tw-justify-between">
            <span className="tw-text-xs tw-text-iron-300">Voted</span>
            <span className="tw-text-xs tw-font-medium tw-text-iron-300">
              {formatNumberWithCommas(Math.abs(userRating))} TDH
            </span>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="tw-flex tw-items-center tw-justify-between">
      <div className="tw-flex tw-items-start tw-gap-8">
        <div className="tw-flex tw-flex-col tw-gap-1.5">
          <Tippy
            content={<VoteBreakdownTooltip />}
            interactive={true}
            placement="bottom-start"
            appendTo={() => document.body}
            zIndex={1000}
          >
            <span className="tw-text-xs tw-font-medium tw-text-iron-500 tw-h-5 tw-flex tw-items-center tw-cursor-help">
              Total TDH
            </span>
          </Tippy>
          <div className={`tw-relative tw-inline-flex ${theme.indicator}`}>
            <span className={`tw-text-2xl tw-font-bold tw-bg-gradient-to-r ${theme.gradient} tw-bg-clip-text tw-text-transparent`}>
              {totalRating < 0 && "-"}{formatNumberWithCommas(Math.abs(totalRating))}
            </span>
          </div>
        </div>

        <div className="tw-flex tw-flex-col tw-gap-1.5">
          <div className="tw-h-5 tw-flex tw-items-center tw-gap-2.5">
            <span className="tw-text-xs tw-font-medium tw-text-iron-500">
              Voters
            </span>
            {hasRaters && (
              <div className="tw-flex tw-items-center -tw-space-x-1.5">
                {drop.top_raters.slice(0, 5).map((rater, index) => (
                  <Tippy
                    key={rater.profile.id}
                    content={
                      <span className="tw-text-xs tw-font-medium">
                        {rater.profile.handle} • {formatNumberWithCommas(rater.rating)} TDH
                      </span>
                    }
                    interactive={true}
                    delay={[0, 0]}
                    hideOnClick={false}
                    appendTo={() => document.body}
                    zIndex={1000}
                  >
                    <div 
                      className="tw-relative tw-transition-transform hover:tw-scale-110 hover:tw-z-10" 
                      style={{ zIndex: drop.top_raters.length - index }}
                    >
                      {rater.profile.pfp && (
                        <img
                          src={getScaledImageUri(
                            rater.profile.pfp,
                            ImageScale.W_AUTO_H_50
                          )}
                          alt={`${rater.profile.handle}'s Profile Picture`}
                          className={`tw-h-5 tw-w-5 tw-rounded-md tw-ring-1 ${theme.ring} tw-bg-iron-900`}
                        />
                      )}
                    </div>
                  </Tippy>
                ))}
                {drop.raters_count > 5 && (
                  <Tippy
                    content={
                      <div className="tw-p-3 tw-space-y-3 tw-min-w-[200px]">
                        <div className="tw-space-y-2">
                          <span className="tw-text-xs tw-font-medium tw-text-iron-400">Top Voters</span>
                          <div className="tw-space-y-1.5">
                            {drop.top_raters.map((rater) => (
                              <div key={rater.profile.id} className="tw-flex tw-items-center tw-justify-between">
                                <div className="tw-flex tw-items-center tw-gap-2">
                                  {rater.profile.pfp && (
                                    <img
                                      src={getScaledImageUri(rater.profile.pfp, ImageScale.W_AUTO_H_50)}
                                      alt=""
                                      className="tw-h-4 tw-w-4 tw-rounded-md tw-ring-1 tw-ring-white/10"
                                    />
                                  )}
                                  <span className="tw-text-xs tw-font-medium tw-text-iron-300">{rater.profile.handle}</span>
                                </div>
                                <span className={`tw-text-xs tw-font-medium ${rater.rating >= 0 ? 'tw-text-emerald-400' : 'tw-text-rose-400'}`}>
                                  {rater.rating > 0 && '+'}{formatNumberWithCommas(rater.rating)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    }
                    interactive={true}
                    delay={[0, 0]}
                    hideOnClick={false}
                    placement="bottom-start"
                    appendTo={() => document.body}
                    zIndex={1000}
                  >
                    <div className={`tw-relative tw-h-5 tw-w-5 tw-flex tw-items-center tw-justify-center tw-rounded-md tw-bg-iron-900 tw-ring-1 ${theme.ring} ${theme.text} tw-text-[10px] tw-font-medium hover:tw-scale-110 tw-transition-transform`}>
                      +{drop.raters_count - 5}
                    </div>
                  </Tippy>
                )}
              </div>
            )}
          </div>
          <span className={`tw-text-2xl tw-font-bold ${theme.text}`}>
            {drop.raters_count}
          </span>
        </div>
      </div>

      <div className="tw-flex tw-flex-col tw-gap-1.5">
        <span className="tw-text-xs tw-font-medium tw-text-iron-500 tw-h-5 tw-flex tw-items-center">
          Your votes
        </span>
        <div className="tw-flex tw-items-baseline tw-gap-1.5">
          <div className={`tw-relative tw-inline-flex ${userTheme.indicator}`}>
            <span className={`tw-text-2xl tw-font-bold tw-bg-gradient-to-r ${userTheme.gradient} tw-bg-clip-text tw-text-transparent`}>
              {userRating < 0 && "-"}{formatNumberWithCommas(Math.abs(userRating))}
            </span>
          </div>
          <span className="tw-text-sm tw-font-medium tw-text-iron-500">
            TDH
          </span>
        </div>
      </div>
    </div>
  );
};
