import React from "react";
import Tippy from "@tippyjs/react";
import Link from "next/link";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";
import { ApiDropVoter } from "../../../../types/ApiDrop";

interface MemeDropVoteStatsProps {
  readonly rating: number | null | undefined;
  readonly votingCreditType: string;
  readonly ratersCount: number | null | undefined;
  readonly topVoters: ApiDropVoter[];
}

export default function MemeDropVoteStats({
  rating,
  votingCreditType,
  ratersCount,
  topVoters,
}: MemeDropVoteStatsProps) {
  const isPositive = (rating || 0) >= 0;
  const firstThreeVoters = topVoters?.slice(0, 3) || [];

  return (
    <div className="tw-flex tw-items-center tw-justify-between tw-px-1">
      <div className="tw-flex tw-items-baseline tw-gap-x-1.5">
        <span
          className={`tw-text-xl tw-font-semibold tw-bg-gradient-to-r ${
            isPositive
              ? "tw-from-emerald-400 tw-to-emerald-500"
              : "tw-from-rose-400 tw-to-rose-500"
          } tw-bg-clip-text tw-text-transparent`}
        >
          {formatNumberWithCommas(rating || 0)}
        </span>
        <span className="tw-text-sm tw-text-iron-400">
          {votingCreditType} total
        </span>
      </div>
      <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-x-3">
        <div className="tw-flex tw-items-center -tw-space-x-1.5">
          {firstThreeVoters.map((voter) => (
            <Tippy
              key={voter.profile.handle}
              content={`${
                voter.profile.handle
              } - ${formatNumberWithCommas(voter.rating)}`}
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
          <span className="tw-text-base tw-font-medium tw-text-iron-100">
            {formatNumberWithCommas(ratersCount || 0)}
          </span>
          <span className="tw-text-sm tw-text-iron-400">
            {ratersCount === 1 ? "voter" : "voters"}
          </span>
        </div>
      </div>
    </div>
  );
}
