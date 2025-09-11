"use client";

import React, { ReactNode } from "react";
import { ContentTabProvider } from "../brain/ContentTabContext";
import { SidebarProvider } from "../../hooks/useSidebarState";
import SharedDesktopLayout from "../shared/SharedDesktopLayout";

interface Props {
  readonly children: ReactNode;
}

const MessagesDesktop: React.FC<Props> = ({ children }) => {
  return (
    <SharedDesktopLayout defaultPath="/messages" showLeftSidebar={true}>
      {children}
    </SharedDesktopLayout>
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
