"use client";

import type { ReactNode } from "react";
import React from "react";
import BrainMobile from "../brain/BrainMobile";
import { SidebarProvider } from "../../hooks/useSidebarState";
import { ContentTabProvider } from "../brain/ContentTabContext";
import { usePathname } from "next/navigation";
import { isCompetitionPathname } from "@/helpers/competition.helpers";
import { useLayout } from "@/components/brain/my-stream/layout/LayoutContext";

interface Props {
  readonly children: ReactNode;
}

// For now, reuse the existing BrainMobile until we create wave-specific mobile components
const WavesMobile: React.FC<Props> = ({ children }) => {
  const pathname = usePathname();
  const { waveViewStyle } = useLayout();
  if (isCompetitionPathname(pathname)) {
    return (
      <SidebarProvider>
        <ContentTabProvider>
          <div style={waveViewStyle} className="tw-flex tw-min-h-0 tw-flex-col">
            {children}
          </div>
        </ContentTabProvider>
      </SidebarProvider>
    );
  }
  return (
    <SidebarProvider>
      <ContentTabProvider>
        <BrainMobile>{children}</BrainMobile>
      </ContentTabProvider>
    </SidebarProvider>
  );
};

export default WavesMobile;
