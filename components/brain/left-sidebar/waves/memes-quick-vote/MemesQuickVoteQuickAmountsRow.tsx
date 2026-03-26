"use client";

import { AdjustmentsHorizontalIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import MemesQuickVoteAmountButton from "./MemesQuickVoteAmountButton";

type VoteFeedbackSource = "custom-submit" | "quick-amount";

const CUSTOM_AMOUNT_CONTROL_LABEL = "Change vote amount";

interface MemesQuickVoteQuickAmountsRowProps {
  readonly feedbackAmount: number | null;
  readonly feedbackSource: VoteFeedbackSource | null;
  readonly isSubmitting: boolean;
  readonly isVoteFeedbackActive: boolean;
  readonly latestUsedAmount: number | null;
  readonly onOpenCustom: () => void;
  readonly onVoteAmount: (amount: number) => void;
  readonly quickAmounts: readonly number[];
}

export default function MemesQuickVoteQuickAmountsRow({
  feedbackAmount,
  feedbackSource,
  isSubmitting,
  isVoteFeedbackActive,
  latestUsedAmount,
  onOpenCustom,
  onVoteAmount,
  quickAmounts,
}: MemesQuickVoteQuickAmountsRowProps) {
  return (
    <div className="tw-flex tw-h-11 tw-w-full tw-items-stretch tw-gap-1.5 tw-overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:tw-h-12 sm:tw-gap-2 md:tw-h-12 [&::-webkit-scrollbar]:tw-hidden">
      {quickAmounts.map((amount) => (
        <MemesQuickVoteAmountButton
          key={amount}
          amount={amount}
          feedbackAmount={feedbackAmount}
          feedbackSource={feedbackSource}
          isLatestUsed={latestUsedAmount === amount}
          isSubmitting={isSubmitting}
          isVoteFeedbackActive={isVoteFeedbackActive}
          onVoteAmount={onVoteAmount}
        />
      ))}

      <button
        type="button"
        aria-label={CUSTOM_AMOUNT_CONTROL_LABEL}
        onClick={onOpenCustom}
        disabled={isSubmitting}
        className={clsx(
          "sm:tw:flex-[1.4] sm:tw:min-w-[9.5rem] sm:tw:px-4 lg:tw:min-w-14 lg:tw:flex-none tw-relative tw-inline-flex tw-h-full tw-min-w-14 tw-flex-none tw-items-center tw-justify-center tw-gap-1 tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-white/[0.03] tw-px-3 tw-text-center tw-text-zinc-400 tw-shadow-sm tw-transition-all active:tw-scale-95 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-white/[0.08] desktop-hover:hover:tw-text-white sm:tw-gap-1.5",
          isVoteFeedbackActive && "tw-opacity-40"
        )}
      >
        <AdjustmentsHorizontalIcon className="tw-size-4 tw-flex-shrink-0" />
        <span className="sm:tw:text-[13px] tw-whitespace-nowrap tw-text-[12px] tw-font-bold tw-tracking-tight">
          {CUSTOM_AMOUNT_CONTROL_LABEL}
        </span>
      </button>
    </div>
  );
}
