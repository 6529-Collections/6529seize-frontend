"use client";

import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { formatNumber } from "@/i18n/format";

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
  const locale = useBrowserLocale();
  const getValueState = (n: number) => {
    if (n > 0) {
      return VALUE_STATE.POSITIVE;
    } else if (n < 0) {
      return VALUE_STATE.NEGATIVE;
    } else {
      return VALUE_STATE.NEUTRAL;
    }
  };

  const valueState = getValueState(value);
  const valueString = formatNumber(locale, value, {
    signDisplay: "exceptZero",
  });

  return (
    <div className="tw-flex tw-flex-wrap tw-items-baseline tw-gap-x-1.5 tw-gap-y-1">
      <span className="tw-text-xs tw-font-medium tw-text-iron-400">
        {title}
      </span>
      <span
        className={`${CLASSES[valueState]} tw-text-xs tw-font-semibold tw-tabular-nums`}
      >
        {valueString}
      </span>
    </div>
  );
}
