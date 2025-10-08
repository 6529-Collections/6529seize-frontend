"use client";

import React, { type CSSProperties, type ReactNode, useMemo } from "react";
import WebSidebar from "./sidebar/WebSidebar";
import { useSidebarController } from "../../hooks/useSidebarController";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";

type LayoutCssVars = CSSProperties & {
  "--left-rail": string;
};

interface WebLayoutProps {
  readonly children: ReactNode;
  readonly isSmall?: boolean;
}

const WebLayout = ({ children, isSmall = false }: WebLayoutProps) => {
  const {
    isMobile,
    isNarrow,
    isCollapsed,
    isOffcanvasMode,
    isOffcanvasOpen,
    toggleCollapsed,
    closeOffcanvas,
    sidebarWidth,
  } = useSidebarController();

  const rootStyle = useMemo<LayoutCssVars>(() => {
    // Keep left rail constant for collapsed rail; mobile has none
    let leftRail = "0";
    if (!isMobile) {
      leftRail = isNarrow ? SIDEBAR_WIDTHS.COLLAPSED : sidebarWidth;
    }
    return {
      "--left-rail": leftRail,
      minHeight: "100dvh",
    } as LayoutCssVars;
  }, [isMobile, isNarrow, sidebarWidth]);

  const mainStyle: CSSProperties = (() => {
    if (isMobile) {
      // On mobile, shift content only when off-canvas is open
      if (isOffcanvasOpen) return { transform: `translateX(${sidebarWidth})` };
      return {};
    }
    if (isNarrow) {
      const collapsed = SIDEBAR_WIDTHS.COLLAPSED;
      const expanded = SIDEBAR_WIDTHS.EXPANDED;

      if (isOffcanvasMode) {
        return {
          paddingLeft: isOffcanvasOpen ? expanded : collapsed,
        };
      }

      return {
        paddingLeft: isCollapsed ? collapsed : expanded,
      };
    }
    // Wide desktop: honor user preference (expanded/collapsed)
    return { paddingLeft: sidebarWidth };
  })();

  return (
    <div
      className="tw-flex tw-relative tw-overflow-x-hidden"
      style={rootStyle}
      data-small={isSmall ? "true" : "false"}
    >
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
