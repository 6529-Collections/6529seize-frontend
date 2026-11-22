export const RATING_CONTRIBUTOR_ROW_CLASS =
  "tw-flex tw-min-h-12 tw-min-w-0 tw-items-center tw-gap-2.5 tw-rounded-xl tw-bg-white/[0.035] tw-px-3 tw-py-1.5";

export const RATING_CONTRIBUTOR_IDENTITY_CLASS =
  "tw-group/rating-contributor tw-flex tw-min-h-11 tw-min-w-0 tw-flex-1 tw-items-center tw-gap-2.5 tw-text-sm tw-font-medium tw-text-iron-100 tw-no-underline hover:tw-text-iron-400 lg:tw-min-h-9";

export const RATING_CONTRIBUTOR_NAME_CLASS =
  "tw-truncate tw-transition-colors group-hover/rating-contributor:tw-text-iron-400 group-focus-visible/rating-contributor:tw-text-iron-400";

export const RATING_CONTRIBUTOR_AMOUNT_CLASS =
  "tw-shrink-0 tw-text-right tw-text-sm tw-font-medium";

/** Totals use their own sign; signed adjustments describe the change separately. */
export function getRatingTotalColor(amount: number | null): string {
  if (amount === null || !Number.isFinite(amount) || amount === 0)
    return "tw-text-iron-100";
  return amount < 0 ? "tw-text-rose-400" : "tw-text-emerald-400";
}
