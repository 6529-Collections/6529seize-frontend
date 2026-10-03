"use client";

import { useState } from "react";
import type { ApiWave } from "@/generated/models/ApiWave";
import { WaveContent } from "@/components/brain/right-sidebar/WaveContent";
import {
  Mode,
  SidebarTab,
} from "@/components/brain/right-sidebar/BrainRightSidebarTypes";

export default function MyStreamWaveAbout({
  wave,
}: {
  readonly wave: ApiWave;
}) {
  const [mode, setMode] = useState(Mode.CONTENT);
  return (
    <WaveContent
      wave={wave}
      mode={mode}
      setMode={setMode}
      activeTab={SidebarTab.ABOUT}
      setActiveTab={() => undefined}
      showTabs={false}
    />
  );
}
