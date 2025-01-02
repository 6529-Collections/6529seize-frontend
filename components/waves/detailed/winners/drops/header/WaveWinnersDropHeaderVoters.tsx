import { formatNumberWithCommas } from "../../../../../../helpers/Helpers";
import { ExtendedDrop } from "../../../../../../helpers/waves/drop.helpers";
import WaveWinnersDropHeaderVoter from "./WaveWinnersDropHeaderVoter";

interface WaveWinnersDropHeaderVotersProps {
  readonly drop: ExtendedDrop;
}

export default function WaveWinnersDropHeaderVoters({
  drop,
}: WaveWinnersDropHeaderVotersProps) {
  const hasUserVoted =
    drop.context_profile_context?.rating !== undefined &&
    drop.context_profile_context?.rating !== 0;

  const userVote = drop.context_profile_context?.rating ?? 0;
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

  const rankStyle = getVoteStyle(drop.rank, isNegativeVote);

  return (
    <div className="tw-flex tw-items-center tw-gap-x-3">
      <div className="tw-flex -tw-space-x-1.5 tw-items-center">
        {drop.top_raters.map((voter, index) => (
          <WaveWinnersDropHeaderVoter
            voter={voter}
            drop={drop}
            index={index}
            key={voter.profile.handle}
          />
        ))}
      </div>
      <span className="tw-text-sm tw-text-iron-400">
        {formatNumberWithCommas(drop.raters_count)}{" "}
        {drop.raters_count === 1 ? "voter" : "voters"}
      </span>

      {hasUserVoted && (
        <div className="tw-flex tw-items-center tw-gap-1">
          <span className="tw-text-sm">
            <span className="tw-text-iron-400">Your vote: </span>
            <span className={`tw-font-semibold ${rankStyle}`}>
              {formatNumberWithCommas(userVote)} {drop.wave.voting_credit_type}
            </span>
          </span>
        </div>
      )}
    </div>
  );
}
