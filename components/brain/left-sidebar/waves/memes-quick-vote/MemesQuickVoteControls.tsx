"use client";

import type { ExtendedDrop } from "@/helpers/waves/drop.helpers";
import { formatNumberWithCommas } from "@/helpers/Helpers";
import WaveDropAuthorPfp from "@/components/waves/drops/WaveDropAuthorPfp";
import WaveDropTime from "@/components/waves/drops/time/WaveDropTime";
import clsx from "clsx";

interface MemesQuickVoteControlsProps {
  readonly customValue: string;
  readonly drop: ExtendedDrop;
  readonly isCustomOpen: boolean;
  readonly isSubmitting: boolean;
  readonly latestUsedAmount: number | null;
  readonly remainingCount: number;
  readonly quickAmounts: readonly number[];
  readonly uncastPower: number | null;
  readonly votingLabel: string | null;
  readonly onCustomChange: (value: string) => void;
  readonly onCustomSubmit: () => Promise<void>;
  readonly onOpenCustom: () => void;
  readonly onSkip: () => void;
  readonly onVoteAmount: (amount: number) => Promise<void>;
}

export default function MemesQuickVoteControls({
  customValue,
  drop,
  isCustomOpen,
  isSubmitting,
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
  const hasQuickAmounts = quickAmounts.length > 0;
  const title =
    drop.metadata.find((entry) => entry.data_key === "title")?.data_value ??
    "Untitled submission";
  const description =
    drop.metadata.find((entry) => entry.data_key === "description")
      ?.data_value ?? "";
  const authorLabel = drop.author.handle ?? drop.author.primary_address;
  const customAmountLabel =
    customValue.trim().length > 0 && Number.parseInt(customValue, 10) > 0
      ? formatNumberWithCommas(Number.parseInt(customValue, 10))
      : null;

  return (
    <div className="tw-flex tw-flex-col tw-gap-4">
      <div
        data-testid="quick-vote-controls-desktop-context"
        className="tw-hidden tw-flex-col tw-gap-4 md:tw-flex"
      >
        <div className="tw-flex tw-flex-wrap tw-gap-2">
          {typeof uncastPower === "number" && (
            <span className="tw-rounded-full tw-border tw-border-solid tw-border-primary-500/30 tw-bg-primary-500/10 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-primary-300">
              {formatNumberWithCommas(uncastPower)} {votingLabel ?? "votes"}{" "}
              left
            </span>
          )}
          <span className="tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-300">
            {formatNumberWithCommas(remainingCount)} left
          </span>
        </div>

        <div className="tw-rounded-[1.75rem] tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900/70 tw-p-5">
          <div className="tw-flex tw-items-center tw-gap-3">
            <WaveDropAuthorPfp drop={drop} />
            <div className="tw-min-w-0 tw-flex-1">
              <div className="tw-flex tw-items-center tw-gap-2">
                <span className="tw-truncate tw-text-sm tw-font-semibold tw-text-iron-100">
                  {authorLabel}
                </span>
                <span className="tw-size-1 tw-flex-shrink-0 tw-rounded-full tw-bg-iron-700" />
                <span className="tw-text-xs tw-text-iron-500">
                  <WaveDropTime timestamp={drop.created_at} />
                </span>
              </div>
              <p className="tw-mb-0 tw-mt-1 tw-truncate tw-text-xs tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                {drop.wave.name}
              </p>
            </div>
          </div>

          <h2 className="tw-mb-0 tw-mt-4 tw-text-[1.65rem] tw-font-semibold tw-leading-tight tw-text-white">
            {title}
          </h2>

          {description && (
            <p
              className="tw-mb-0 tw-mt-3 tw-text-sm tw-leading-6 tw-text-iron-300"
              style={{
                display: "-webkit-box",
                WebkitBoxOrient: "vertical",
                WebkitLineClamp: 4,
                overflow: "hidden",
              }}
            >
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="tw-flex tw-items-center tw-justify-between">
        <div>
          <p className="tw-mb-1 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.14em] tw-text-iron-500">
            Quick Vote
          </p>
          <p className="tw-mb-0 tw-text-sm tw-text-iron-300">
            Tap once to vote. Skip keeps it for later.
          </p>
        </div>
        {hasQuickAmounts && (
          <button
            type="button"
            onClick={onOpenCustom}
            disabled={isSubmitting}
            className="tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-900 tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-iron-200 tw-transition-colors disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-800"
          >
            Custom amount
          </button>
        )}
      </div>

      {hasQuickAmounts && (
        <div className="tw-flex tw-flex-wrap tw-gap-2">
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
                  "tw-inline-flex tw-items-center tw-gap-2 tw-rounded-full tw-border tw-border-solid tw-px-3 tw-py-2 tw-text-sm tw-font-semibold tw-transition-all",
                  isLatestUsed
                    ? "tw-border-primary-400/50 tw-bg-primary-500/15 tw-text-primary-300"
                    : "tw-border-iron-700 tw-bg-iron-900 tw-text-iron-200 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-800",
                  isSubmitting && "tw-cursor-not-allowed tw-opacity-60"
                )}
              >
                <span>{formatNumberWithCommas(amount)}</span>
                {isLatestUsed && (
                  <span className="tw-rounded-full tw-bg-primary-500/20 tw-px-2 tw-py-0.5 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-primary-300">
                    Last used
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {(!hasQuickAmounts || isCustomOpen) && (
        <div className="tw-rounded-3xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900/80 tw-p-4">
          <div className="tw-flex tw-flex-col tw-gap-3 sm:tw-flex-row sm:tw-items-end">
            <label className="tw-min-w-0 tw-flex-1">
              <span className="tw-mb-2 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                Custom amount
              </span>
              <div className="tw-relative">
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  value={customValue}
                  disabled={isSubmitting}
                  onChange={(event) => onCustomChange(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key !== "Enter") {
                      return;
                    }

                    event.preventDefault();
                    void onCustomSubmit();
                  }}
                  className="tw-h-12 tw-w-full tw-rounded-2xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-950 tw-px-4 tw-pr-20 tw-text-base tw-font-semibold tw-text-iron-50 tw-outline-none tw-transition-colors focus:tw-border-primary-400 disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-500"
                />
                <span className="tw-pointer-events-none tw-absolute tw-right-4 tw-top-1/2 -tw-translate-y-1/2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-500">
                  {votingLabel ?? "Votes"}
                </span>
              </div>
            </label>

            <button
              type="button"
              onClick={() => {
                void onCustomSubmit();
              }}
              disabled={isSubmitting}
              className="tw-inline-flex tw-h-12 tw-shrink-0 tw-items-center tw-justify-center tw-whitespace-nowrap tw-rounded-2xl tw-border tw-border-solid tw-border-primary-500 tw-bg-primary-500 tw-px-5 tw-text-sm tw-font-semibold tw-text-white tw-transition-colors disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-bg-primary-600"
            >
              {customAmountLabel ? `Vote ${customAmountLabel}` : "Vote"}
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={onSkip}
        disabled={isSubmitting}
        className="tw-inline-flex tw-h-12 tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-solid tw-border-iron-700 tw-bg-transparent tw-px-5 tw-text-sm tw-font-semibold tw-text-iron-300 tw-transition-colors disabled:tw-cursor-not-allowed disabled:tw-opacity-60 desktop-hover:hover:tw-border-iron-500 desktop-hover:hover:tw-bg-iron-900"
      >
        Skip for now
      </button>
    </div>
  );
}
