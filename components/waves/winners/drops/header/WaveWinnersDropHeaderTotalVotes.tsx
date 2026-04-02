import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import {
  WAVE_VOTING_LABELS,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";

interface WaveWinnersDropHeaderTotalVotesProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderTotalVotes({
  winner,
}: WaveWinnersDropHeaderTotalVotesProps) {
  const voteStyle =
    winner.drop.rating < 0 ? "tw-text-rose-400" : "tw-text-iron-50";

  return (
    <div className="tw-flex tw-items-center tw-gap-x-2 tw-text-sm tw-leading-5">
      <span className={`tw-font-medium ${voteStyle}`}>
        {formatNumberWithCommas(winner.drop.rating)}
      </span>
      <span className="tw-whitespace-nowrap tw-font-normal tw-text-iron-400">
        {WAVE_VOTING_LABELS[winner.drop.wave.voting_credit_type]}{" "}
        {WAVE_VOTE_STATS_LABELS.TOTAL}
      </span>
    </div>
  );
}
