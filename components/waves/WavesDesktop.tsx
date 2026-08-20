"use client";

import type { ReactNode } from "react";
import React from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import WavesMessagesWrapper from "../shared/WavesMessagesWrapper";
import { WaveDeleteFlowProvider } from "./header/options/delete/WaveDeleteFlowContext";

interface Props {
  readonly children: ReactNode;
  readonly showLeftSidebar?: boolean | undefined;
}

const WavesDesktop: React.FC<Props> = ({
  children,
  showLeftSidebar = true,
}) => {
  return (
    <WavesMessagesWrapper
      defaultPath="/waves"
      showLeftSidebar={showLeftSidebar}
    >
      {children}
    </WavesMessagesWrapper>
  );
};

const WavesDesktopWithProvider: React.FC<Props> = (props) => (
  <ContentTabProvider>
    <WaveDeleteFlowProvider>
      <WavesDesktop {...props} />
    </WaveDeleteFlowProvider>
  </ContentTabProvider>
);

export default WavesDesktopWithProvider;
