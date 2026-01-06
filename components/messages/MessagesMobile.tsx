"use client";

import type { ReactNode } from "react";
import React from "react";
import BrainMobile from "../brain/BrainMobile";
import { SidebarProvider } from "../../hooks/useSidebarState";
import { ContentTabProvider } from "../brain/ContentTabContext";

interface Props {
  readonly children: ReactNode;
}

// For now, reuse the existing BrainMobile until we create message-specific mobile components
const MessagesMobile: React.FC<Props> = ({ children }) => (
  <SidebarProvider>
    <ContentTabProvider>
      <BrainMobile>{children}</BrainMobile>
    </ContentTabProvider>
  </SidebarProvider>
);

export default MessagesMobile;
