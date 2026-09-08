"use client";

import MemesWaveZapIcon from "@/components/brain/left-sidebar/waves/MemesWaveZapIcon";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import useIsTouchDevice from "@/hooks/useIsTouchDevice";
import { formatInteger } from "@/i18n/format";
import { t } from "@/i18n/messages";
import {
  AdjustmentsHorizontalIcon,
  CheckIcon,
} from "@heroicons/react/24/outline";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import MemesQuickVoteCustomAmountRow from "./MemesQuickVoteCustomAmountRow";
import MemesQuickVoteQuickAmountsRow from "./MemesQuickVoteQuickAmountsRow";

type VoteFeedbackSource = "custom-submit" | "quick-amount";

export interface MemesQuickVoteActionBarProps {
  readonly customValue: string;
  readonly customVoteAmount: number | null;
  readonly feedbackAmount: number | null;
  readonly feedbackSource: VoteFeedbackSource | null;
  readonly isCustomOpen: boolean;
  readonly isSubmitting: boolean;
  readonly isVoteFeedbackActive: boolean;
  readonly latestUsedAmount: number | null;
  readonly quickAmounts: readonly number[];
  readonly allowsNegativeVotes: boolean;
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
  customVoteAmount,
  feedbackAmount,
  feedbackSource,
  isCustomOpen,
  isSubmitting,
  isVoteFeedbackActive,
  latestUsedAmount,
  quickAmounts,
  allowsNegativeVotes,
  uncastPower,
  votingLabel,
  onCustomChange,
  onCustomSubmit,
  onOpenCustom,
  onSkip,
  onVoteAmount,
}: MemesQuickVoteActionBarProps) {
  const locale = useBrowserLocale();
  const isTouchDevice = useIsTouchDevice();
  const hasQuickAmounts = quickAmounts.length > 0;
  const isCustomRowVisible = isCustomOpen;
  const usesCustomAmount = latestUsedAmount === null || isCustomOpen;
  const customInputRef = useRef<HTMLInputElement | null>(null);
  const previousCustomRowVisibleRef = useRef(isCustomRowVisible);
  const customAmountLabel =
    customVoteAmount === null ? null : formatInteger(locale, customVoteAmount);
  const recentVoteAmount = latestUsedAmount;
  const recentAmountLabel =
    typeof recentVoteAmount === "number"
      ? formatInteger(locale, recentVoteAmount)
      : null;
  const voteAmountLabel = usesCustomAmount
    ? customAmountLabel
    : recentAmountLabel;
  const voteLabel = voteAmountLabel
    ? t(locale, "memes.quickVote.voteAmount", { amount: voteAmountLabel })
    : t(locale, "memes.quickVote.vote");
  const showVoteFeedback =
    isVoteFeedbackActive &&
    (usesCustomAmount
      ? feedbackSource === "custom-submit"
      : feedbackSource === "quick-amount" &&
        feedbackAmount === recentVoteAmount);

  useEffect(() => {
    const wasCustomRowVisible = previousCustomRowVisibleRef.current;
    previousCustomRowVisibleRef.current = isCustomRowVisible;
    const justOpenedCustomRow = !wasCustomRowVisible && isCustomRowVisible;

    if (isTouchDevice || !justOpenedCustomRow || isSubmitting) {
      return;
    }
    customInputRef.current?.focus();
  }, [isTouchDevice, isCustomRowVisible, isSubmitting]);

  const handleToggleCustom = () => {
    if (isSubmitting) {
      return;
    }
    onOpenCustom();
  };

  const handleVote = () => {
    if (usesCustomAmount) {
      onCustomSubmit();
    } else if (typeof recentVoteAmount === "number") {
      onVoteAmount(recentVoteAmount);
    }
  };

  return (
    <div className="tw-relative tw-z-20 tw-shrink-0 tw-bg-[#0a0a0a] tw-px-5 tw-pt-2 md:tw-px-6">
      <div className="tw-mx-auto tw-flex tw-w-full tw-max-w-[26rem] tw-flex-col tw-gap-3 md:tw-max-w-[22rem]">
        <p className="tw-m-0 tw-flex tw-items-center tw-justify-center tw-gap-1.5 tw-text-sm tw-font-semibold tw-tabular-nums tw-text-iron-200">
          <MemesWaveZapIcon
            aria-hidden="true"
            className="tw-size-3.5 tw-shrink-0 tw-text-primary-400"
          />
          {t(locale, "memes.quickVote.remainingPower", {
            amount: formatInteger(locale, uncastPower),
            unit: votingLabel ?? t(locale, "memes.quickVote.unit"),
          })}
        </p>
        {(hasQuickAmounts || isCustomRowVisible) && (
          <div className="tw-relative tw-h-12 tw-overflow-hidden">
            {hasQuickAmounts && (
              <div
                aria-hidden={isCustomOpen}
                inert={isCustomOpen}
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
                  onVoteAmount={onVoteAmount}
                  quickAmounts={quickAmounts}
                />
              </div>
            )}
            <div
              aria-hidden={!isCustomRowVisible}
              className={clsx(
                "tw-absolute tw-inset-0 tw-h-full tw-w-full tw-transform-gpu tw-transition-all tw-duration-300 tw-ease-out motion-reduce:tw-transform-none motion-reduce:tw-transition-none",
                isCustomRowVisible
                  ? "tw-z-10 tw-scale-100 tw-opacity-100"
                  : "tw-pointer-events-none tw-z-0 tw-scale-[0.97] tw-opacity-0"
              )}
            >
              <MemesQuickVoteCustomAmountRow
                customInputRef={customInputRef}
                customValue={customValue}
                allowsNegativeVotes={allowsNegativeVotes}
                isCustomRowVisible={isCustomRowVisible}
                isSubmitting={isSubmitting}
                isVoteFeedbackActive={isVoteFeedbackActive}
                onCustomChange={onCustomChange}
                onCustomSubmit={onCustomSubmit}
                votingLabel={votingLabel}
              />
            </div>
          </div>
        )}

        <div className="tw-grid tw-grid-cols-[3.5rem_minmax(0,1fr)_minmax(3.5rem,auto)] tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/70 tw-p-1.5 tw-shadow-lg md:tw-grid-cols-[2.75rem_minmax(0,1fr)_minmax(2.75rem,auto)] md:tw-gap-1 md:tw-p-1">
          <button
            type="button"
            aria-label={
              isCustomOpen
                ? t(locale, "memes.quickVote.closeChangeAmount")
                : t(locale, "memes.quickVote.changeAmount")
            }
            aria-expanded={isCustomOpen}
            onClick={handleToggleCustom}
            disabled={isSubmitting}
            className={clsx(
              "tw-inline-flex tw-size-14 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 md:tw-size-11",
              isCustomOpen
                ? "tw-bg-white/[0.08] tw-text-primary-300"
                : "tw-bg-transparent tw-text-iron-400 desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-white"
            )}
          >
            <AdjustmentsHorizontalIcon
              aria-hidden="true"
              className="tw-size-5"
            />
          </button>
          <button
            type="button"
            onClick={handleVote}
            disabled={isSubmitting}
            className={clsx(
              "tw-inline-flex tw-min-h-14 tw-min-w-0 tw-items-center tw-justify-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-px-4 tw-text-base tw-font-bold tw-shadow-[0_4px_20px] tw-shadow-primary-600/20 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-300 focus-visible:tw-ring-offset-2 focus-visible:tw-ring-offset-iron-900 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 md:tw-min-h-11 md:tw-text-sm md:tw-font-semibold",
              showVoteFeedback
                ? "tw-border-success/40 tw-bg-success/15 tw-text-success"
                : "tw-border-primary-400/30 tw-bg-primary-600 tw-text-white desktop-hover:hover:tw-bg-primary-500"
            )}
          >
            {showVoteFeedback ? (
              <CheckIcon aria-hidden="true" className="tw-size-4 tw-shrink-0" />
            ) : (
              <MemesWaveZapIcon
                aria-hidden="true"
                className="tw-size-4 tw-shrink-0"
              />
            )}
            <span className="tw-truncate tw-tabular-nums">
              {showVoteFeedback
                ? t(locale, "memes.quickVote.voted")
                : voteLabel}
            </span>
          </button>
          <button
            type="button"
            onClick={onSkip}
            disabled={isSubmitting}
            className="tw-inline-flex tw-min-h-14 tw-items-center tw-justify-center tw-rounded-full tw-border-0 tw-bg-transparent tw-px-3 tw-text-sm tw-font-semibold tw-text-iron-400 tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-40 desktop-hover:hover:tw-bg-white/[0.05] desktop-hover:hover:tw-text-white md:tw-min-h-11"
          >
            {t(locale, "memes.quickVote.skip")}
          </button>
        </div>
      </div>
    </div>
  );
}
