"use client";

import { useEffect, useState } from "react";
import { formatNumberWithCommas } from "../../../../helpers/Helpers";

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
    <div className="tw-space-x-1.5">
      <span className="tw-text-sm tw-text-iron-300 tw-font-normal">
        {title}
      </span>
      <span className={`${CLASSES[valueState]} tw-text-sm tw-font-semibold `}>
        {valueString}
      </span>
    </div>
  );
}
