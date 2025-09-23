"use client";

import React, { ReactNode } from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import { SidebarProvider } from "../../hooks/useSidebarState";
import WavesMessagesLayout from "../shared/WavesMessagesLayout";

interface Props {
  readonly children: ReactNode;
}

const WavesDesktop: React.FC<Props> = ({ children }) => {
  return (
    <WavesMessagesLayout defaultPath="/waves" showLeftSidebar={true}>
      {children}
    </WavesMessagesLayout>
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