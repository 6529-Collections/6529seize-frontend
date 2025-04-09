import React from "react";
import { formatNumberWithCommas } from "../../../helpers/Helpers";
import Link from "next/link";
import Tippy from "@tippyjs/react";
import { ApiDropRater } from "../../../generated/models/ApiDropRater";
import DropVoteProgressing from "../../drops/view/utils/DropVoteProgressing";

interface MemesLeaderboardDropVoteSummaryProps {
  readonly current: number;
  readonly projected: number;
  readonly creditType: string;
  readonly ratersCount: number;
  readonly topVoters: ApiDropRater[];
}

export const MemesLeaderboardDropVoteSummary: React.FC<
  MemesLeaderboardDropVoteSummaryProps
> = ({ current, projected, creditType, ratersCount, topVoters }) => {
  const isPositive = current >= 0;

  return (
    <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between sm:tw-justify-start tw-gap-x-4 tw-gap-y-4">
      <div className="tw-flex tw-items-baseline tw-gap-x-1">
        <span
          className={`tw-text-md tw-font-semibold ${
            isPositive ? "tw-text-emerald-500" : "tw-text-rose-500"
          }`}
        >
          {formatNumberWithCommas(current)}
        </span>
        <DropVoteProgressing current={current} projected={projected} />
        <span className="tw-text-md tw-text-iron-400 text-nowrap">
          {creditType} total
        </span>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-x-3">
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
          <span className="tw-text-md tw-font-medium tw-text-iron-100">
            {formatNumberWithCommas(ratersCount)}
          </span>
          <span className="tw-text-md tw-text-iron-400 text-nowrap">
            {ratersCount === 1 ? "voter" : "voters"}
          </span>
        </div>
      </div>
    </div>
  );
};

export default MemesLeaderboardDropVoteSummary;
