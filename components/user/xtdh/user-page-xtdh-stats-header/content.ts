import { formatNumberWithCommas } from "@/helpers/Helpers";
import type { XtdhStatsResponse } from "@/types/xtdh";

import { UNAVAILABLE_LABEL } from "./constants";
import type {
  IdentityTdhStatsData,
  StatsContent,
} from "./types";

type StatsResponseSubset = Pick<
  XtdhStatsResponse,
  "dailyCapacity" | "xtdhRateGranted" | "xtdhRateAutoAccruing"
>;

export function buildStatsContent(
  data: IdentityTdhStatsData & Partial<StatsResponseSubset>,
): StatsContent {
  const xtdhRate =
    typeof data.dailyCapacity === "number"
      ? data.dailyCapacity
      : data.xtdhRate;
  const baseTdhRate = data.baseTdhRate;
  const multiplier = data.xtdhMultiplier;
  const xtdhRateGranted =
    typeof data.xtdhRateGranted === "number"
      ? data.xtdhRateGranted
      : data.grantedXtdhPerDay;
  const xtdhRateAutoAccruing =
    typeof data.xtdhRateAutoAccruing === "number"
      ? data.xtdhRateAutoAccruing
      : 0;
  const hasAllocationMetrics =
    typeof xtdhRate === "number" && typeof xtdhRateGranted === "number";
  const xtdhRateAvailable = hasAllocationMetrics
    ? Math.max(xtdhRate - xtdhRateGranted - xtdhRateAutoAccruing, 0)
    : null;
  const grantingPercentage =
    hasAllocationMetrics && xtdhRate > 0 ? (xtdhRateGranted / xtdhRate) * 100 : 0;
  const clampedPercentage = Math.min(Math.max(grantingPercentage, 0), 100);

  const baseRateDisplay = formatDisplay(baseTdhRate);
  const multiplierDisplay = formatDisplay(multiplier, 2);
  const xtdhRateDisplay = formatDisplay(xtdhRate);
  const grantedDisplay = hasAllocationMetrics
    ? formatDisplay(xtdhRateGranted)
    : UNAVAILABLE_LABEL;
  const availableDisplay = hasAllocationMetrics
    ? formatDisplay(xtdhRateAvailable)
    : UNAVAILABLE_LABEL;
  const totalReceivedDisplay = formatDisplay(data.totalReceivedXtdh);
  const totalGrantedDisplay = formatDisplay(data.totalGrantedXtdh);
  const progressAriaValueText = hasAllocationMetrics
    ? `${grantedDisplay} out of ${xtdhRateDisplay} xTDH rate granted, ${availableDisplay} available`
    : "Allocation data unavailable";

  return {
    baseMetricCards: [
      {
        id: "base-tdh-rate",
        label: "Base TDH Rate",
        tooltip: "Daily TDH generation from Memes cards and Gradients",
        value: baseRateDisplay,
        suffix: "/day",
      },
      {
        id: "xtdh-multiplier",
        label: "Multiplier",
        tooltip: "Current xTDH multiplier applied to your Base TDH Rate",
        value: multiplierDisplay,
        suffix: "x",
      },
      {
        id: "xtdh-rate",
        label: "xTDH Rate",
        tooltip: "Total xTDH you can generate per day (Base TDH Rate × Multiplier)",
        value: xtdhRateDisplay,
        suffix: "/day",
      },
    ],
    allocation: {
      grantedDisplay,
      totalDisplay: xtdhRateDisplay,
      availableDisplay,
      percentage: clampedPercentage,
      ariaValueText: progressAriaValueText,
    },
    receiving: {
      rateDisplay: UNAVAILABLE_LABEL,
      totalReceivedDisplay,
      totalGrantedDisplay,
    },
  };
}

function formatDisplay(value: number | null | undefined, decimals = 0) {
  if (typeof value !== "number" || Number.isNaN(value)) {
    return UNAVAILABLE_LABEL;
  }

  const factor = 10 ** decimals;
  const roundedValue = Math.round(value * factor) / factor;
  return formatNumberWithCommas(roundedValue);
}
