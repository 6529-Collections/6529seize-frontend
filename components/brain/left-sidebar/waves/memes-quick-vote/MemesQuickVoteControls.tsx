"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import MemesQuickVoteActionBar, {
  type MemesQuickVoteActionBarProps,
} from "./MemesQuickVoteActionBar";
import MemesQuickVoteDescription from "./MemesQuickVoteDescription";
import MemesQuickVoteDropHeader from "./MemesQuickVoteDropHeader";

interface MemesQuickVoteControlsProps extends MemesQuickVoteActionBarProps {
  readonly drop: ExtendedDrop;
  readonly leftThisRoundCount: number;
  readonly unratedCount: number;
}

export default function MemesQuickVoteControls({
  drop,
  leftThisRoundCount,
  unratedCount,
  ...actionBarProps
}: MemesQuickVoteControlsProps) {
  const locale = useBrowserLocale();
  const title =
    drop.metadata.find((entry) => entry.data_key === "title")?.data_value ??
    t(locale, "memes.quickVote.untitledSubmission");
  const description =
    drop.metadata.find((entry) => entry.data_key === "description")
      ?.data_value ?? "";

  return (
    <div
      data-testid="quick-vote-controls-desktop-context"
      className="tw-relative tw-flex tw-shrink-0 tw-flex-col tw-pb-[max(env(safe-area-inset-bottom,0px),1rem)] md:tw-h-full md:tw-min-h-0 md:tw-pb-5"
    >
      <div className="tw-hidden tw-shrink-0 tw-pb-5 tw-pl-6 tw-pr-20 tw-pt-6 md:tw-block">
        <div className="tw-flex tw-min-h-11 tw-flex-wrap tw-items-center tw-gap-x-3 tw-gap-y-1 tw-text-xs tw-tabular-nums tw-leading-4">
          <span className="tw-font-semibold tw-text-iron-300">
            {t(locale, "memes.quickVote.leftThisRound", {
              count: formatInteger(locale, leftThisRoundCount),
            })}
          </span>
          <span aria-hidden="true" className="tw-text-iron-500">
            ·
          </span>
          <span className="tw-text-iron-400">
            {t(locale, "memes.quickVote.unrated", {
              count: formatInteger(locale, unratedCount),
            })}
          </span>
        </div>
      </div>

      <div className="tw-hidden tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-px-6 tw-pb-6 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/60 md:tw-block">
        <MemesQuickVoteDropHeader drop={drop} />
        <h2 className="tw-mb-3 tw-mt-5 tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-white">
          {title}
        </h2>
        {description && (
          <MemesQuickVoteDescription key={drop.id} description={description} />
        )}
      </div>

      <MemesQuickVoteActionBar {...actionBarProps} />
    </div>
  );
}
