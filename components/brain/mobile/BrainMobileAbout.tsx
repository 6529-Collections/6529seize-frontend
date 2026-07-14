"use client";

import React, { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import type { ApiWave } from "@/generated/models/ApiWave";

import { commonApiFetch } from "@/services/api/common-api";
import { Mode, type SidebarTab } from "../right-sidebar/BrainRightSidebarTypes";
import { WaveContent } from "../right-sidebar/WaveContent";
import { useLayout } from "../my-stream/layout/LayoutContext";
import { QueryKey } from "@/components/react-query-wrapper/ReactQueryWrapper";

interface BrainMobileAboutProps {
  readonly activeWaveId: string | null;
  readonly activeTab: SidebarTab;
  readonly setActiveTab: (tab: SidebarTab) => void;
}

const BrainMobileAbout: React.FC<BrainMobileAboutProps> = ({
  activeWaveId,
  activeTab,
  setActiveTab,
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
  const { mobileAboutViewStyle } = useLayout();

  return (
    <div
      className="tw-min-h-0 tw-overflow-hidden tw-bg-iron-950"
      style={mobileAboutViewStyle}
    >
      {wave && (
        <WaveContent
          wave={wave}
          mode={mode}
          setMode={setMode}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          showTabs={false}
        />
      )}
    </div>
  );
};

export default BrainMobileAbout;
