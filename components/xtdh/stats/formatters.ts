import { formatNumberWithCommas } from "@/helpers/Helpers";

import { UNAVAILABLE_LABEL } from "./constants";

export function formatDisplay(value: number | null | undefined, decimals = 0): string {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return UNAVAILABLE_LABEL;
  }

  const factor = 10 ** decimals;
  const roundedValue = Math.round(value * factor) / factor;
  return formatNumberWithCommas(roundedValue);
}
