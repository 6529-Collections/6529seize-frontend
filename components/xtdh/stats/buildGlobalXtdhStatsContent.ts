import type { GlobalTdhStats } from "@/hooks/useGlobalTdhStats";

import { formatStatFloor } from "@/helpers/Helpers";
import type { XtdhStatsProps } from "./XtdhStats";

export function buildGlobalXtdhStatsContent(data: GlobalTdhStats): XtdhStatsProps {
  const {
    tdhRate,
    xtdhMultiplier,
    xtdhRate,
    grantedXtdhRate,
  } = data;

  const hasAllocationMetrics =
    typeof xtdhRate === "number" && typeof grantedXtdhRate === "number";
  const availableValue = hasAllocationMetrics
    ? Math.max(xtdhRate - grantedXtdhRate, 0)
    : null;
  const rawPercentage = hasAllocationMetrics && xtdhRate > 0
    ? (grantedXtdhRate / xtdhRate) * 100
    : 0;
  const percentage = Math.min(Math.max(rawPercentage, 0), 100);

  const totalDisplay = formatStatFloor(xtdhRate);
  const grantedDisplay = formatStatFloor(grantedXtdhRate);
  const availableDisplay = formatStatFloor(availableValue);

  return {
    metrics: {
      multiplier: formatStatFloor(xtdhMultiplier, 2),
      producedXtdhRate: totalDisplay,
    },
    allocation: {
      total: totalDisplay,
      granted: grantedDisplay,
      available: availableDisplay,
      percentage,
      ariaValueText: hasAllocationMetrics
        ? `${grantedDisplay} out of ${totalDisplay} xTDH rate granted, ${availableDisplay} available`
        : "Allocation data unavailable",
    },
  };
}
