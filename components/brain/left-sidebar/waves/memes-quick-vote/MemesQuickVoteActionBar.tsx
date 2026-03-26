"use client";

import MemesWaveZapIcon from "@/components/brain/left-sidebar/waves/MemesWaveZapIcon";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import useHasTouchInput from "@/hooks/useHasTouchInput";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import MemesQuickVoteCustomAmountRow from "./MemesQuickVoteCustomAmountRow";
import MemesQuickVoteQuickAmountsRow from "./MemesQuickVoteQuickAmountsRow";

type VoteFeedbackSource = "custom-submit" | "quick-amount";

interface MemesQuickVoteActionBarProps {
  readonly customValue: string;
  readonly feedbackAmount: number | null;
  readonly feedbackSource: VoteFeedbackSource | null;
  readonly isCustomOpen: boolean;
  readonly isSubmitting: boolean;
  readonly isVoteFeedbackActive: boolean;
  readonly latestUsedAmount: number | null;
  readonly quickAmounts: readonly number[];
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
  readonly onCustomChange: (value: string) => void;
  readonly onCustomSubmit: () => void;
  readonly onOpenCustom: () => void;
  readonly onSkip: () => void;
  readonly onVoteAmount: (amount: number) => void;
}

export default function MemesQuickVoteActionBar({
  customValue,
  feedbackAmount,
  feedbackSource,
  isCustomOpen,
  isSubmitting,
  isVoteFeedbackActive,
  latestUsedAmount,
  quickAmounts,
  uncastPower,
  votingLabel,
  onCustomChange,
  onCustomSubmit,
  onOpenCustom,
  onSkip,
  onVoteAmount,
}: MemesQuickVoteActionBarProps) {
  const hasTouchInput = useHasTouchInput();
  const hasQuickAmounts = quickAmounts.length > 0;
  const isCustomRowVisible = !hasQuickAmounts || isCustomOpen;
  const customInputRef = useRef<HTMLInputElement | null>(null);
  const previousCustomRowVisibleRef = useRef(isCustomRowVisible);
  const customAmountLabel =
    customValue.trim().length > 0 && Number.parseInt(customValue, 10) > 0
      ? formatNumberWithCommas(Number.parseInt(customValue, 10))
      : null;

  useEffect(() => {
    const wasCustomRowVisible = previousCustomRowVisibleRef.current;
    previousCustomRowVisibleRef.current = isCustomRowVisible;

    const justOpenedCustomRow = !wasCustomRowVisible && isCustomRowVisible;

    if (
      hasTouchInput ||
      !hasQuickAmounts ||
      !justOpenedCustomRow ||
      isSubmitting
    ) {
      return;
    }

    customInputRef.current?.focus();
  }, [hasQuickAmounts, hasTouchInput, isCustomRowVisible, isSubmitting]);

  const handleToggleCustom = () => {
    if (isSubmitting) {
      return;
    }

    onOpenCustom();
  };

  return (
    <div className="tw-relative tw-bg-[linear-gradient(180deg,rgba(10,10,12,0.68),rgba(10,10,12,0.94))] tw-px-3 tw-pb-[calc(env(safe-area-inset-bottom,0px)+0.375rem)] tw-pt-1.5 tw-backdrop-blur-[28px] sm:tw-pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] sm:tw-pt-2 md:tw-relative md:tw-z-20 md:tw-shrink-0 md:tw-p-0 md:tw-px-8 md:tw-pb-6 md:tw-pt-0">
      <div className="tw-relative tw-z-10 tw-flex tw-flex-col tw-gap-2 sm:tw-gap-3">
        <div className="tw-flex tw-flex-col tw-gap-2 tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-3 tw-shadow-[inset_0_1px_0_rgba(255,255,255,0.04),0_12px_28px_rgba(0,0,0,0.22)] sm:tw-gap-3 sm:tw-p-4 md:tw-p-5 md:tw-shadow-[0_20px_40px_rgba(0,0,0,0.18)]">
          <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-1.5 tw-px-0.5 sm:tw-gap-2 sm:tw-px-1 md:tw-flex-nowrap">
            <p className="tw-mb-0 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-iron-500">
              Quick Vote
            </p>

            {typeof uncastPower === "number" && (
              <div className="tw-inline-flex tw-items-center tw-gap-1.5 tw-px-0.5 tw-py-0.5 tw-text-iron-300 sm:tw-gap-2 sm:tw-py-1">
                <MemesWaveZapIcon className="tw-size-3.5 tw-flex-shrink-0 tw-fill-primary-400/20 tw-text-primary-400" />
                <span className="tw-text-xs tw-font-bold tw-tracking-wide">
                  <span className="tw-text-iron-300">
                    {formatNumberWithCommas(uncastPower)}{" "}
                    {votingLabel ?? "votes"} remaining
                  </span>
                </span>
              </div>
            )}
          </div>

          <div className="tw-relative tw-h-11 tw-overflow-hidden sm:tw-h-12 md:tw-h-12">
            {hasQuickAmounts && (
              <div
                aria-hidden={isCustomOpen}
                className={clsx(
                  "tw-absolute tw-inset-0 tw-h-full tw-w-full tw-transform-gpu tw-transition-all tw-duration-300 tw-ease-out motion-reduce:tw-transform-none motion-reduce:tw-transition-none",
                  isCustomOpen
                    ? "tw-pointer-events-none tw-z-0 tw-scale-[0.97] tw-opacity-0"
                    : "tw-z-10 tw-scale-100 tw-opacity-100"
                )}
              >
                <MemesQuickVoteQuickAmountsRow
                  feedbackAmount={feedbackAmount}
                  feedbackSource={feedbackSource}
                  isSubmitting={isSubmitting}
                  isVoteFeedbackActive={isVoteFeedbackActive}
                  latestUsedAmount={latestUsedAmount}
                  onOpenCustom={handleToggleCustom}
                  onVoteAmount={onVoteAmount}
                  quickAmounts={quickAmounts}
                />
              </div>
            )}

            <div
              aria-hidden={hasQuickAmounts ? !isCustomOpen : undefined}
              className={clsx(
                "tw-absolute tw-inset-0 tw-h-full tw-w-full tw-transform-gpu tw-transition-all tw-duration-300 tw-ease-out motion-reduce:tw-transform-none motion-reduce:tw-transition-none",
                !hasQuickAmounts || isCustomOpen ? "tw-z-10" : "tw-z-0",
                !hasQuickAmounts || isCustomOpen
                  ? "tw-scale-100 tw-opacity-100"
                  : "tw-pointer-events-none tw-scale-[0.97] tw-opacity-0"
              )}
            >
              <MemesQuickVoteCustomAmountRow
                customAmountLabel={customAmountLabel}
                customInputRef={customInputRef}
                customValue={customValue}
                feedbackSource={feedbackSource}
                hasQuickAmounts={hasQuickAmounts}
                isCustomRowVisible={isCustomRowVisible}
                isSubmitting={isSubmitting}
                isVoteFeedbackActive={isVoteFeedbackActive}
                onCustomChange={onCustomChange}
                onCustomSubmit={onCustomSubmit}
                onToggleCustom={handleToggleCustom}
                votingLabel={votingLabel}
              />
            </div>
          </div>
        </div>

        <button
          type="button"
          onClick={onSkip}
          disabled={isSubmitting}
          className="tw-inline-flex tw-h-11 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-px-5 tw-text-sm tw-font-bold tw-text-iron-200 tw-shadow-[0_10px_24px_rgba(0,0,0,0.18)] tw-transition-all tw-duration-200 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-900 desktop-hover:hover:tw-bg-iron-900 sm:tw-h-12"
        >
          Skip
        </button>
      </div>
    </div>
  );
}
