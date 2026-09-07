import React from "react";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import DropVoteProgressing from "@/components/drops/view/utils/DropVoteProgressing";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";

interface MyStreamWaveMyVoteVotesProps {
  readonly drop: ExtendedDrop;
  readonly winningThreshold?: number | null | undefined;
}

const MyStreamWaveMyVoteVotes: React.FC<MyStreamWaveMyVoteVotesProps> = ({
  drop,
  winningThreshold,
}) => {
  const locale = useBrowserLocale();
  const voteClass = drop.rating >= 0 ? "tw-text-emerald-500" : "tw-text-rose-400";
  const hasWinningThreshold =
    typeof winningThreshold === "number" && winningThreshold > 0;

  return (
    <div className="tw-flex tw-min-h-6 tw-items-center tw-gap-x-1.5 tw-text-sm tw-leading-6">
      <span className="tw-text-iron-400">
        {t(locale, "waves.myVotes.total")}
      </span>
      <span className={`tw-font-semibold tw-tabular-nums ${voteClass}`}>
        {formatInteger(locale, drop.rating)}
      </span>

      <DropVoteProgressing
        current={drop.rating}
        projected={
          hasWinningThreshold ? drop.realtime_rating : drop.rating_prediction
        }
        projectedLabel={formatInteger(
          locale,
          hasWinningThreshold ? drop.realtime_rating : drop.rating_prediction
        )}
        tooltipLabel={
          hasWinningThreshold
            ? t(locale, "waves.myVotes.votesGivenNow")
            : t(locale, "waves.myVotes.projectedAtDecision")
        }
        subtle={true}
        visualVariant="memes"
        numberFont="sans"
        numberSize="sm"
        numberWeight="semibold"
        numberTracking="normal"
      />
    </div>
  );
};

export default MyStreamWaveMyVoteVotes;
