import React, { useCallback, useRef } from "react";
import { useLayout } from "../layout/LayoutContext";
import { useWave } from "../../../../hooks/useWave";
import { ApiWave } from "../../../../generated/models/ApiWave";
import MyStreamWaveTabsMeme from "./MyStreamWaveTabsMeme";
import MyStreamWaveTabsDefault from "./MyStreamWaveTabsDefault";

interface MyStreamWaveTabsProps {
  readonly wave: ApiWave;
}

export const MyStreamWaveTabs: React.FC<MyStreamWaveTabsProps> = ({ wave }) => {
  const { isMemesWave } = useWave(wave);
  const { registerRef } = useLayout();

  // Reference to store tabs element for local measurements
  const tabsElementRef = useRef<HTMLDivElement | null>(null);

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

  return (
    <div className="tw-flex-shrink-0" ref={setTabsRef} id="tabs-container">
      <div className="tw-px-2 sm:tw-px-4 md:tw-px-6 lg:tw-px-0 tw-w-full tw-pt-4">
        {/* Combined row with tabs, title, and action button */}
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

export default MyStreamWaveTabs;
