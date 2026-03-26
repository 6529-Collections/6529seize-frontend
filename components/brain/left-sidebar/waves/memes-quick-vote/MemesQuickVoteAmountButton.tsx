"use client";

import { formatNumberWithCommas } from "@/helpers/Helpers";
import { CheckIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";

type VoteFeedbackSource = "custom-submit" | "quick-amount";

interface MemesQuickVoteAmountButtonProps {
  readonly amount: number;
  readonly feedbackAmount: number | null;
  readonly feedbackSource: VoteFeedbackSource | null;
  readonly isLatestUsed: boolean;
  readonly isSubmitting: boolean;
  readonly isVoteFeedbackActive: boolean;
  readonly onVoteAmount: (amount: number) => void;
}

export default function MemesQuickVoteAmountButton({
  amount,
  feedbackAmount,
  feedbackSource,
  isLatestUsed,
  isSubmitting,
  isVoteFeedbackActive,
  onVoteAmount,
}: MemesQuickVoteAmountButtonProps) {
  const isQuickVoteFeedbackTarget =
    isVoteFeedbackActive &&
    feedbackSource === "quick-amount" &&
    feedbackAmount === amount;
  let buttonToneClassName =
    "tw-border-white/5 tw-bg-white/[0.03] tw-text-[14px] tw-font-bold tw-text-zinc-300 tw-shadow-sm tw-transition-colors desktop-hover:hover:tw-bg-white/[0.06] desktop-hover:hover:tw-text-white";

  if (isQuickVoteFeedbackTarget) {
    buttonToneClassName =
      "tw-border-emerald-500/35 tw-bg-emerald-500/15 tw-text-emerald-100 tw-shadow-[0_0_20px_rgba(16,185,129,0.15)]";
  } else if (isLatestUsed) {
    buttonToneClassName =
      "tw-border-blue-500/30 tw-bg-blue-500/15 tw-text-primary-300 tw-shadow-sm tw-transition-all desktop-hover:hover:tw-bg-blue-500/25 desktop-hover:hover:tw-text-primary-200";
  }

  return (
    <button
      type="button"
      onClick={() => {
        onVoteAmount(amount);
      }}
      disabled={isSubmitting}
      className={clsx(
        "tw-relative tw-inline-flex tw-h-full tw-min-w-14 tw-flex-none tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-text-center active:tw-scale-95 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 sm:tw-min-w-[4.5rem] sm:tw-flex-1 sm:tw-basis-0 lg:tw-min-w-14 lg:tw-flex-none",
        buttonToneClassName,
        isVoteFeedbackActive && !isQuickVoteFeedbackTarget && "tw-opacity-40"
      )}
    >
      {isQuickVoteFeedbackTarget ? (
        <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-font-bold tw-leading-none">
          <CheckIcon className="tw-size-4 tw-shrink-0" />
          <span>{formatNumberWithCommas(amount)}</span>
        </span>
      ) : (
        <span
          className={clsx(
            "tw-font-bold tw-leading-none",
            isLatestUsed && "tw-text-primary-300"
          )}
        >
          {formatNumberWithCommas(amount)}
        </span>
      )}
    </button>
  );
}
