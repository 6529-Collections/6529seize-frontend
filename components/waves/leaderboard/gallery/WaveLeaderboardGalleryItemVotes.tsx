import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import ApprovalDropVoteSummary from "@/components/waves/drops/ApprovalDropVoteSummary";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";

interface WaveLeaderboardGalleryItemVotesProps {
  readonly drop: ExtendedDrop;
  readonly variant?: "default" | "subtle" | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
}

export default function WaveLeaderboardGalleryItemVotes({
  drop,
  variant = "default",
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
}: WaveLeaderboardGalleryItemVotesProps) {
  const displayWinningThreshold =
    typeof winningThreshold === "number" &&
    Number.isFinite(winningThreshold) &&
    winningThreshold > 0
      ? winningThreshold
      : null;
  if (displayWinningThreshold !== null) {
    return (
      <ApprovalDropVoteSummary
        drop={drop}
        winningThreshold={displayWinningThreshold}
        winningThresholdMinDurationMs={winningThresholdMinDurationMs}
        isVotingClosed={isVotingClosed}
        variant="compact"
        showVoters={false}
        showUserVote={false}
        subtle={variant === "subtle"}
      />
    );
  }

  const current = drop.rating;
  const isPositive = current >= 0;

  const getColorClass = () => {
    if (variant === "subtle") {
      return "tw-text-iron-200";
    }
    return isPositive ? "tw-text-emerald-500" : "tw-text-rose-500";
  };

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
      <span
        className={`tw-font-mono tw-text-sm tw-font-bold ${getColorClass()}`}
      >
        {formatNumberWithCommas(current)}
      </span>
      <DropVoteProgressing
        current={current}
        projected={drop.rating_prediction}
        subtle={variant === "subtle"}
      />
    </div>
  );
}
