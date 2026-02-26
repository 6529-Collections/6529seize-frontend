"use client";

import React from "react";

import { SidebarProvider } from "../../hooks/useSidebarState";
import BrainMobile from "../brain/BrainMobile";
import { ContentTabProvider } from "../brain/ContentTabContext";

import type { ReactNode } from "react";

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
