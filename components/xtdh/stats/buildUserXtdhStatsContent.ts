import type { IdentityTdhStats } from "@/hooks/useIdentityTdhStats";

import { formatDisplay } from "./formatters";
import type { XtdhStatsProps } from "./XtdhStats";

export function buildUserXtdhStatsContent(data: IdentityTdhStats): XtdhStatsProps {
  const {
    tdhRate,
    xtdhMultiplier,
    xtdhRate,
    grantedXtdhPerDay,
    receivedXtdhRate,
    totalReceivedXtdh,
    totalGrantedXtdh,
  } = data;

  const hasAllocationMetrics =
    typeof xtdhRate === "number" && typeof grantedXtdhPerDay === "number";
  const availableValue = hasAllocationMetrics
    ? Math.max(xtdhRate - grantedXtdhPerDay, 0)
    : null;
  const rawPercentage = hasAllocationMetrics && xtdhRate > 0
    ? (grantedXtdhPerDay / xtdhRate) * 100
    : 0;
  const percentage = Math.min(Math.max(rawPercentage, 0), 100);

  const totalDisplay = formatDisplay(xtdhRate);
  const grantedDisplay = formatDisplay(grantedXtdhPerDay);
  const availableDisplay = formatDisplay(availableValue);

  return {
    metrics: {
      tdhRate: formatDisplay(tdhRate),
      multiplier: formatDisplay(xtdhMultiplier, 2),
      xtdhRate: formatDisplay(xtdhRate),
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
    receiving: {
      rate: formatDisplay(receivedXtdhRate),
      totalReceived: formatDisplay(totalReceivedXtdh),
      totalGranted: formatDisplay(totalGrantedXtdh),
    },
  };
}
