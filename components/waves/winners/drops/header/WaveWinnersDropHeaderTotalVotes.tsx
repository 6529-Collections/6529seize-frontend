import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { WAVE_VOTING_LABELS, WAVE_VOTE_STATS_LABELS } from "@/helpers/waves/waves.constants";

interface WaveWinnersDropHeaderTotalVotesProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderTotalVotes({
  winner,
}: WaveWinnersDropHeaderTotalVotesProps) {
  const topThreeRankStyles: { [key: number]: string } = {
    1: "tw-text-[#E8D48A]",
    2: "tw-text-[#DDDDDD]",
    3: "tw-text-[#CD7F32]",
  };

  const getVoteStyle = (rank: number | null, rating: number) => {
    if (rank && rank <= 3) {
      return topThreeRankStyles[rank];
    }

    if (rating >= 0) {
      return "tw-bg-gradient-to-r tw-from-emerald-400 tw-to-emerald-500 tw-bg-clip-text tw-text-transparent";
    }

    return "tw-bg-gradient-to-r tw-from-rose-400 tw-to-rose-500 tw-bg-clip-text tw-text-transparent";
  };

  const style = getVoteStyle(winner.place, winner.drop.rating);

  return (
    <div className="tw-flex tw-items-baseline tw-gap-x-2">
      <span className={`tw-font-bold tw-text-sm ${style}`}>
        {formatNumberWithCommas(winner.drop.rating)}
      </span>
      <span className="tw-text-sm tw-text-iron-500 tw-whitespace-nowrap">
        {WAVE_VOTING_LABELS[winner.drop.wave.voting_credit_type]} {WAVE_VOTE_STATS_LABELS.TOTAL}
      </span>
    </div>
  );
}
