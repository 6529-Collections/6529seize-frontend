"use client";

import React, { ReactNode } from "react";
import BrainMobile from "../brain/BrainMobile";
import { SidebarProvider } from "../../hooks/useSidebarState";
import { ContentTabProvider } from "../brain/ContentTabContext";

interface Props {
  readonly children: ReactNode;
}

// For now, reuse the existing BrainMobile until we create wave-specific mobile components
const WavesMobile: React.FC<Props> = ({ children }) => (
  <SidebarProvider>
    <ContentTabProvider>
      <BrainMobile>{children}</BrainMobile>
    </ContentTabProvider>
  </SidebarProvider>
);

export default WavesMobile;
