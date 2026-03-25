"use client";

import {
  AdjustmentsHorizontalIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import MemesWaveZapIcon from "@/components/brain/left-sidebar/waves/MemesWaveZapIcon";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import clsx from "clsx";

interface MemesQuickVoteActionBarProps {
  readonly customValue: string;
  readonly isCustomOpen: boolean;
  readonly isSubmitting: boolean;
  readonly latestUsedAmount: number | null;
  readonly quickAmounts: readonly number[];
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
  readonly onCustomChange: (value: string) => void;
  readonly onCustomSubmit: () => Promise<void>;
  readonly onOpenCustom: () => void;
  readonly onSkip: () => void;
  readonly onVoteAmount: (amount: number) => Promise<void>;
}

export default function MemesQuickVoteActionBar({
  customValue,
  isCustomOpen,
  isSubmitting,
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
  const hasQuickAmounts = quickAmounts.length > 0;
  const actionRailClassName =
    "tw-flex tw-h-12 tw-w-full tw-items-stretch tw-gap-2 tw-overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:tw-hidden sm:tw-h-[46px]";
  const quickActionButtonClassName =
    "tw-relative tw-inline-flex tw-h-full tw-min-w-[5.25rem] tw-flex-1 tw-basis-0 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-text-center disabled:tw-cursor-not-allowed disabled:tw-opacity-60 active:tw-scale-95";
  const customAmountLabel =
    customValue.trim().length > 0 && Number.parseInt(customValue, 10) > 0
      ? formatNumberWithCommas(Number.parseInt(customValue, 10))
      : null;

  return (
    <div className="tw-flex tw-flex-col tw-gap-3 tw-border-t tw-border-solid tw-border-white/5 tw-bg-[#0a0a0a]/95 tw-p-4 tw-pb-[calc(env(safe-area-inset-bottom,0px)+0.5rem)] tw-pt-3 tw-shadow-[0_-20px_40px_rgba(0,0,0,0.8)] tw-backdrop-blur-2xl sm:tw-relative sm:tw-z-20 sm:tw-shrink-0 sm:tw-border-0 sm:tw-bg-transparent sm:tw-p-0 sm:tw-px-8 sm:tw-pb-6 sm:tw-pt-0 sm:tw-shadow-none sm:tw-backdrop-blur-none">
      <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-rounded-xl sm:tw-border sm:tw-border-solid sm:tw-border-white/10 sm:tw-bg-white/[0.03] sm:tw-p-5 sm:tw-shadow-[0_20px_40px_rgba(0,0,0,0.18)] sm:tw-backdrop-blur-xl">
        <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-2 tw-px-1 sm:tw-flex-nowrap">
          <p className="tw-mb-0 tw-text-[11px] tw-font-bold tw-uppercase tw-tracking-widest tw-text-zinc-500">
            Quick Vote
          </p>
          {typeof uncastPower === "number" && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-zinc-400">
              <MemesWaveZapIcon className="tw-size-3.5 tw-flex-shrink-0 tw-fill-blue-400/20 tw-text-blue-400" />
              <span className="tw-text-[12px] tw-font-bold tw-tracking-wide">
                <span className="tw-text-primary-300 tw-text-zinc-400 sm:tw-text-zinc-300">
                  {formatNumberWithCommas(uncastPower)} {votingLabel ?? "votes"}{" "}
                  left
                </span>
              </span>
            </div>
          )}
        </div>

        {hasQuickAmounts && !isCustomOpen && (
          <div className={actionRailClassName}>
            {quickAmounts.map((amount) => {
              const isLatestUsed = latestUsedAmount === amount;

              return (
                <button
                  key={amount}
                  type="button"
                  onClick={() => {
                    void onVoteAmount(amount);
                  }}
                  disabled={isSubmitting}
                  className={clsx(
                    quickActionButtonClassName,
                    isLatestUsed
                      ? "tw-flex tw-flex-col tw-items-center tw-justify-center tw-gap-0.5 tw-border-blue-500/30 tw-bg-blue-500/15 tw-text-white tw-shadow-sm tw-transition-all desktop-hover:hover:tw-bg-blue-500/25"
                      : "tw-border-white/5 tw-bg-white/[0.03] tw-text-[14px] tw-font-bold tw-text-zinc-300 tw-shadow-sm tw-transition-colors desktop-hover:hover:tw-bg-white/[0.06] desktop-hover:hover:tw-text-white"
                  )}
                >
                  <span className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-leading-none">
                    <span
                      className={clsx(
                        "tw-leading-none",
                        isLatestUsed
                          ? "tw-mt-0.5 tw-text-[14px] tw-font-extrabold"
                          : "tw-font-bold"
                      )}
                    >
                      {formatNumberWithCommas(amount)}
                    </span>
                    {isLatestUsed && (
                      <span className="-tw-mb-1 tw-mt-0.5 tw-text-[8px] tw-font-bold tw-uppercase tw-leading-none tw-tracking-widest tw-text-blue-300/80">
                        Last used
                      </span>
                    )}
                  </span>
                </button>
              );
            })}

            <button
              type="button"
              aria-label="Custom amount"
              onClick={onOpenCustom}
              disabled={isSubmitting}
              className={clsx(
                quickActionButtonClassName,
                "tw-min-w-[7.5rem] tw-flex-[1.2] tw-gap-1.5 tw-border-white/5 tw-bg-white/[0.03] tw-text-zinc-400 tw-shadow-sm tw-transition-all desktop-hover:hover:tw-bg-white/[0.08] desktop-hover:hover:tw-text-white"
              )}
            >
              <AdjustmentsHorizontalIcon className="tw-size-[13px] tw-flex-shrink-0" />
              <span className="tw-text-[12px] tw-font-bold tw-uppercase tw-tracking-wider">
                Custom
              </span>
            </button>
          </div>
        )}

        {(!hasQuickAmounts || isCustomOpen) && (
          <div className="tw-h-12 sm:tw-h-[46px]">
            <div className="tw-flex tw-h-full tw-items-stretch tw-gap-2 sm:tw-items-end">
              <label className="tw-min-w-0 tw-flex-1">
                <span className="tw-sr-only">Custom amount</span>
                <div className="tw-relative">
                  <input
                    type="text"
                    aria-label="Custom amount"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={customValue}
                    autoFocus={hasQuickAmounts}
                    disabled={isSubmitting}
                    onChange={(event) => onCustomChange(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key !== "Enter") {
                        return;
                      }

                      event.preventDefault();
                      void onCustomSubmit();
                    }}
                    className="tw-form-input tw-h-12 tw-w-full tw-rounded-lg tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-4 tw-pr-20 tw-text-base tw-font-semibold tw-text-iron-50 tw-outline-none tw-transition-colors focus:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-500"
                  />
                  <span className="tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 -tw-translate-y-1/2 tw-text-[12px] tw-font-bold tw-text-zinc-500">
                    {votingLabel ?? "Votes"}
                  </span>
                </div>
              </label>

              <button
                type="button"
                aria-label={
                  customAmountLabel ? `Vote ${customAmountLabel}` : "Vote"
                }
                onClick={() => {
                  void onCustomSubmit();
                }}
                disabled={isSubmitting}
                className="tw-inline-flex tw-h-full tw-shrink-0 tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-xl tw-border-0 tw-bg-blue-600 tw-px-8 tw-text-[14px] tw-font-bold tw-tracking-wide tw-text-white tw-shadow-[0_0_20px_rgba(37,99,235,0.4)] tw-transition-all active:tw-scale-95 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-blue-500"
              >
                Vote
              </button>

              {hasQuickAmounts && (
                <button
                  type="button"
                  aria-label="Close custom amount"
                  onClick={onOpenCustom}
                  disabled={isSubmitting}
                  className="tw-inline-flex tw-h-full tw-w-[46px] tw-shrink-0 tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-white/5 tw-bg-white/5 tw-text-zinc-400 tw-transition-all active:tw-scale-95 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-white/10 desktop-hover:hover:tw-text-white"
                >
                  <XMarkIcon className="tw-size-5" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={onSkip}
        disabled={isSubmitting}
        className="tw-inline-flex tw-h-12 tw-w-full tw-items-center tw-justify-center tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.06] tw-px-5 tw-text-[14px] tw-font-bold tw-text-zinc-200 tw-shadow-sm tw-transition-all active:tw-scale-[0.98] disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-white/[0.1] desktop-hover:hover:tw-text-white sm:tw-h-[44px] sm:tw-text-[13px]"
      >
        Skip for now
      </button>
    </div>
  );
}
