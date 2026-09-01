"use client";

import React, { Suspense } from "react";
import MyStreamWaveContent, {
  type MyStreamWaveProps,
} from "./MyStreamWaveContent";
import WaveViewLoadingPlaceholder from "@/components/waves/WaveViewLoadingPlaceholder";

const MyStreamWave: React.FC<MyStreamWaveProps> = (props) => (
  <Suspense fallback={<WaveViewLoadingPlaceholder />}>
    <MyStreamWaveContent {...props} />
  </Suspense>
);

export default React.memo(MyStreamWave);
