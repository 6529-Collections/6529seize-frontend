"use client";

import React, { ReactNode } from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import { SidebarProvider } from "../../hooks/useSidebarState";
import WavesMessagesWrapper from "../shared/WavesMessagesWrapper";

interface Props {
  readonly children: ReactNode;
}

const MessagesDesktop: React.FC<Props> = ({ children }) => {
  return (
    <WavesMessagesWrapper defaultPath="/messages" showLeftSidebar={true}>
      {children}
    </WavesMessagesWrapper>
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
