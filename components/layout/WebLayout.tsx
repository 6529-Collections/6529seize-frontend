"use client";

import React, { type ReactNode, useMemo } from "react";

import { SIDEBAR_WIDTHS } from "../../constants/sidebar";
import { useSidebarController } from "../../hooks/useSidebarController";
import { SidebarProvider, useSidebarState } from "../../hooks/useSidebarState";

import WebSidebar from "./sidebar/WebSidebar";

const DESKTOP_MAX_WIDTH = 1324;

interface WebLayoutProps {
  readonly children: ReactNode;
  readonly isSmall?: boolean | undefined;
}

const WebLayoutContent = ({ children, isSmall = false }: WebLayoutProps) => {
  const {
    isMobile,
    isNarrow,
    isCollapsed,
    isOffcanvasOpen,
    toggleCollapsed,
    closeOffcanvas,
    sidebarWidth,
  } = useSidebarController();
  const { isRightSidebarOpen } = useSidebarState();

  const cssVars = useMemo(
    () =>
      ({
        "--sidebar-width": sidebarWidth,
        "--collapsed-width": SIDEBAR_WIDTHS.COLLAPSED,
        "--expanded-width": SIDEBAR_WIDTHS.EXPANDED,
        "--layout-max": `${DESKTOP_MAX_WIDTH}px`,
      } as React.CSSProperties),
    [sidebarWidth]
  );

  return (
    <div
      className="layout-root tw-flex tw-justify-between tw-relative tw-w-full"
      style={cssVars}
      data-mobile={isMobile}
      data-narrow={isNarrow}
      data-offcanvas={isOffcanvasOpen}
      data-right-open={isRightSidebarOpen}
      data-small={isSmall ? "true" : "false"}>
      <div className="tailwind-scope">
        <WebSidebar
          isCollapsed={isCollapsed}
          onToggle={toggleCollapsed}
          isMobile={isMobile}
          isNarrow={isNarrow}
          isOffcanvasOpen={isOffcanvasOpen}
          onCloseOffcanvas={closeOffcanvas}
          sidebarWidth={sidebarWidth}
        />
      </div>
      <main
        className="layout-main tw-flex-1 tw-min-w-0"
        data-mobile={isMobile}
        data-narrow={isNarrow}
        data-offcanvas={isOffcanvasOpen}
        data-right-open={isRightSidebarOpen}>
        {children}
      </main>
    </div>
  );
};

const WebLayout = ({ children, isSmall = false }: WebLayoutProps) => (
  <SidebarProvider>
    <WebLayoutContent isSmall={isSmall}>{children}</WebLayoutContent>
  </SidebarProvider>
);

export default WebLayout;
