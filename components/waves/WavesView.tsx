"use client";

import React from "react";
import CommunityCurations from "@/components/community-curations/CommunityCurations";
import MyStreamWave from "../brain/my-stream/MyStreamWave";
import BrainContent from "../brain/content/BrainContent";
import useDeviceInfo from "../../hooks/useDeviceInfo";
import { useMyStreamOptional } from "@/contexts/wave/MyStreamContext";
import { getWaveIdFromPathname } from "@/helpers/navigation.helpers";
import { usePathname } from "next/navigation";
import WaveViewLoadingPlaceholder from "./WaveViewLoadingPlaceholder";

const WavesView: React.FC = () => {
  const myStream = useMyStreamOptional();
  const { isApp } = useDeviceInfo();
  const pathname = usePathname();

  const serialisedWaveId = myStream?.activeWave.id ?? null;
  const routeWaveId = getWaveIdFromPathname(pathname);
  const isRouteWavePending =
    routeWaveId !== null && serialisedWaveId !== routeWaveId;

  const showPlaceholder = !serialisedWaveId && !isApp;

  let content: React.ReactNode = null;

  if (isRouteWavePending) {
    content = <WaveViewLoadingPlaceholder />;
  } else if (serialisedWaveId) {
    content = (
      <MyStreamWave
        key={`wave-${serialisedWaveId}`}
        waveId={serialisedWaveId}
      />
    );
  } else if (showPlaceholder) {
    content = <CommunityCurations />;
  }

  // Note: Wave views (MyStreamWave) manage their own activeDrop state
  // internally via MyStreamWaveChat. We pass null to BrainContent because
  // the wave's internal state controls the reply/quote input box.
  return (
    <BrainContent activeDrop={null} onCancelReplyQuote={() => {}}>
      {content}
    </BrainContent>
  );
};

export default React.memo(WavesView);
