"use client";

import React, { useEffect, useRef, useState } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { usePathname } from "next/navigation";
import WebSidebarNav from "./WebSidebarNav";
import WebSidebarUser from "./WebSidebarUser";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import { useIdentity } from "../../../hooks/useIdentity";
import HeaderShare from "../../header/share/HeaderShare";
import WebSidebarHeader from "./WebSidebarHeader";

interface WebSidebarProps {
  readonly isCollapsed: boolean;
  readonly onToggle: () => void;
  readonly isMobile: boolean;
  readonly isOffcanvasOpen: boolean;
  readonly onCloseOffcanvas: () => void;
  readonly sidebarWidth: string;
}

function WebSidebar({
  isCollapsed,
  onToggle,
  isMobile,
  isOffcanvasOpen,
  onCloseOffcanvas,
  sidebarWidth,
}: WebSidebarProps) {
  const navRef = useRef<{ closeSubmenu: () => void }>(null);
  const pathname = usePathname();
  const { address } = useSeizeConnectContext();
  const { profile } = useIdentity({
    handleOrWallet: address || "",
    initialProfile: null,
  });

  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    const { window: browserWindow } = globalThis as typeof globalThis & {
      window?: Window;
    };
    if (browserWindow === undefined) {
      return;
    }

    setIsTouchScreen(browserWindow.matchMedia("(pointer: coarse)").matches);
  }, []);

  // Close sidebar on route change when on mobile
  const prevPathnameRef = useRef(pathname);
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if (isMobile && isOffcanvasOpen) {
        onCloseOffcanvas();
      }
    }
  }, [pathname, isMobile, isOffcanvasOpen, onCloseOffcanvas]);

  // ESC key closes off-canvas overlay
  useEffect(() => {
    if (!isMobile || !isOffcanvasOpen) return;

    const { window: browserWindow } = globalThis as typeof globalThis & {
      window?: Window;
    };
    if (browserWindow === undefined) {
      return;
    }

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseOffcanvas();
      }
    };

    browserWindow.addEventListener("keydown", handleEscapeKey);
    return () => browserWindow.removeEventListener("keydown", handleEscapeKey);
  }, [isMobile, isOffcanvasOpen, onCloseOffcanvas]);

  // Sidebar is expanded on mobile when offcanvas is open
  const shouldShowCollapsed = isMobile && isOffcanvasOpen ? false : isCollapsed;
  const isDialog = isMobile && isOffcanvasOpen;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    // Close submenu immediately before toggling
    navRef.current?.closeSubmenu();
    onToggle();
  };

  const sidebarContent = (
    <div
      className="tw-relative tw-z-50 tw-h-full tw-bg-black tw-border-r tw-border-y-0 tw-border-l-0 tw-border-iron-800 tw-border-solid tw-transition-[width] tw-duration-300 tw-ease-in-out focus:tw-outline-none"
      style={{ width: sidebarWidth }}
      aria-label="Primary sidebar"
      ref={scrollContainerRef}
    >
      <div className="tw-flex tw-flex-col tw-h-full tw-pt-3">
        <WebSidebarHeader
          collapsed={shouldShowCollapsed}
          onToggle={handleToggle}
        />

        <div className="tw-flex tw-flex-col tw-h-full tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
          <div className="tw-flex-1">
            <WebSidebarNav ref={navRef} isCollapsed={shouldShowCollapsed} />
          </div>

          <HeaderShare isCollapsed={shouldShowCollapsed} />

          <WebSidebarUser isCollapsed={shouldShowCollapsed} profile={profile} />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {isDialog && (
        <button
          type="button"
          className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-50 tw-z-[70] focus:tw-outline-none"
          onClick={onCloseOffcanvas}
          aria-label="Close menu overlay"
        />
      )}
      {isDialog ? (
        <dialog
          open
          className="tw-fixed tw-inset-y-0 tw-left-0 tw-bg-transparent tw-border-none tw-p-0 tw-m-0 focus:tw-outline-none tw-z-[80]"
        >
          {sidebarContent}
        </dialog>
      ) : (
        <div className="tw-fixed tw-inset-y-0 tw-left-0 focus:tw-outline-none tw-z-40">
          {sidebarContent}
        </div>
      )}
      {!isTouchScreen && (
        <ReactTooltip
          id="sidebar-tooltip"
          place="right"
          offset={16}
          opacity={1}
          style={{
            padding: "4px 8px",
            background: "#37373E",
            color: "white",
            fontSize: "13px",
            fontWeight: 500,
            borderRadius: "6px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
            zIndex: 9999,
            pointerEvents: "none",
          }}
          border="1px solid #4C4C55"
        />
      )}
    </>
  );
}

export default WebSidebar;
