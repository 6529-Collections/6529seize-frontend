import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import WaveWinnersDropHeaderVoter from "./WaveWinnersDropHeaderVoter";
import { WAVE_VOTING_LABELS, WAVE_VOTE_STATS_LABELS } from "@/helpers/waves/waves.constants";

interface WaveWinnersDropHeaderVotersProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderVoters({
  winner,
}: WaveWinnersDropHeaderVotersProps) {
  const hasUserVoted =
    winner.drop.context_profile_context?.rating !== undefined &&
    winner.drop.context_profile_context?.rating !== 0;

  const userVote = winner.drop.context_profile_context?.rating ?? 0;
  const isNegativeVote = userVote < 0;

  const topThreeRankStyles: { [key: number]: string } = {
    1: "tw-text-[#E8D48A]",
    2: "tw-text-[#DDDDDD]",
    3: "tw-text-[#CD7F32]",
  };

  const getVoteStyle = (rank: number | null, isNegative: boolean) => {
    if (rank && rank <= 3) {
      return topThreeRankStyles[rank];
    }

    if (isNegative) {
      return "tw-bg-gradient-to-r tw-from-red tw-to-red tw-bg-clip-text tw-text-transparent";
    }

    return "tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-bg-clip-text tw-text-transparent";
  };

  const rankStyle = getVoteStyle(winner.place, isNegativeVote);

  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <div className="tw-flex tw-items-center tw-gap-2">
        <div className="tw-flex tw-items-center -tw-space-x-2">
          {winner.drop.top_raters.map((voter, index) => (
            <WaveWinnersDropHeaderVoter
              voter={voter}
              winner={winner}
              index={index}
              key={voter.profile.handle}
            />
          ))}
        </div>
        <span className="tw-text-iron-200 tw-font-semibold tw-text-sm">
          {formatNumberWithCommas(winner.drop.raters_count)}{" "}
          <span className="tw-text-iron-500 tw-font-normal">
            {winner.drop.raters_count === 1 ? "voter" : "voters"}
          </span>
        </span>
      </div>

      {hasUserVoted && (
        <div className="tw-flex tw-items-center tw-gap-1">
          <span className="tw-text-sm">
            <span className="tw-text-iron-400">{WAVE_VOTE_STATS_LABELS.YOUR_VOTES}: </span>
            <span className={`tw-font-semibold ${rankStyle}`}>
              {formatNumberWithCommas(userVote)}{" "}
              {WAVE_VOTING_LABELS[winner.drop.wave.voting_credit_type] ??
                winner.drop.wave.voting_credit_type}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
