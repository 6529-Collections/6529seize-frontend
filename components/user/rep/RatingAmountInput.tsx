"use client";

import RatingInput from "@/components/user/utils/rate/RatingInput";
import RatingInputSigns from "@/components/user/utils/rate/RatingInputSigns";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import clsx from "clsx";
import type { ComponentProps } from "react";
import { isRatingValue } from "./ratingsManagement";
import { getRatingTotalColor } from "./ratingContributorStyles";

type Props = ComponentProps<typeof RatingInput> & {
  readonly originalAmount: number;
  readonly showAdjustment?: boolean;
  readonly subtle?: boolean;
};

/** The same editable amount in category panels and full contributor lists. */
export default function RatingAmountInput({
  originalAmount,
  showAdjustment = true,
  subtle = false,
  value,
  onFocus,
  className,
  ...props
}: Props) {
  const locale = useBrowserLocale();
  const valid = isRatingValue(value);
  const amount = Number(value);
  const delta = amount - originalAmount;
  const changed = valid && delta !== 0;
  const negative = valid && amount < 0;
  const adjustmentColor =
    delta < 0 ? "tw-text-rose-400" : "tw-text-emerald-400";
  const sign = delta < 0 ? "−" : "+";
  const changeLabel = changed
    ? `${sign}${formatInteger(locale, Math.abs(delta))}`
    : null;

  return (
    <div className="tw-flex tw-shrink-0 tw-items-center tw-gap-2">
      {showAdjustment && changeLabel && (
        <span
          title={changeLabel}
          className={clsx(
            "tw-max-w-20 tw-truncate tw-text-xs tw-font-medium",
            adjustmentColor
          )}
        >
          {changeLabel}
        </span>
      )}
      <div
        className={clsx(
          "tw-relative tw-h-11 tw-rounded-lg lg:tw-h-9 lg:tw-w-[136px]",
          subtle ? "tw-w-[136px]" : "tw-w-[140px]",
          subtle &&
            "tw-border tw-border-solid tw-border-white/10 tw-bg-white/[0.03] tw-transition-colors tw-duration-150 focus-within:tw-border-white/30"
        )}
      >
        <RatingInput
          {...props}
          value={value}
          inputMode="text"
          autoComplete="off"
          onFocus={onFocus}
          className={clsx(
            "tw-h-full tw-w-full tw-min-w-0 tw-rounded-lg tw-border-0 tw-pl-9 tw-pr-3 tw-text-right tw-text-base tw-font-medium tw-outline-none lg:tw-text-sm",
            subtle
              ? "tw-bg-transparent tw-text-iron-100 focus:tw-ring-0"
              : "tw-bg-black/40 tw-ring-1 tw-ring-inset tw-ring-white/[0.08] hover:tw-ring-white/[0.18] focus:tw-shadow-[0_0_0_3px_#528BFF29] focus:tw-ring-primary-400/75",
            !subtle && (negative || changed) && getRatingTotalColor(amount),
            !subtle && !negative && !changed && "tw-text-iron-100",
            className
          )}
        />
        <span
          aria-hidden="true"
          className={clsx(
            "tw-pointer-events-none tw-absolute tw-inset-y-0 tw-flex tw-items-center",
            subtle
              ? "tw-left-0 tw-w-[34px] tw-justify-center tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-white/[0.08] tw-text-iron-400"
              : "tw-left-2.5 tw-text-iron-500"
          )}
        >
          <RatingInputSigns compact className="tw-translate-y-0.5" />
        </span>
      </div>
    </div>
  );
}
