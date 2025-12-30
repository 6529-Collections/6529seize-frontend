"use client";

import React from "react";

interface SingleWaveDropInfoContainerProps {
  readonly children: React.ReactNode;
}

export const SingleWaveDropInfoContainer: React.FC<
  SingleWaveDropInfoContainerProps
> = ({ children }) => {
  return (
    <div className="@container tw-w-full tw-h-full tw-pt-20 lg:tw-pt-24 tw-bg-iron-950">
      <div className="tw-min-h-full tw-relative tw-bg-iron-950">{children}</div>
    </div>
  );
};
