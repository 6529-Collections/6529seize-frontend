"use client";

import React, { Suspense } from "react";
import MyStreamWaveContent, {
  type MyStreamWaveProps,
} from "./MyStreamWaveContent";

const MyStreamWave: React.FC<MyStreamWaveProps> = (props) => (
  <Suspense fallback={null}>
    <MyStreamWaveContent {...props} />
  </Suspense>
);

export default React.memo(MyStreamWave);
