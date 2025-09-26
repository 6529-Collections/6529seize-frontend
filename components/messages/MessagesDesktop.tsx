"use client";

import React, { ReactNode } from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import { SidebarProvider } from "../../hooks/useSidebarState";
import WavesMessagesLayout from "../shared/WavesMessagesLayout";

interface Props {
  readonly children: ReactNode;
}

const MessagesDesktop: React.FC<Props> = ({ children }) => {
  return (
    <WavesMessagesLayout defaultPath="/messages" showLeftSidebar={true}>
      {children}
    </WavesMessagesLayout>
  );
};

const MessagesDesktopWithProvider: React.FC<Props> = (props) => (
  <SidebarProvider>
    <ContentTabProvider>
      <MessagesDesktop {...props} />
    </ContentTabProvider>
  </SidebarProvider>
);

export default MessagesDesktopWithProvider;
