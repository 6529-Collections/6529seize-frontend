import { ApiWaveDecisionWinner } from "../../../../../generated/models/ApiWaveDecisionWinner";

interface WaveWinnersDropHeaderRankProps {
  readonly winner: ApiWaveDecisionWinner;
}

export default function WaveWinnersDropHeaderRank({
  winner,
}: WaveWinnersDropHeaderRankProps) {
  if (!winner.place) return null;

  // Convert place to number
  const rankNumber = 
    typeof winner.place === "string"
      ? parseInt(winner.place, 10)
      : winner.place;

  // Get rank text (1st, 2nd, 3rd, etc.)
  let rankText = "";
  switch (rankNumber) {
    case 1:
      rankText = "1st";
      break;
    case 2:
      rankText = "2nd";
      break;
    case 3:
      rankText = "3rd";
      break;
    default:
      rankText = `${rankNumber}th`;
  }

  // Classes for each rank
  let rankClasses = "";

  switch (rankNumber) {
    case 1:
      rankClasses = "tw-text-[#fbbf24] tw-bg-[rgba(251,191,36,0.1)] tw-border-[rgba(251,191,36,0.4)]";
      break;
    case 2:
      rankClasses = "tw-text-[#94a3b8] tw-bg-[rgba(148,163,184,0.1)] tw-border-[rgba(148,163,184,0.4)]";
      break;
    case 3:
      rankClasses = "tw-text-[#CD7F32] tw-bg-[rgba(205,127,50,0.1)] tw-border-[rgba(205,127,50,0.4)]";
      break;
    default:
      rankClasses = "tw-text-[#848490] tw-bg-[rgba(96,96,108,0.1)] tw-border-[rgba(96,96,108,0.4)]";
  }

  return (
    <div
      className={`tw-flex tw-items-center tw-rounded-md tw-font-medium tw-whitespace-nowrap -tw-mt-0.5 tw-border ${rankClasses}`}
    >
      <span className="tw-px-2 tw-py-0.5 tw-text-xs tw-flex tw-items-center">
        {rankText}
      </span>
    </div>
  );
}
