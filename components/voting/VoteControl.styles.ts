export type VoteControlVariant = "default" | "compact";

export const VOTE_NUMERIC_INPUT_BASE_CLASS =
  "tw-block tw-w-full tw-min-w-0 tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-900 tw-py-0 tw-font-semibold tw-tabular-nums tw-text-iron-100 [appearance:textfield] focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-primary-400 [&::-webkit-inner-spin-button]:tw-appearance-none [&::-webkit-outer-spin-button]:tw-appearance-none";

export const VOTE_NUMERIC_UNIT_CLASS =
  "tw-pointer-events-none tw-absolute tw-top-1/2 -tw-translate-y-1/2 tw-text-xs tw-text-iron-400";

export const VOTE_INPUT_AREA_CLASSES = {
  default: "tw-min-h-20",
  compact: "tw-min-h-20",
} as const;

export const VOTE_NUMERIC_INPUT_CLASSES = {
  default: "tw-h-11 tw-text-base sm:desktop-hover:tw-text-sm",
  compact:
    "tw-h-9 tw-text-[13px] touch-only:tw-h-11 touch-only:tw-text-base max-sm:tw-h-11 max-sm:tw-text-base",
} as const;
