"use client";

import { formatNumberWithCommas } from "@/helpers/Helpers";

enum VALUE_STATE {
  POSITIVE = "POSITIVE",
  NEGATIVE = "NEGATIVE",
  NEUTRAL = "NEUTRAL",
}

const CLASSES: Record<VALUE_STATE, string> = {
  [VALUE_STATE.POSITIVE]: "tw-text-green",
  [VALUE_STATE.NEGATIVE]: "tw-text-red",
  [VALUE_STATE.NEUTRAL]: "tw-text-iron-50",
};

const ADJUSTMENT_CLASSES: Record<VALUE_STATE, string> = {
  [VALUE_STATE.POSITIVE]: "tw-text-emerald-400",
  [VALUE_STATE.NEGATIVE]: "tw-text-rose-400",
  [VALUE_STATE.NEUTRAL]: "tw-text-iron-100",
};

export default function UserRateAdjustmentHelperValue({
  value,
  title,
  layout = "stacked",
  variant = "default",
}: {
  readonly value: number;
  readonly title: string;
  readonly layout?: "stacked" | "inline";
  readonly variant?: "default" | "current" | "adjustment";
}) {
  const getValueState = (n: number) => {
    if (n > 0) {
      return VALUE_STATE.POSITIVE;
    } else if (n < 0) {
      return VALUE_STATE.NEGATIVE;
    } else {
      return VALUE_STATE.NEUTRAL;
    }
  };

  const getValueString = (n: number) =>
    n > 0 ? `+${formatNumberWithCommas(n)}` : `${formatNumberWithCommas(n)}`;

  const valueState = getValueState(value);
  const valueString = getValueString(value);
  const isSummary = variant !== "default";
  let valueClassName = CLASSES[valueState];
  if (variant === "current") valueClassName = "tw-text-iron-100";
  if (variant === "adjustment") valueClassName = ADJUSTMENT_CLASSES[valueState];
  let layoutClassName =
    layout === "inline"
      ? "tw-items-center tw-gap-1.5"
      : "tw-flex-col tw-items-center tw-gap-1";
  if (isSummary) {
    layoutClassName =
      "tw-min-w-0 tw-flex-wrap tw-items-baseline tw-gap-x-1.5 tw-gap-y-0.5";
  }

  return (
    <div
      className={`tw-flex ${layoutClassName} ${variant === "adjustment" ? "tw-justify-end tw-text-right" : ""}`}
    >
      <span
        className={`tw-text-xs tw-font-normal ${isSummary ? "tw-text-iron-500" : "tw-text-iron-400"}`}
      >
        {title}
      </span>
      <span
        className={`${valueClassName} tw-whitespace-nowrap tw-font-medium ${isSummary ? "tw-text-xs" : "tw-text-sm"}`}
      >
        {valueString}
      </span>
    </div>
  );
}
