import React from "react";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import Link from "next/link";
import Tippy from "@tippyjs/react";
import { ApiDropRater } from "../../../generated/models/ApiDropRater";
import DropVoteProgressing from "../../drops/view/utils/DropVoteProgressing";
import { ApiDropContextProfileContext } from "../../../generated/models/ApiDropContextProfileContext";

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
    <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-6 tw-gap-y-2">
      <div className="tw-flex tw-items-center tw-gap-x-1">
        <span
          className={`tw-text-sm tw-font-semibold ${
            isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
          }`}
        >
          {formatNumberWithCommas(current)}
        </span>
        <DropVoteProgressing current={current} projected={projected} />
        <span className="tw-text-sm tw-text-iron-400 text-nowrap">
          {creditType} total
        </span>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-items-center -tw-space-x-1.5">
          {topVoters.map((voter) => (
            <Tippy
              key={voter.profile.handle}
              content={`${voter.profile.handle} - ${formatNumberWithCommas(
                voter.rating
              )}`}
            >
              <Link
                href={`/${voter.profile.handle}`}
                onClick={(e) => e.stopPropagation()}
              >
                {voter.profile.pfp ? (
                  <img
                    className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-black tw-bg-iron-800 tw-object-contain"
                    src={voter.profile.pfp}
                    alt="Recent voter"
                  />
                ) : (
                  <div className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-black tw-bg-iron-800" />
                )}
              </Link>
            </Tippy>
          ))}
        </div>
        <div className="tw-flex tw-items-baseline tw-gap-x-1">
          <span className="tw-text-sm tw-font-medium tw-text-iron-100">
            {formatNumberWithCommas(ratersCount)}
          </span>
          <span className="tw-text-sm tw-text-iron-400 text-nowrap">
            {ratersCount === 1 ? "voter" : "voters"}
          </span>
        </div>
      </div>

      {hasUserVoted && (
        <div className="tw-flex tw-items-center tw-gap-x-1.5">
          <div className="tw-flex tw-items-baseline tw-gap-x-1">
            <span className="tw-text-sm tw-font-normal tw-text-iron-400">
              Your vote:
            </span>
            <span
              className={`tw-text-sm tw-font-semibold ${
                isUserVoteNegative ? "tw-text-rose-500" : "tw-text-emerald-500"
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
  );
};

export default MemesLeaderboardDropVoteSummary;
