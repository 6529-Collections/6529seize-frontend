"use client";

import React, { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";

import { commonApiFetch } from "@/services/api/common-api";
import { Mode, SidebarTab } from "../right-sidebar/BrainRightSidebarTypes";
import { WaveContent } from "../right-sidebar/WaveContent";
import { useLayout } from "../my-stream/layout/LayoutContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

interface BrainMobileAboutProps {
  readonly activeWaveId: string | null;
}

const BrainMobileAbout: React.FC<BrainMobileAboutProps> = ({
  activeWaveId,
}) => {
  const { data: wave } = useQuery<ApiWave>({
    queryKey: [QueryKey.WAVE, { wave_id: activeWaveId }],
    queryFn: async () =>
      await commonApiFetch<ApiWave>({
        endpoint: `waves/${activeWaveId}`,
      }),
    enabled: !!activeWaveId,
    staleTime: 60000,
    placeholderData: keepPreviousData,
  });

  const [mode, setMode] = useState<Mode>(Mode.CONTENT);
  const [activeTab, setActiveTab] = useState<SidebarTab>(SidebarTab.ABOUT);
  const { mobileAboutViewStyle } = useLayout();

  // Use mobileAboutViewStyle for capacitor spacing
  const containerClassName =
    "tw-min-h-0 tw-overflow-hidden tw-px-2 sm:tw-px-4 md:tw-px-6";

  return (
    <div className={containerClassName} style={mobileAboutViewStyle}>
      {wave && (
        <WaveContent
          wave={wave}
          mode={mode}
          setMode={setMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          maxVisibleTabs={3}
        />
      )}
    </div>
  );
};

export default BrainMobileAbout;
