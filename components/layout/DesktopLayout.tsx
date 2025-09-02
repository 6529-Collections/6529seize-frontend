"use client";

import React, { ReactNode } from "react";
import DesktopSidebar from "./sidebar/DesktopSidebar";
import { useSidebarState, SidebarProvider } from "@/hooks/useSidebarState";

interface DesktopLayoutProps {
  readonly children: ReactNode;
}

const DesktopLayoutContent = ({ children }: DesktopLayoutProps) => {
  const { isMainSidebarCollapsed } = useSidebarState();

  return (
    <div className="tw-relative tw-min-h-dvh tw-w-full">
      {/* Fixed Sidebar - stays pinned, with responsive width */}
      <div
        className={`
          tailwind-scope tw-fixed tw-inset-y-0 tw-left-0 tw-z-40
          tw-flex tw-flex-col tw-h-screen tw-overflow-hidden
          tw-transition-[width] tw-duration-300 tw-ease-out
          tw-will-change-[width] tw-transform-gpu
          ${
            isMainSidebarCollapsed
              ? "tw-w-16" // Collapsed: 4rem on all screens
              : "tw-w-16 lg:tw-w-80" // Expanded: 4rem mobile, 20rem desktop
          }
        `}
      >
        <DesktopSidebar />
      </div>

      {/* Main Content - offset to avoid overlap with fixed sidebar */}
      <main className="tw-min-h-dvh tw-overflow-auto tw-transition-all tw-duration-300 tw-ease-out">
        {children}
      </main>
    </div>
  );
};

const DesktopLayout = ({ children }: DesktopLayoutProps) => {
  return (
    <SidebarProvider>
      <DesktopLayoutContent>{children}</DesktopLayoutContent>
    </SidebarProvider>
  );
};

export default DesktopLayout;
