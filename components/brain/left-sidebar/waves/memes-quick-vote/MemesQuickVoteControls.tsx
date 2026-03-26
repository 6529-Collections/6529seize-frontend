"use client";

import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import MemesQuickVoteActionBar from "./MemesQuickVoteActionBar";
import MemesQuickVoteDropHeader from "./MemesQuickVoteDropHeader";

type VoteFeedbackSource = "custom-submit" | "quick-amount";

interface MemesQuickVoteControlsProps {
  readonly customValue: string;
  readonly drop: ExtendedDrop;
  readonly feedbackAmount: number | null;
  readonly feedbackSource: VoteFeedbackSource | null;
  readonly isCustomOpen: boolean;
  readonly isSubmitting: boolean;
  readonly isVoteFeedbackActive: boolean;
  readonly latestUsedAmount: number | null;
  readonly remainingCount: number;
  readonly quickAmounts: readonly number[];
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
  readonly onCustomChange: (value: string) => void;
  readonly onCustomSubmit: () => void;
  readonly onOpenCustom: () => void;
  readonly onSkip: () => void;
  readonly onVoteAmount: (amount: number) => void;
}

export default function MemesQuickVoteControls({
  customValue,
  drop,
  feedbackAmount,
  feedbackSource,
  isCustomOpen,
  isSubmitting,
  isVoteFeedbackActive,
  latestUsedAmount,
  remainingCount,
  quickAmounts,
  uncastPower,
  votingLabel,
  onCustomChange,
  onCustomSubmit,
  onOpenCustom,
  onSkip,
  onVoteAmount,
}: MemesQuickVoteControlsProps) {
  const title =
    drop.metadata.find((entry) => entry.data_key === "title")?.data_value ??
    "Untitled submission";
  const description =
    drop.metadata.find((entry) => entry.data_key === "description")
      ?.data_value ?? "";

  return (
    <div
      data-testid="quick-vote-controls-desktop-context"
      className="tw-flex tw-shrink-0 tw-flex-col tw-gap-0 md:tw-h-full md:tw-min-h-0 md:tw-overflow-hidden md:tw-bg-[#0a0a0a]/30"
    >
      <div className="tw-hidden tw-shrink-0 tw-flex-wrap tw-gap-2 tw-px-8 md:tw-flex md:tw-pb-6 md:tw-pt-6">
        <span className="tw-rounded-full tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.03] tw-px-4 tw-py-1.5 tw-text-[13px] tw-font-bold tw-text-iron-300 tw-shadow-sm tw-backdrop-blur-md">
          {formatNumberWithCommas(remainingCount)} unexplored
        </span>
      </div>

      <div className="tw-relative tw-hidden tw-min-h-0 tw-flex-1 md:tw-flex">
        <div className="tw-min-h-0 tw-flex-1 tw-overflow-y-auto tw-pb-16 [-ms-overflow-style:none] [scrollbar-width:none] md:tw-px-8 [&::-webkit-scrollbar]:tw-hidden">
          <div className="tw-flex tw-w-full tw-flex-col tw-gap-5">
            <MemesQuickVoteDropHeader drop={drop} />

            <div>
              <h2 className="tw-mb-3 tw-mt-4 tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-white md:tw-text-3xl">
                {title}
              </h2>

              {description && (
                <p className="tw-mb-0 tw-line-clamp-4 tw-text-sm tw-font-medium tw-leading-relaxed tw-text-iron-400 md:tw-text-md">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
        <div className="tw-pointer-events-none tw-absolute tw-inset-x-8 tw-bottom-0 tw-h-16 tw-bg-gradient-to-t tw-from-[#0a0a0a] tw-via-[#0a0a0a]/85 tw-to-transparent" />
      </div>

      <MemesQuickVoteActionBar
        customValue={customValue}
        feedbackAmount={feedbackAmount}
        feedbackSource={feedbackSource}
        isCustomOpen={isCustomOpen}
        isSubmitting={isSubmitting}
        isVoteFeedbackActive={isVoteFeedbackActive}
        latestUsedAmount={latestUsedAmount}
        quickAmounts={quickAmounts}
        uncastPower={uncastPower}
        votingLabel={votingLabel}
        onCustomChange={onCustomChange}
        onCustomSubmit={onCustomSubmit}
        onOpenCustom={onOpenCustom}
        onSkip={onSkip}
        onVoteAmount={onVoteAmount}
      />
    </div>
  );
}
