"use client";

import MemesQuickVoteAmountButton from "./MemesQuickVoteAmountButton";

type VoteFeedbackSource = "custom-submit" | "quick-amount";

interface MemesQuickVoteQuickAmountsRowProps {
  readonly feedbackAmount: number | null;
  readonly feedbackSource: VoteFeedbackSource | null;
  readonly isSubmitting: boolean;
  readonly isVoteFeedbackActive: boolean;
  readonly latestUsedAmount: number | null;
  readonly onVoteAmount: (amount: number) => void;
  readonly quickAmounts: readonly number[];
}

export default function MemesQuickVoteQuickAmountsRow({
  feedbackAmount,
  feedbackSource,
  isSubmitting,
  isVoteFeedbackActive,
  latestUsedAmount,
  onVoteAmount,
  quickAmounts,
}: MemesQuickVoteQuickAmountsRowProps) {
  return (
    <div className="tw-flex tw-h-12 tw-w-full tw-items-stretch tw-gap-1.5 tw-overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] sm:tw-gap-2 [&::-webkit-scrollbar]:tw-hidden">
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
    </div>
  );
}
