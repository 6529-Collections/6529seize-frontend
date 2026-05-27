import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import { formatApprovalCountdownTime } from "@/helpers/waves/approve-wave.helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useApprovalDropStatus } from "@/hooks/waves/useApprovalDropStatus";

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
  const approvalStatus = useApprovalDropStatus({
    drop,
    isClosed: isVotingClosed,
    winningThreshold: displayWinningThreshold,
    winningThresholdMinDurationMs,
  });
  const current = approvalStatus.current;
  const isPositive = current >= 0;

  const getColorClass = () => {
    if (variant === "subtle") {
      return "tw-text-iron-200";
    }
    return isPositive ? "tw-text-emerald-500" : "tw-text-rose-500";
  };

  const approvalStatusLabel = (() => {
    if (displayWinningThreshold === null) {
      return null;
    }

    if (approvalStatus.kind === "approved") {
      return "Approved";
    }

    if (approvalStatus.kind === "approving") {
      return `Approving in ${formatApprovalCountdownTime(
        approvalStatus.countdownMs ?? 0
      )}`;
    }

    if (approvalStatus.kind === "reached_threshold") {
      return "Reached threshold";
    }

    if (approvalStatus.kind === "closed") {
      return "Closed";
    }

    return `Needs ${formatNumberWithCommas(approvalStatus.remaining ?? 0)}`;
  })();

  const approvalStatusClass = (() => {
    if (
      approvalStatus.kind === "approved" ||
      approvalStatus.kind === "approving" ||
      approvalStatus.kind === "reached_threshold"
    ) {
      return "tw-text-emerald-400";
    }

    if (approvalStatus.kind === "closed") {
      return "tw-text-amber-300";
    }

    return variant === "subtle" ? "tw-text-iron-400" : "tw-text-iron-300";
  })();

  return (
    <div className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2">
      <span
        className={`tw-font-mono tw-text-sm tw-font-bold ${getColorClass()}`}
      >
        {formatNumberWithCommas(current)}
      </span>
      {displayWinningThreshold !== null ? (
        <>
          <span className="tw-font-mono tw-text-sm tw-font-bold tw-text-iron-500">
            /
          </span>
          <span className="tw-font-mono tw-text-sm tw-font-bold tw-text-iron-200">
            {formatNumberWithCommas(displayWinningThreshold)}
          </span>
        </>
      ) : null}
      <DropVoteProgressing
        current={current}
        projected={drop.rating_prediction}
        subtle={variant === "subtle"}
      />
      {approvalStatusLabel !== null ? (
        <span
          className={`tw-whitespace-nowrap tw-text-xs tw-font-medium ${approvalStatusClass}`}
        >
          {approvalStatusLabel}
        </span>
      ) : null}
    </div>
  );
}
