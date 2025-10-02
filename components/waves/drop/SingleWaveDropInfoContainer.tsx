"use client";

import React from "react";
import { SingleWaveDropTab } from "./SingleWaveDrop";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";

interface SingleWaveDropInfoContainerProps {
  readonly activeTab: SingleWaveDropTab;
  readonly children: React.ReactNode;
}

export const SingleWaveDropInfoContainer: React.FC<
  SingleWaveDropInfoContainerProps
> = ({ activeTab, children }) => {
  useLayout();

  return (
    <div
      className={`${
        activeTab === SingleWaveDropTab.INFO ? "tw-block" : "tw-hidden"
      } lg:tw-w-[32rem] xl:tw-w-[36rem] 2xl:tw-max-w-2xl 2xl:tw-w-full tw-h-full tw-pt-4 lg:tw-pt-6 lg:tw-border lg:tw-border-r-[3px] lg:tw-border-solid tw-border-iron-800 tw-border-y-0 tw-bg-iron-950 tw-overflow-y-auto tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 hover:tw-scrollbar-thumb-iron-300 lg:[--tab-height:0px]`}
    >
      <div className="tw-min-h-full tw-relative tw-bg-iron-950">{children}</div>
    </div>
  );
};
