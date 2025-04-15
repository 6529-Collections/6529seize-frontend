import React from "react";
import Tippy from "@tippyjs/react";
import Link from "next/link";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { ApiDropRater } from "../../../../generated/models/ApiDropRater";
import DropVoteProgressing from "../../../drops/view/utils/DropVoteProgressing";
import { ApiDropContextProfileContext } from "../../../../generated/models/ApiDropContextProfileContext";

interface MemeDropVoteStatsProps {
  readonly current: number | null | undefined;
  readonly projected: number | null | undefined;
  readonly votingCreditType: string;
  readonly ratersCount: number | null | undefined;
  readonly topVoters: ApiDropRater[];
  readonly userContext?: ApiDropContextProfileContext | null;
}

export default function MemeDropVoteStats({
  current,
  projected,
  votingCreditType,
  ratersCount,
  topVoters,
  userContext,
}: MemeDropVoteStatsProps) {
  const isPositive = (current ?? 0) >= 0;
  const firstThreeVoters = topVoters?.slice(0, 3) ?? [];

  // Check if user has voted
  const hasUserVoted =
    userContext?.rating !== undefined && userContext?.rating !== 0;
  const userVote = userContext?.rating ?? 0;
  const isUserVoteNegative = userVote < 0;

  return (
    <div className="tw-flex tw-items-center tw-flex-wrap tw-gap-x-6 tw-gap-y-2">
      <div className="tw-flex tw-items-baseline tw-gap-x-1">
        <span
          className={`tw-text-sm tw-font-semibold ${
            isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
          } `}
        >
          {formatNumberWithCommas(current ?? 0)}
        </span>

        <div className="tw-flex tw-items-baseline tw-gap-x-1.5">
          <span className="tw-text-sm tw-text-iron-400 text-nowrap">
            {votingCreditType} total
          </span>

          <DropVoteProgressing current={current} projected={projected} />
        </div>
      </div>
      <div className="tw-flex tw-items-center tw-gap-x-2">
        <div className="tw-flex tw-items-center -tw-space-x-1.5 -tw-mt-0.5">
          {firstThreeVoters.map((voter) => (
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
                    className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950"
                    src={voter.profile.pfp}
                    alt="Recent voter"
                  />
                ) : (
                  <div className="tw-size-6 tw-rounded-md tw-ring-2 tw-ring-iron-950 tw-bg-iron-800" />
                )}
              </Link>
            </Tippy>
          ))}
        </div>
        <div className="tw-flex tw-items-baseline tw-gap-x-1">
          <span className="tw-text-sm tw-font-medium tw-text-iron-100">
            {formatNumberWithCommas(ratersCount ?? 0)}
          </span>
          <span className="tw-text-sm tw-text-iron-400 text-nowrap">
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
                isUserVoteNegative ? "tw-text-rose-500" : "tw-text-emerald-500"
              }`}
            >
              {isUserVoteNegative && "-"}
              {formatNumberWithCommas(Math.abs(userVote))}{" "}
              <span className="tw-text-iron-400 tw-font-normal">
                {votingCreditType}
              </span>
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
