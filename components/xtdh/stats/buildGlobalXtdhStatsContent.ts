import type { ApiTdhGlobalStats } from "@/generated/models/ApiTdhGlobalStats";

import { formatDisplay } from "./formatters";
import type { XtdhStatsProps } from "./XtdhStats";

export function buildGlobalXtdhStatsContent(data: ApiTdhGlobalStats): XtdhStatsProps {
  const {
    tdh_rate,
    xtdh_multiplier,
    xtdh_rate,
    granted_xtdh_rate,
  } = data;

  const hasAllocationMetrics =
    typeof xtdh_rate === "number" && typeof granted_xtdh_rate === "number";
  const availableValue = hasAllocationMetrics
    ? Math.max(xtdh_rate - granted_xtdh_rate, 0)
    : null;
  const rawPercentage = hasAllocationMetrics && xtdh_rate > 0
    ? (granted_xtdh_rate / xtdh_rate) * 100
    : 0;
  const percentage = Math.min(Math.max(rawPercentage, 0), 100);

  const totalDisplay = formatDisplay(xtdh_rate);
  const grantedDisplay = formatDisplay(granted_xtdh_rate);
  const availableDisplay = formatDisplay(availableValue);

  return {
    metrics: {
      tdhRate: formatDisplay(tdh_rate),
      multiplier: formatDisplay(xtdh_multiplier, 2),
      xtdhRate: totalDisplay,
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
