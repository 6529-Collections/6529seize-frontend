"use client";

import React, { useCallback, useEffect, useRef } from "react";

import type { ApiWave } from "@/generated/models/ApiWave";
import { useWave } from "@/hooks/useWave";
import type { WaveViewMode } from "@/hooks/useWaveViewMode";

import useDeviceInfo from "../../../../hooks/useDeviceInfo";
import { useLayout } from "../layout/LayoutContext";

import MyStreamWaveTabsDefault from "./MyStreamWaveTabsDefault";
import MyStreamWaveTabsMeme from "./MyStreamWaveTabsMeme";



interface MyStreamWaveTabsProps {
  readonly wave: ApiWave;
  readonly viewMode: WaveViewMode;
  readonly onToggleViewMode: () => void;
  readonly showGalleryToggle: boolean;
}

export const MyStreamWaveTabs: React.FC<MyStreamWaveTabsProps> = ({
  wave,
  viewMode,
  onToggleViewMode,
  showGalleryToggle,
}) => {
  const { isMemesWave } = useWave(wave);
  const { registerRef } = useLayout();
  const { isApp } = useDeviceInfo();

  // Reference to store tabs element for local measurements
  const tabsElementRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isApp) {
      registerRef("tabs", null);
    }
  }, [isApp, registerRef]);

  // Callback function to set tabs element reference
  const setTabsRef = useCallback(
    (element: HTMLDivElement | null) => {
      // Update local ref
      tabsElementRef.current = element;

      // Register with LayoutContext
      registerRef("tabs", element);
    },
    [registerRef]
  );

  if (isApp) {
    return null;
  }

  return (
    <div className="tw-flex-shrink-0" ref={setTabsRef} id="tabs-container">
      <div className="tw-w-full tw-bg-iron-950">
        <div className="tw-flex tw-w-full tw-items-center tw-justify-between tw-gap-x-3">
          {isMemesWave ? (
            <MyStreamWaveTabsMeme wave={wave} />
          ) : (
            <MyStreamWaveTabsDefault
              wave={wave}
              viewMode={viewMode}
              onToggleViewMode={onToggleViewMode}
              showGalleryToggle={showGalleryToggle}
            />
          )}
        </div>
      </div>
    </div>
  );
};
