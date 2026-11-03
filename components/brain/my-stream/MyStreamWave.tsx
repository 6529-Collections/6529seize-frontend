"use client";

import React, { Suspense } from "react";
import MyStreamWavePending from "./MyStreamWavePending";
import MyStreamWaveContent, {
  type MyStreamWaveProps,
} from "./MyStreamWaveContent";

const MyStreamWave: React.FC<MyStreamWaveProps> = (props) => (
  <Suspense fallback={<MyStreamWavePending waveId={props.waveId} />}>
    <MyStreamWaveContent {...props} />
  </Suspense>
);

export default React.memo(MyStreamWave);
