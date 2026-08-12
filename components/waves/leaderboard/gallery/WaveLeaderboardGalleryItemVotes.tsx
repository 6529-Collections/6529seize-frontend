import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import ApprovalDropVoteSummary from "@/components/waves/drops/ApprovalDropVoteSummary";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { WAVE_VOTING_LABELS } from "@/helpers/waves/waves.constants";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

interface WaveLeaderboardGalleryItemVotesProps {
  readonly drop: ExtendedDrop;
  readonly variant?: "default" | "subtle" | undefined;
  readonly winningThreshold?: number | null | undefined;
  readonly winningThresholdMinDurationMs?: number | null | undefined;
  readonly isVotingClosed?: boolean | undefined;
  readonly emphasizeCurrent?: boolean | undefined;
}

export default function WaveLeaderboardGalleryItemVotes({
  drop,
  variant = "default",
  winningThreshold,
  winningThresholdMinDurationMs,
  isVotingClosed = false,
  emphasizeCurrent = false,
}: WaveLeaderboardGalleryItemVotesProps) {
  const locale = useBrowserLocale();
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
        emphasizeCurrent={emphasizeCurrent}
        subtle={variant === "subtle"}
      />
    );
  }

  const current = drop.rating;
  const isPositive = current >= 0;
  const projected = drop.rating_prediction;
  const votingLabel = WAVE_VOTING_LABELS[drop.wave.voting_credit_type];

  const getColorClass = () => {
    if (!isPositive) {
      return "tw-text-rose-400";
    }
    if (variant === "subtle") {
      return "tw-text-iron-200";
    }
    return "tw-text-emerald-500";
  };

  return (
    <div
      role="group"
      aria-label={t(locale, "waves.leaderboard.grid.voteSummary.standard", {
        current: formatInteger(locale, current),
        projected: formatInteger(locale, projected),
        unit: votingLabel,
      })}
      className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2"
    >
      <div
        aria-hidden="true"
        className="tw-flex tw-min-w-0 tw-flex-wrap tw-items-center tw-gap-2"
      >
        <span
          className={`tw-text-sm tw-font-semibold tw-tabular-nums ${getColorClass()}`}
        >
          {formatInteger(locale, current)}
        </span>
        <DropVoteProgressing
          current={current}
          projected={projected}
          projectedLabel={formatInteger(locale, projected)}
          subtle={variant === "subtle"}
          numberFont="sans"
          numberWeight="semibold"
        />
      </div>
    </div>
  );
}
