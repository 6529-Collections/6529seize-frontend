"use client";

import React, { Suspense } from "react";
import { usePathname, useRouter } from "next/navigation";
import { WavesMoveScope } from "@/components/waves-move/WavesMoveScope";
import { isCompetitionPathname } from "@/helpers/competition.helpers";
import { getWaveHomeRoute } from "@/helpers/navigation.helpers";
import { getMissingWaveNavigationRoute } from "@/helpers/waves/missing-wave-navigation.helpers";
import useDeviceInfo from "@/hooks/useDeviceInfo";
import { useWaveData } from "@/hooks/useWaveData";
import MyStreamWavePending from "./MyStreamWavePending";
import MyStreamWaveContent, {
  type MyStreamWaveProps,
} from "./MyStreamWaveContent";
import { MyStreamWaveQueryContext } from "./MyStreamWaveQueryContext";

/**
 * The wave view, scoped to its wave for the move to the 6529 Network. The
 * scope sits above the view, so the view's own checks (its submit action,
 * the vote controls' lock) see whether its wave moves, not only what it
 * renders.
 */
const MyStreamWave: React.FC<MyStreamWaveProps> = (props) => {
  const { waveId } = props;
  const pathname = usePathname();
  const router = useRouter();
  const { isApp } = useDeviceInfo();
  const waveQuery = useWaveData({
    waveId,
    onWaveNotFound: isCompetitionPathname(pathname)
      ? undefined
      : () => {
          const route = getMissingWaveNavigationRoute(waveId);
          if (!route) return;
          const params = route.searchParams;
          params.delete("wave");
          const basePath = getWaveHomeRoute({
            isDirectMessage: route.pathname.startsWith("/messages"),
            isApp,
          });
          const newUrl = params.toString()
            ? `${basePath}?${params.toString()}`
            : basePath;
          router.push(newUrl, { scroll: false });
        },
  });
  const wave = waveQuery.data;
  return (
    <MyStreamWaveQueryContext.Provider value={waveQuery}>
      <WavesMoveScope wave={wave} waveId={wave?.id}>
        <Suspense fallback={<MyStreamWavePending waveId={waveId} />}>
          <MyStreamWaveContent {...props} />
        </Suspense>
      </WavesMoveScope>
    </MyStreamWaveQueryContext.Provider>
  );
};

export default React.memo(MyStreamWave);
