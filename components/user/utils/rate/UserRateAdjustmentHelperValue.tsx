"use client";

import { useEffect, useState } from "react";
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

export default function UserRateAdjustmentHelperValue({
  value,
  title,
  layout = "stacked",
}: {
  readonly value: number;
  readonly title: string;
  readonly layout?: "stacked" | "inline";
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

  const [valueState, setValueState] = useState(getValueState(value));
  const [valueString, setValueString] = useState(getValueString(value));

  useEffect(() => {
    setValueState(getValueState(value));
    setValueString(getValueString(value));
  }, [value]);

  return (
    <div
      className={`tw-flex ${layout === "inline" ? "tw-items-center tw-gap-1.5" : "tw-flex-col tw-items-center tw-gap-1"}`}
    >
      <span className="tw-text-xs tw-text-iron-400 tw-font-normal">
        {title}
      </span>
      <span className={`${CLASSES[valueState]} tw-text-sm tw-font-medium tw-tabular-nums`}>
        {valueString}
      </span>
    </div>
  );
}
