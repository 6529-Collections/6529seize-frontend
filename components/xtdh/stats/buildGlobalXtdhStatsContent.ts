import type { GlobalTdhStats } from "@/hooks/useGlobalTdhStats";

import { formatStatFloor } from "@/helpers/Helpers";
import type { XtdhStatsProps } from "./XtdhStats";

export function buildGlobalXtdhStatsContent(data: GlobalTdhStats): XtdhStatsProps {
  const {

    multiplier,
    xtdhRate,
    outgoingRate,
  } = data;

  const totalDisplay = formatStatFloor(xtdhRate);
  const grantedDisplay = formatStatFloor(outgoingRate);

  return {
    metrics: {
      multiplier: formatStatFloor(multiplier, 2),
      producedXtdhRate: totalDisplay,
      granted: grantedDisplay,
    },
  };
}
