import React from "react";
import { SingleWaveDropTab } from "./SingleWaveDrop";
import useCapacitor from "../../../hooks/useCapacitor";

interface SingleWaveDropInfoContainerProps {
  readonly activeTab: SingleWaveDropTab;
  readonly children: React.ReactNode;
}

export const SingleWaveDropInfoContainer: React.FC<SingleWaveDropInfoContainerProps> = ({
  activeTab,
  children,
}) => {
  const capacitor = useCapacitor();

  return (
    <div
      className={`${
        activeTab === SingleWaveDropTab.INFO ? "tw-block" : "tw-hidden"
      } lg:tw-block lg:tw-w-[28rem] 2xl:tw-max-w-2xl 2xl:tw-w-full tw-py-4 lg:tw-py-6 lg:tw-border lg:tw-border-r-[3px] lg:tw-border-solid tw-border-iron-800 tw-border-y-0 tw-bg-iron-950 tw-overflow-y-auto ${
        capacitor.isCapacitor
          ? "tw-h-[calc(100vh-14.7rem)] tw-pb-[calc(4rem+0.9375rem)]"
          : "tw-h-[calc(100vh-8.5rem)] lg:tw-h-[calc(100vh-5.625rem)]"
      } tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300`}
    >
      <div className="tw-h-full tw-relative tw-bg-iron-950">
        {children}
      </div>
    </div>
  );
}; 