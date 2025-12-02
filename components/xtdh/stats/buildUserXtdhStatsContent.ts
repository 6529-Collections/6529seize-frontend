import type { IdentityTdhStats } from "@/hooks/useIdentityTdhStats";
import { formatStatFloor } from "@/helpers/Helpers";

import { formatDisplay } from "./formatters";
import type { XtdhStatsProps } from "./XtdhStats";

export function buildUserXtdhStatsContent(data: IdentityTdhStats): XtdhStatsProps {
  const {
    tdhRate,
    xtdhMultiplier,
    producedXtdhRate,
    grantedXtdhPerDay,
    receivedXtdhRate,
    totalReceivedXtdh,
    totalGrantedXtdh,
  } = data;

  const hasAllocationMetrics =
    typeof producedXtdhRate === "number" && typeof grantedXtdhPerDay === "number";
  const availableValue = hasAllocationMetrics
    ? Math.max(producedXtdhRate - grantedXtdhPerDay, 0)
    : null;
  const rawPercentage = hasAllocationMetrics && producedXtdhRate > 0
    ? (grantedXtdhPerDay / producedXtdhRate) * 100
    : 0;
  const percentage = Math.min(Math.max(rawPercentage, 0), 100);

  const totalDisplay = formatDisplay(producedXtdhRate);
  const grantedDisplay = formatDisplay(grantedXtdhPerDay);
  const availableDisplay = formatDisplay(availableValue);

  return {
    metrics: {
      multiplier: formatDisplay(xtdhMultiplier, 2),
      producedXtdhRate: formatStatFloor(producedXtdhRate),
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
