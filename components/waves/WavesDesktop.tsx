"use client";

import React, { ReactNode } from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import { SidebarProvider } from "../../hooks/useSidebarState";
import WavesMessagesWrapper from "../shared/WavesMessagesWrapper";

interface Props {
  readonly children: ReactNode;
}

const WavesDesktop: React.FC<Props> = ({ children }) => {
  return (
    <WavesMessagesWrapper defaultPath="/waves" showLeftSidebar={true}>
      {children}
    </WavesMessagesWrapper>
  );
};

const WavesDesktopWithProvider: React.FC<Props> = (props) => (
  <SidebarProvider>
    <ContentTabProvider>
      <WavesDesktop {...props} />
    </ContentTabProvider>
  </SidebarProvider>
);

export default WavesDesktopWithProvider;