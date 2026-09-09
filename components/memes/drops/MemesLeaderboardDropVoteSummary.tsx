import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import DropLargestVote from "@/components/waves/drop/DropLargestVote";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";
import { getScaledImageUri, ImageScale } from "@/helpers/image.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t, tRich } from "@/i18n/messages";
import Image from "next/image";
import Link from "next/link";
import React from "react";
import { Tooltip } from "react-tooltip";

interface MemesLeaderboardDropVoteSummaryProps {
  readonly drop: ExtendedDrop;
  readonly voteButton?: React.ReactNode;
}

const MemesLeaderboardDropVoteSummary: React.FC<
  MemesLeaderboardDropVoteSummaryProps
> = ({ drop, voteButton }) => {
  const locale = useBrowserLocale();
  const current = drop.rating;
  const projected = drop.rating_prediction;
  const creditType = drop.wave.voting_credit_type;
  const topVoters = drop.top_raters.slice(0, 3);
  const userContext = drop.context_profile_context;
  const isPositive = current >= 0;

  // Check if user has voted
  const hasUserVoted =
    userContext?.rating !== undefined && userContext?.rating !== 0;
  const userVote = userContext?.rating ?? 0;

  return (
    <div className="tw-grid tw-min-w-0 tw-grid-cols-1 tw-items-center tw-gap-x-4 tw-gap-y-1 @[700px]:tw-grid-cols-[minmax(0,1fr)_auto]">
      {/* Left side: Vote counts + User vote (on large) */}
      <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-2 tw-text-sm">
        <span
          className={`tw-text-body tw-font-semibold tw-tabular-nums tw-leading-5 tw-tracking-identity ${
            isPositive ? "tw-text-iron-100" : "tw-text-rose-400"
          }`}
        >
          {formatInteger(locale, current)}
        </span>
        <div className="tw-flex tw-items-baseline tw-gap-1">
          <DropVoteProgressing
            current={current}
            projected={projected}
            projectedLabel={formatInteger(locale, projected)}
            tooltipLabel={t(locale, "waves.myVotes.projectedAtDecision")}
            numberFont="sans"
            numberSize="body"
            numberWeight="semibold"
            visualVariant="memes"
          />
          <span className="tw-whitespace-nowrap tw-text-label tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-ordinal tw-text-iron-600">
            {t(locale, "waves.leaderboard.voteSummary.total", { creditType })}
          </span>
        </div>
        {/* User vote badge - hidden on small containers */}
        {hasUserVoted && (
          <span className="tw-ml-3 tw-hidden tw-border-b-0 tw-border-l tw-border-r-0 tw-border-t-0 tw-border-solid tw-border-white/10 tw-pl-3 tw-font-mono tw-text-xs tw-text-iron-500 @[500px]:tw-inline">
            {tRich(locale, "waves.leaderboard.voteSummary.yourVote", {
              vote: (
                <span key="user-vote" className="tw-font-bold tw-text-white">
                  {formatInteger(locale, userVote)}
                </span>
              ),
            })}
          </span>
        )}
      </div>

      {/* Keep voters and voting centered together, above the secondary summary. */}
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 @[700px]:tw-justify-end">
        <div className="tw-flex tw-items-center tw-gap-2">
          {topVoters.length > 0 && (
            <div className="tw-flex tw-items-center -tw-space-x-2">
              {topVoters.map((voter) => {
                const address = voter.profile.primary_address.trim();
                const handle = voter.profile.handle?.trim();
                let identity = voter.profile.id;
                if (handle) {
                  identity = handle;
                } else if (address && address !== "UNKNOWN") {
                  identity = address;
                }
                const tooltipId = `voter-${drop.id}-${voter.profile.id}`;

                return (
                  <React.Fragment key={voter.profile.id}>
                    <Link
                      href={`/${encodeURIComponent(identity)}`}
                      onClick={(e) => e.stopPropagation()}
                      data-tooltip-id={tooltipId}
                      aria-label={t(locale, "waves.myVotes.voterAvatar", {
                        profile: identity,
                      })}
                      className="tw-rounded-md focus-visible:tw-relative focus-visible:tw-z-10 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-2 focus-visible:tw-outline-white"
                    >
                      {voter.profile.pfp ? (
                        <Image
                          className="tw-h-6 tw-w-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                          src={getScaledImageUri(
                            voter.profile.pfp,
                            ImageScale.W_AUTO_H_50
                          )}
                          alt=""
                          width={24}
                          height={24}
                        />
                      ) : (
                        <div className="tw-h-6 tw-w-6 tw-rounded-lg tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800" />
                      )}
                    </Link>
                    <Tooltip
                      id={tooltipId}
                      place="top"
                      offset={8}
                      opacity={1}
                      style={{
                        padding: "4px 8px",
                        background: "#37373E",
                        color: "white",
                        fontSize: "13px",
                        fontWeight: 500,
                        borderRadius: "6px",
                        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
                        zIndex: 99999,
                        pointerEvents: "none",
                      }}
                    >
                      {identity} - {formatInteger(locale, voter.rating)}
                    </Tooltip>
                  </React.Fragment>
                );
              })}
            </div>
          )}
          <ParticipationDropVoteDetailsTrigger
            drop={drop}
            visualVariant="memes"
          />
        </div>
        {voteButton}
      </div>
      <DropLargestVote drop={drop} className="@[700px]:tw-col-span-2" />
    </div>
  );
};

export default MemesLeaderboardDropVoteSummary;
