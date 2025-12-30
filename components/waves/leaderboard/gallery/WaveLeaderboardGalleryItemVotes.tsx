import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface WaveLeaderboardGalleryItemVotesProps {
  readonly drop: ExtendedDrop;
  readonly variant?: 'default' | 'subtle';
}

export default function WaveLeaderboardGalleryItemVotes({
  drop,
  variant = 'default',
}: WaveLeaderboardGalleryItemVotesProps) {
  const current = drop.rating ?? 0;
  const isPositive = current >= 0;
  
  const getColorClass = () => {
    if (variant === "subtle") {
      return "tw-text-iron-200";
    }
    return isPositive ? "tw-text-emerald-500" : "tw-text-rose-500";
  };

  return (
    <div className="tw-flex tw-items-center tw-gap-2">
      <span className={`tw-text-sm tw-font-mono tw-font-bold ${getColorClass()}`}>
        {formatNumberWithCommas(current)}
      </span>
      <DropVoteProgressing
        current={current}
        projected={drop.rating_prediction}
        subtle={variant === 'subtle'}
      />
    </div>
  );
}
