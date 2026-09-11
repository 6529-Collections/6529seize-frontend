import { formatOrdinal } from "@/helpers/format.helpers";

interface MemesLeaderboardDropRankProps {
  readonly rank: number | null;
}

const getRankColorClass = (rank: number): string => {
  switch (rank) {
    case 1:
      return "tw-text-amber-400";
    case 2:
      return "tw-text-iron-300";
    case 3:
      return "tw-text-amber-600";
    default:
      return "tw-text-iron-500";
  }
};

export default function MemesLeaderboardDropRank({
  rank,
}: MemesLeaderboardDropRankProps) {
  if (rank === null || !Number.isFinite(rank)) {
    return null;
  }

  const normalizedRank = Math.trunc(rank);
  if (normalizedRank <= 0) {
    return null;
  }

  const rankText = formatOrdinal(normalizedRank);

  return (
    <div
      className={`tw-flex tw-h-10 tw-w-fit tw-flex-shrink-0 tw-items-center ${getRankColorClass(
        normalizedRank
      )}`}
    >
      <span className="tw-sr-only">Rank {rankText}</span>
      <span
        aria-hidden="true"
        className="tw-text-sm tw-font-semibold tw-leading-none"
      >
        {rankText}
      </span>
    </div>
  );
}
