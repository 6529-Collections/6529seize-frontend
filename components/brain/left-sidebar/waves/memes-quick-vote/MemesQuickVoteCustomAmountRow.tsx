"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";
import clsx from "clsx";
import type { RefObject } from "react";

interface MemesQuickVoteCustomAmountRowProps {
  readonly allowsNegativeVotes: boolean;
  readonly customInputRef: RefObject<HTMLInputElement | null>;
  readonly customValue: string;
  readonly isCustomRowVisible: boolean;
  readonly isSubmitting: boolean;
  readonly isVoteFeedbackActive: boolean;
  readonly onCustomChange: (value: string) => void;
  readonly onCustomSubmit: () => void;
  readonly votingLabel: string | null;
}

export default function MemesQuickVoteCustomAmountRow({
  allowsNegativeVotes,
  customInputRef,
  customValue,
  isCustomRowVisible,
  isSubmitting,
  isVoteFeedbackActive,
  onCustomChange,
  onCustomSubmit,
  votingLabel,
}: MemesQuickVoteCustomAmountRowProps) {
  const locale = useBrowserLocale();
  const customAmountLabel = t(locale, "memes.quickVote.changeAmount");

  return (
    <label
      className={clsx(
        "tw-relative tw-flex tw-h-full tw-w-full tw-min-w-0 tw-overflow-hidden tw-rounded-full tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/50 tw-transition-colors focus-within:tw-border-primary-400 desktop-hover:hover:tw-border-iron-500",
        isSubmitting && "tw-cursor-not-allowed tw-opacity-60",
        isVoteFeedbackActive && "tw-border-success/30 tw-bg-success/10"
      )}
    >
      <span className="tw-sr-only">{customAmountLabel}</span>
      <input
        ref={customInputRef}
        type="text"
        aria-label={customAmountLabel}
        inputMode="numeric"
        pattern={allowsNegativeVotes ? "-?[0-9]*" : "[0-9]*"}
        value={customValue}
        disabled={isSubmitting}
        tabIndex={isCustomRowVisible ? undefined : -1}
        onChange={(event) => onCustomChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key !== "Enter") {
            return;
          }
          event.preventDefault();
          onCustomSubmit();
        }}
        className="tw-form-input tw-h-full tw-w-full tw-border-0 tw-bg-transparent tw-px-4 tw-pr-20 tw-text-base tw-font-semibold tw-text-iron-50 tw-outline-none tw-ring-0 focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-opacity-60"
      />
      <span className="tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 -tw-translate-y-1/2 tw-text-xs tw-font-semibold tw-text-iron-400">
        {votingLabel ?? t(locale, "memes.waveFooter.uncastPower.votes")}
      </span>
    </label>
  );
}
