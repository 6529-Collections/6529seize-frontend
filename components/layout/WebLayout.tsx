"use client";

import React, { type CSSProperties, type ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import WebSidebar from "./sidebar/WebSidebar";
import { useSidebarController } from "../../hooks/useSidebarController";

type LayoutCssVars = CSSProperties & {
  "--left-rail": string;
};

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

  const rootStyle = useMemo<LayoutCssVars>(
    () => ({
      "--left-rail": sidebarWidth,
    }),
    [sidebarWidth]
  );

  const mainStyle: CSSProperties = isMobile && isOffcanvasOpen
    ? { transform: `translateX(${sidebarWidth})` }
    : { paddingLeft: sidebarWidth };

  return (
    <div
      className="tw-flex tw-h-screen tw-relative tw-overflow-x-hidden"
      style={rootStyle}>
      <div className="tailwind-scope">
        <WebSidebar
          isCollapsed={isCollapsed}
          onToggle={toggleCollapsed}
          isMobile={isMobile}
          isOffcanvasOpen={isOffcanvasOpen}
          onCloseOffcanvas={closeOffcanvas}
          sidebarWidth={sidebarWidth}
        />
      </div>
      <main
        className={`tw-flex-1 tw-min-w-0 tw-transition-all tw-duration-300 tw-ease-out ${
          isMobile && isOffcanvasOpen
            ? "tw-opacity-40 tw-pointer-events-none"
            : ""
        }`}
        style={mainStyle}
      >
        {children}
      </main>
    </div>
  );
};

export default WebLayout;
