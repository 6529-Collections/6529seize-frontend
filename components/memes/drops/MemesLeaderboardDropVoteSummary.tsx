import React from "react";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import Link from "next/link";
import { Tooltip } from "react-tooltip";
import { ApiDropRater } from "@/generated/models/ApiDropRater";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";

interface MemesLeaderboardDropVoteSummaryProps {
  readonly current: number;
  readonly projected: number;
  readonly creditType: string;
  readonly ratersCount: number;
  readonly topVoters: ApiDropRater[];
  readonly userContext?: ApiDropContextProfileContext | null;
}

const MemesLeaderboardDropVoteSummary: React.FC<
  MemesLeaderboardDropVoteSummaryProps
> = ({
  current,
  projected,
  creditType,
  ratersCount,
  topVoters,
  userContext,
}) => {
  const isPositive = current >= 0;

  // Check if user has voted
  const hasUserVoted =
    userContext?.rating !== undefined && userContext?.rating !== 0;
  const userVote = userContext?.rating ?? 0;
  const isUserVoteNegative = userVote < 0;

  return (
    <div className="tw-flex tw-flex-col tw-gap-y-3">
      {/* Vote stats row */}
      <div className="tw-flex tw-items-center tw-justify-between tw-flex-wrap tw-gap-x-4 tw-gap-y-2">
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
          <span
            className={`tw-font-bold tw-font-mono tw-tracking-tight ${
              isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
            }`}
          >
            {formatNumberWithCommas(current)}
          </span>
          <DropVoteProgressing current={current} projected={projected} />
          <span className="tw-text-iron-500 tw-text-xs">
            {creditType} total
          </span>
        </div>

        <div className="tw-flex tw-items-center tw-gap-3">
          <div className="tw-flex tw-items-center -tw-space-x-2">
            {topVoters.map((voter) => (
              <React.Fragment key={voter.profile.handle}>
                <Link
                  href={`/${voter.profile.handle}`}
                  onClick={(e) => e.stopPropagation()}
                  data-tooltip-id={`voter-${voter.profile.handle}`}
                >
                  {voter.profile.pfp ? (
                    <img
                      className="tw-w-6 tw-h-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                      src={voter.profile.pfp}
                      alt="Recent voter"
                    />
                  ) : (
                    <div className="tw-w-6 tw-h-6 tw-rounded-lg tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800" />
                  )}
                </Link>
                <Tooltip
                  id={`voter-${voter.profile.handle}`}
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
                  {voter.profile.handle} - {formatNumberWithCommas(voter.rating)}
                </Tooltip>
              </React.Fragment>
            ))}
          </div>
          <span className="tw-text-white tw-font-bold tw-text-sm">
            {formatNumberWithCommas(ratersCount)}{" "}
            <span className="tw-text-iron-500 tw-font-normal">
              {ratersCount === 1 ? "voter" : "voters"}
            </span>
          </span>
        </div>
      </div>

      {/* User vote badge */}
      {hasUserVoted && (
        <div className="tw-px-2.5 tw-py-1 tw-bg-iron-900/50 tw-rounded-md tw-border tw-border-iron-800/50 tw-self-start">
          <span className="tw-text-xs tw-text-iron-500">
            Your vote:{" "}
            <span
              className={`tw-font-semibold ${
                isUserVoteNegative ? "tw-text-rose-400" : "tw-text-emerald-400"
              }`}
            >
              {isUserVoteNegative && "-"}
              {formatNumberWithCommas(Math.abs(userVote))}
            </span>
          </span>
        </div>
      )}
    </div>
  );
};

export default MemesLeaderboardDropVoteSummary;
