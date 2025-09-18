"use client";

import React, { ReactNode } from "react";
import { usePathname } from "next/navigation";
import WebSidebar from "./sidebar/WebSidebar";
import { useSidebarController } from "../../hooks/useSidebarController";
import { useCollectionsSubmenu } from "../../hooks/useCollectionsSubmenu";

interface WebLayoutProps {
  readonly children: ReactNode;
}

const WebLayout = ({ children }: WebLayoutProps) => {
  const pathname = usePathname();
  const {
    isMobile,
    isCollapsed,
    isOffcanvasOpen,
    toggleCollapsed,
    closeOffcanvas,
    sidebarWidth,
  } = useSidebarController();

  const { isSubmenuOpen, toggleSubmenu } = useCollectionsSubmenu(
    pathname,
    isMobile
  );

  return (
    <div className="tw-flex tw-h-screen tw-relative">
      <div className="tailwind-scope">
        <WebSidebar
          isCollapsed={isCollapsed}
          onToggle={toggleCollapsed}
          isCollectionsSubmenuOpen={isSubmenuOpen}
          onCollectionsSubmenuToggle={toggleSubmenu}
          isMobile={isMobile}
          isOffcanvasOpen={isOffcanvasOpen}
          onCloseOffcanvas={closeOffcanvas}
          sidebarWidth={sidebarWidth}
        />
      </div>
      <main
        className={`
          tw-flex-1 tw-min-w-0 tw-transition-all tw-duration-300 tw-ease-out
          ${isMobile ? "tw-pl-16" : isCollapsed ? "tw-pl-16" : "tw-pl-72"}
          ${
            isMobile && isOffcanvasOpen
              ? "tw-opacity-40 tw-pointer-events-none"
              : ""
          }
        `}
      >
        {children}
      </main>
    </div>
  );
};

export default WebLayout;
