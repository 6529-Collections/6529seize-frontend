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
}: {
  readonly value: number;
  readonly title: string;
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
    <div className="tw-flex tw-items-center tw-gap-1.5 tw-px-2 tw-py-1.5 tw-bg-iron-800/50 tw-border tw-border-solid tw-border-iron-700/50 tw-rounded">
      <span className="tw-text-xs tw-text-iron-400 tw-font-medium">
        {title}
      </span>
      <span className={`${CLASSES[valueState]} tw-text-xs tw-font-bold`}>
        {valueString}
      </span>
    </div>
  );
}
