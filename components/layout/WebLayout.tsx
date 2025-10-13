"use client";

import React, { type CSSProperties, type ReactNode, useMemo } from "react";
import Image from "next/image";
import WebSidebar from "./sidebar/WebSidebar";
import { useSidebarController } from "../../hooks/useSidebarController";
import { SIDEBAR_WIDTHS } from "../../constants/sidebar";
import { SidebarProvider, useSidebarState } from "../../hooks/useSidebarState";
import ClientOnly from "../client-only/ClientOnly";

const DESKTOP_MAX_WIDTH = 1300;

type LayoutCssVars = CSSProperties & {
  "--layout-margin"?: string;
  "--left-rail"?: string;
};

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

  const rootStyle = useMemo<LayoutCssVars>(() => {
    const base: LayoutCssVars = { minHeight: "100dvh" };

    if (isMobile) {
      base["--layout-margin"] = "0px";
      base["--left-rail"] = "0px";
      return base;
    }

    const layoutMargin = `max((100vw - ${DESKTOP_MAX_WIDTH}px) / 2, 0px)`;
    const leftRailWidth = isNarrow ? SIDEBAR_WIDTHS.COLLAPSED : sidebarWidth;
    base["--layout-margin"] = layoutMargin;
    base["--left-rail"] = `calc(${layoutMargin} + ${leftRailWidth})`;
    return base;
  }, [isMobile, isNarrow, sidebarWidth]);

  const collapsedWidth = SIDEBAR_WIDTHS.COLLAPSED;
  const expandedWidth = SIDEBAR_WIDTHS.EXPANDED;
  const narrowTranslateX = `translateX(calc(${expandedWidth} - ${collapsedWidth}))`;

  const mainStyle: CSSProperties = (() => {
    const base: CSSProperties = { width: "100%" };

    if (isMobile) {
      if (isOffcanvasOpen) {
        base.transform = `translateX(${sidebarWidth})`;
      }
      return base;
    }

    if (isNarrow) {
      base.paddingLeft = collapsedWidth;
      if (isOffcanvasOpen) {
        base.transform = narrowTranslateX;
      } else {
        base.transform = "translateX(0)";
      }
      return base;
    }

    base.paddingLeft = sidebarWidth;
    return base;
  })();

  if (isRightSidebarOpen) {
    delete mainStyle.transform;
  }

  const shouldDimContent =
    isOffcanvasOpen && (isMobile || (!isMobile && isNarrow));

  return (
    <div
      className={`tw-flex tw-relative tw-overflow-x-hidden tw-w-full${
        isMobile ? "" : " tw-max-w-[1300px] tw-mx-auto"
      }`}
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
          shouldDimContent ? "tw-opacity-40 tw-pointer-events-none" : ""
        }`}
        style={mainStyle}
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
      }>
      <WebLayoutContent isSmall={isSmall}>{children}</WebLayoutContent>
    </ClientOnly>
  </SidebarProvider>
);

export default WebLayout;
