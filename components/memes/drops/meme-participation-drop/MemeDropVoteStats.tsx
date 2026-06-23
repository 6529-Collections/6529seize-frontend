import { Tooltip } from "react-tooltip";
import Link from "next/link";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface MemeDropVoteStatsProps {
  readonly drop: ExtendedDrop;
}

export default function MemeDropVoteStats({ drop }: MemeDropVoteStatsProps) {
  const current = drop.rating;
  const projected = drop.rating_prediction;
  const votingCreditType = drop.wave.voting_credit_type;
  const userContext = drop.context_profile_context;
  const isPositive = (current ?? 0) >= 0;
  const firstThreeVoters = drop.top_raters.slice(0, 3);

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
          <span className="tw-text-sm tw-text-iron-500 tw-whitespace-nowrap">
            <span className="tw-font-medium">{votingCreditType} total</span>
          </span>

          <DropVoteProgressing current={current} projected={projected} />
        </div>
      </div>
      <div className="tw-flex tw-items-center tw-gap-2">
        <div className="tw-flex tw-items-center -tw-space-x-2">
          {firstThreeVoters.map((voter) => (
            <div key={voter.profile.handle}>
              <Link
                href={`/${voter.profile.handle}`}
                onClick={(e) => e.stopPropagation()}
                data-tooltip-id={`vote-stats-${voter.profile.handle}`}
              >
                {voter.profile.pfp ? (
                  <img
                    className="tw-w-6 tw-h-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800 tw-object-contain"
                    src={voter.profile.pfp}
                    alt="Recent voter"
                  />
                ) : (
                  <div className="tw-w-6 tw-h-6 tw-rounded-md tw-border-2 tw-border-solid tw-border-[#111] tw-bg-iron-800" />
                )}
              </Link>
              <Tooltip
                id={`vote-stats-${voter.profile.handle}`}
                place="top"
                style={{
                  backgroundColor: "#1F2937",
                  color: "white",
                  padding: "4px 8px",
                }}
              >
                <span className="tw-text-xs">{`${
                  voter.profile.handle
                } - ${formatNumberWithCommas(voter.rating)}`}</span>
              </Tooltip>
            </div>
          ))}
        </div>
        <ParticipationDropVoteDetailsTrigger drop={drop} />
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
