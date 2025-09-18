"use client";

import React, { type CSSProperties, type ReactNode, useMemo } from "react";
import { usePathname } from "next/navigation";
import WebSidebar from "./sidebar/WebSidebar";
import { useSidebarController } from "../../hooks/useSidebarController";
import { useCollectionsSubmenu } from "../../hooks/useCollectionsSubmenu";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";

type LayoutCssVars = CSSProperties & {
  "--left-rail": string;
  "--collections-rail": string;
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

  const {
    isSubmenuOpen,
    toggleSubmenu,
    closeSubmenu,
    isOnCollectionsPage,
  } =
    useCollectionsSubmenu(pathname, isMobile);

  const isDesktopCollectionsOpen =
    !isMobile && isSubmenuOpen && isOnCollectionsPage;

  const rootStyle = useMemo<LayoutCssVars>(
    () => ({
      "--left-rail": sidebarWidth,
      "--collections-rail": isDesktopCollectionsOpen
        ? SIDEBAR_WIDTHS.SUBMENU
        : "0px",
    }),
    [sidebarWidth, isDesktopCollectionsOpen]
  );

  const basePadding = `calc(${sidebarWidth} + ${
    isDesktopCollectionsOpen ? SIDEBAR_WIDTHS.SUBMENU : "0px"
  })`;

  const mainStyle: CSSProperties = isMobile && isOffcanvasOpen
    ? { transform: `translateX(${sidebarWidth})` }
    : { paddingLeft: basePadding };

  return (
    <div
      className="tw-flex tw-h-screen tw-relative tw-overflow-x-hidden"
      style={rootStyle}
      data-collections-open={isDesktopCollectionsOpen || undefined}>
      <div className="tailwind-scope">
        <WebSidebar
          isCollapsed={isCollapsed}
          onToggle={toggleCollapsed}
          isCollectionsSubmenuOpen={isSubmenuOpen}
          onCollectionsSubmenuToggle={toggleSubmenu}
          onCollectionsSubmenuClose={closeSubmenu}
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
