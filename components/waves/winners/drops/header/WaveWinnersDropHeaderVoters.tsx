import type { ApiWaveDecisionWinner } from "@/generated/models/ApiWaveDecisionWinner";
import ParticipationDropVoteDetailsTrigger from "@/components/waves/drops/participation/ratings/ParticipationDropVoteDetailsTrigger";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import WaveWinnersDropHeaderVoter from "./WaveWinnersDropHeaderVoter";
import {
  WAVE_VOTING_LABELS,
  WAVE_VOTE_STATS_LABELS,
} from "@/helpers/waves/waves.constants";

interface WaveWinnersDropHeaderVotersProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderVoters({
  winner,
}: WaveWinnersDropHeaderVotersProps) {
  const userVote = winner.drop.context_profile_context?.rating ?? 0;
  const hasUserVoted = userVote !== 0;
  const isNegativeVote = userVote < 0;
  const userVoteClass = isNegativeVote ? "tw-text-rose-400" : "tw-text-iron-50";
  const hasTopRaters = winner.drop.top_raters.length > 0;

  return (
    <div className="tw-flex tw-items-center tw-gap-x-4 tw-gap-y-2">
      <div className="tw-flex tw-items-center tw-gap-2 tw-whitespace-nowrap tw-text-sm tw-leading-5">
        {hasTopRaters && (
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
        )}
        <ParticipationDropVoteDetailsTrigger drop={winner.drop} />
      </div>

      {hasUserVoted && (
        <div className="tw-flex tw-items-center tw-gap-1.5 tw-text-sm tw-leading-5">
          <span className="tw-whitespace-nowrap">
            <span className="tw-font-normal tw-text-iron-400">
              {WAVE_VOTE_STATS_LABELS.YOUR_VOTES}:{" "}
            </span>
            <span className={`tw-font-medium ${userVoteClass}`}>
              {formatNumberWithCommas(userVote)}{" "}
              {WAVE_VOTING_LABELS[winner.drop.wave.voting_credit_type]}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
