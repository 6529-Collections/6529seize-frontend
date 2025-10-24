"use client";

import React, { type ReactNode, useMemo } from "react";
import Image from "next/image";
import WebSidebar from "./sidebar/WebSidebar";
import { useSidebarController } from "../../hooks/useSidebarController";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";
import { SidebarProvider, useSidebarState } from "../../hooks/useSidebarState";
import ClientOnly from "../client-only/ClientOnly";

const DESKTOP_MAX_WIDTH = 1324;

interface WebLayoutProps {
  readonly children: ReactNode;
  readonly isSmall?: boolean;
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
      }) as React.CSSProperties,
    [sidebarWidth]
  );

  return (
    <div
      className="layout-root tw-flex tw-justify-between tw-relative tw-overflow-x-hidden tw-w-full"
      style={cssVars}
      data-mobile={isMobile}
      data-narrow={isNarrow}
      data-offcanvas={isOffcanvasOpen}
      data-right-open={isRightSidebarOpen}
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
        className="layout-main tw-flex-1 tw-min-w-0"
        data-mobile={isMobile}
        data-narrow={isNarrow}
        data-offcanvas={isOffcanvasOpen}
        data-right-open={isRightSidebarOpen}
      >
        {children}
      </main>
    </div>
  );
};

const WebLayout = ({ children, isSmall = false }: WebLayoutProps) => (
  <SidebarProvider>
    <ClientOnly
      fallback={
        <div className="tailwind-scope tw-min-h-[100dvh] tw-bg-black tw-flex tw-items-center tw-justify-center tw-px-6">
          <div className="tw-flex tw-flex-col md:tw-flex-row tw-items-center tw-gap-8 tw-text-center md:tw-text-left">
            <Image
              unoptimized
              priority
              loading="eager"
              src="https://d3lqz0a4bldqgf.cloudfront.net/images/scaled_x450/0x33FD426905F149f8376e227d0C9D3340AaD17aF1/279.WEBP"
              alt="Brain"
              width={220}
              height={326}
              className="tw-rounded-md tw-shadow-lg tw-max-w-[40vw] md:tw-max-w-[180px] tw-h-auto"
            />
            <h1 className="tw-text-xl tw-font-bold tw-text-white">Loading...</h1>
          </div>
        </div>
      }
    >
      <WebLayoutContent isSmall={isSmall}>{children}</WebLayoutContent>
    </ClientOnly>
  </SidebarProvider>
);

export default WebLayout;
