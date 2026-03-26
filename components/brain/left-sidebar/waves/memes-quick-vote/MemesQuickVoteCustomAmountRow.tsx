"use client";

import { CheckIcon, XMarkIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import type { RefObject } from "react";

type VoteFeedbackSource = "custom-submit" | "quick-amount";

const CUSTOM_AMOUNT_CONTROL_LABEL = "Change vote amount";

interface MemesQuickVoteCustomAmountRowProps {
  readonly customAmountLabel: string | null;
  readonly customInputRef: RefObject<HTMLInputElement | null>;
  readonly customValue: string;
  readonly feedbackSource: VoteFeedbackSource | null;
  readonly hasQuickAmounts: boolean;
  readonly isCustomRowVisible: boolean;
  readonly isSubmitting: boolean;
  readonly isVoteFeedbackActive: boolean;
  readonly onCustomChange: (value: string) => void;
  readonly onCustomSubmit: () => void;
  readonly onToggleCustom: () => void;
  readonly votingLabel: string | null;
}

export default function MemesQuickVoteCustomAmountRow({
  customAmountLabel,
  customInputRef,
  customValue,
  feedbackSource,
  hasQuickAmounts,
  isCustomRowVisible,
  isSubmitting,
  isVoteFeedbackActive,
  onCustomChange,
  onCustomSubmit,
  onToggleCustom,
  votingLabel,
}: MemesQuickVoteCustomAmountRowProps) {
  return (
    <div className="tw-flex tw-h-full tw-items-stretch tw-gap-1.5 sm:tw-gap-2">
      <label
        className={clsx(
          "tw-relative tw-flex tw-h-full tw-w-full tw-min-w-0 tw-flex-1 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-black tw-transition-colors desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:focus-within:tw-border-primary-400",
          isSubmitting && "tw-cursor-not-allowed tw-opacity-60",
          isVoteFeedbackActive
            ? "tw-border-emerald-500/30 tw-bg-[#06110d]"
            : "focus-within:tw-border-primary-400"
        )}
      >
        <span className="tw-sr-only">{CUSTOM_AMOUNT_CONTROL_LABEL}</span>
        <div className="tw-relative tw-h-full tw-w-full">
          <input
            ref={customInputRef}
            type="text"
            aria-label={CUSTOM_AMOUNT_CONTROL_LABEL}
            inputMode="numeric"
            pattern="[0-9]*"
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
            className="tw-form-input tw-h-full tw-w-full tw-border-0 tw-bg-transparent tw-px-3 tw-pr-16 tw-text-base tw-font-semibold tw-text-iron-50 tw-outline-none tw-ring-0 focus:tw-ring-0 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 sm:tw-px-4 sm:tw-pr-20"
          />
          <span className="tw-pointer-events-none tw-absolute tw-right-3 tw-top-1/2 -tw-translate-y-1/2 tw-text-xs tw-font-bold tw-text-iron-500 sm:tw-right-4">
            {votingLabel ?? "Votes"}
          </span>
        </div>
      </label>

      <button
        type="button"
        aria-label={customAmountLabel ? `Vote ${customAmountLabel}` : "Vote"}
        onClick={() => {
          onCustomSubmit();
        }}
        disabled={isSubmitting}
        tabIndex={isCustomRowVisible ? undefined : -1}
        className={clsx(
          "tw-inline-flex tw-h-full tw-shrink-0 tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-xl tw-px-5 tw-text-sm tw-font-bold tw-tracking-wide tw-transition-all active:tw-scale-95 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 sm:tw-px-6 md:tw-px-4 lg:tw-px-6",
          isVoteFeedbackActive && feedbackSource === "custom-submit"
            ? "tw-scale-[1.02] tw-border tw-border-solid tw-border-emerald-500/40 tw-bg-emerald-500/15 tw-text-emerald-100 tw-shadow-[0_0_20px_rgba(16,185,129,0.18)]"
            : "tw-border-0 tw-bg-primary-600 tw-text-white tw-shadow-[0_12px_24px_rgba(37,99,235,0.28)] desktop-hover:hover:tw-bg-primary-500"
        )}
      >
        {isVoteFeedbackActive && feedbackSource === "custom-submit" ? (
          <span className="tw-inline-flex tw-items-center tw-gap-1.5">
            <CheckIcon className="tw-size-4 tw-shrink-0" />
            <span>Voted</span>
          </span>
        ) : (
          "Vote"
        )}
      </button>

      {hasQuickAmounts && (
        <button
          type="button"
          aria-label={`Close ${CUSTOM_AMOUNT_CONTROL_LABEL.toLowerCase()}`}
          onClick={onToggleCustom}
          disabled={isSubmitting}
          tabIndex={isCustomRowVisible ? undefined : -1}
          className="tw-inline-flex tw-h-full tw-w-11 tw-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.06] tw-text-iron-400 tw-transition-all active:tw-scale-95 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-white sm:tw-w-12"
        >
          <XMarkIcon className="tw-size-5 tw-flex-shrink-0" />
        </button>
      )}
    </div>
  );
}
