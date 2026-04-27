"use client";

import type { ReactNode } from "react";
import React from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import WavesMessagesWrapper from "../shared/WavesMessagesWrapper";

interface Props {
  readonly children: ReactNode;
  readonly showLeftSidebar?: boolean | undefined;
  readonly allowMainContentWithoutWave?: boolean | undefined;
}

const WavesDesktop: React.FC<Props> = ({
  children,
  showLeftSidebar = true,
  allowMainContentWithoutWave = false,
}) => {
  return (
    <WavesMessagesWrapper
      defaultPath="/waves"
      showLeftSidebar={showLeftSidebar}
      allowMainContentWithoutWave={allowMainContentWithoutWave}
    >
      {children}
    </WavesMessagesWrapper>
  );
};

const WavesDesktopWithProvider: React.FC<Props> = (props) => (
  <ContentTabProvider>
    <WavesDesktop {...props} />
  </ContentTabProvider>
);

export default WavesDesktopWithProvider;
