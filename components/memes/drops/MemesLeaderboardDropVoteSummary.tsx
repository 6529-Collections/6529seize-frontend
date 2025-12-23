import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { ApiDropContextProfileContext } from "@/generated/models/ApiDropContextProfileContext";
import { ApiDropRater } from "@/generated/models/ApiDropRater";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import Link from "next/link";
import React from "react";
import { Tooltip } from "react-tooltip";

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
    <div className="tw-flex @[700px]:tw-flex-1 tw-items-center tw-gap-4 @[700px]:tw-justify-between">
      {/* Left side: Vote counts + User vote (on large) */}
      <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm">
        <span
          className={`tw-font-bold tw-font-mono tw-tracking-tight tw-text-sm ${
            isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
          }`}
        >
          {formatNumberWithCommas(current)}
        </span>
        <DropVoteProgressing current={current} projected={projected} />
        <span className="tw-text-iron-500 tw-text-sm tw-ml-1">
          {creditType} total
        </span>
        {/* User vote badge - hidden on small containers */}
        {hasUserVoted && (
          <span className="tw-hidden @[500px]:tw-inline tw-text-xs tw-text-iron-500 tw-font-mono tw-ml-3 tw-border-l tw-border-solid tw-border-white/10 tw-pl-3 tw-border-t-0 tw-border-r-0 tw-border-b-0">
            Your vote:{" "}
            <span className="tw-text-white tw-font-bold">
              {isUserVoteNegative && "-"}
              {formatNumberWithCommas(Math.abs(userVote))}
            </span>
          </span>
        )}
      </div>

      {/* Right side: Voters - hidden on small containers (shown next to button) */}
      <div className="tw-hidden @[700px]:tw-flex tw-items-center tw-gap-2">
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
          <span className="tw-text-iron-200 tw-font-semibold tw-text-sm">
            {formatNumberWithCommas(ratersCount)}{" "}
            <span className="tw-text-iron-500 tw-font-normal">
              {ratersCount === 1 ? "voter" : "voters"}
            </span>
          </span>
      </div>
    </div>
  );
};

export default MemesLeaderboardDropVoteSummary;
