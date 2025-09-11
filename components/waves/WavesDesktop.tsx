"use client";

import React, { ReactNode } from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import { SidebarProvider } from "../../hooks/useSidebarState";
import SharedDesktopLayout from "../shared/SharedDesktopLayout";

interface Props {
  readonly children: ReactNode;
}

const WavesDesktop: React.FC<Props> = ({ children }) => {
  return (
    <SharedDesktopLayout defaultPath="/waves" showLeftSidebar={true}>
      {children}
    </SharedDesktopLayout>
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