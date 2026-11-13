"use client";

import RatingInput from "@/components/user/utils/rate/RatingInput";
import RatingInputSigns from "@/components/user/utils/rate/RatingInputSigns";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatInteger } from "@/i18n/format";
import clsx from "clsx";
import type { ComponentProps } from "react";
import { isRatingValue } from "./ratingsManagement";

type Props = ComponentProps<typeof RatingInput> & {
  readonly originalAmount: number;
};

/** The same editable amount in category panels and full contributor lists. */
export default function RatingAmountInput({
  originalAmount,
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
      {changeLabel && (
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
      <div className="tw-relative tw-h-11 tw-w-[140px] lg:tw-h-9 lg:tw-w-[136px]">
        <RatingInput
          {...props}
          value={value}
          inputMode="numeric"
          autoComplete="off"
          onFocus={onFocus}
          className={clsx(
            "tw-h-full tw-w-full tw-min-w-0 tw-rounded-lg tw-border-0 tw-bg-black/40 tw-pl-9 tw-pr-3 tw-text-right tw-text-base tw-font-medium tw-outline-none tw-ring-1 tw-ring-inset tw-ring-white/[0.08] hover:tw-ring-white/[0.18] focus:tw-shadow-[0_0_0_3px_#528BFF29] focus:tw-ring-primary-400/75 lg:tw-text-sm",
            negative && "tw-text-rose-400",
            !negative && changed && adjustmentColor,
            !negative && !changed && "tw-text-iron-100",
            className
          )}
        />
        <span
          aria-hidden="true"
          className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-left-2.5 tw-flex tw-items-center tw-text-iron-500"
        >
          <RatingInputSigns compact className="tw-translate-y-0.5" />
        </span>
      </div>
    </div>
  );
}
