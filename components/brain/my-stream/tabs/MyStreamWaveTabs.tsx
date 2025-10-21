"use client";

import React, { useCallback, useEffect, useRef } from "react";
import { useLayout } from "../layout/LayoutContext";
import { useWave } from "@/hooks/useWave";
import { ApiWave } from "@/generated/models/ApiWave";
import MyStreamWaveTabsMeme from "./MyStreamWaveTabsMeme";
import MyStreamWaveTabsDefault from "./MyStreamWaveTabsDefault";
import useDeviceInfo from "../../../../hooks/useDeviceInfo";

interface MyStreamWaveTabsProps {
  readonly wave: ApiWave;
}

export const MyStreamWaveTabs: React.FC<MyStreamWaveTabsProps> = ({ wave }) => {
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
        <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-gap-x-3">
          {isMemesWave ? (
            <MyStreamWaveTabsMeme wave={wave} />
          ) : (
            <MyStreamWaveTabsDefault wave={wave} />
          )}
        </div>
      </div>
    </div>
  );
};
