"use client";

import { UserIcon } from "@heroicons/react/24/outline";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { Tooltip as ReactTooltip } from "react-tooltip";
import { useIdentity } from "../../../hooks/useIdentity";
import { useAuth } from "../../auth/Auth";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import HeaderShare from "../../header/share/HeaderShare";
import WebSidebarNavItem from "./nav/WebSidebarNavItem";
import WebSidebarHeader from "./WebSidebarHeader";
import WebSidebarNav from "./WebSidebarNav";
import WebSidebarUser from "./WebSidebarUser";

interface WebSidebarProps {
  readonly isCollapsed: boolean;
  readonly onToggle: () => void;
  readonly isMobile: boolean;
  readonly isNarrow?: boolean | undefined;
  readonly isOffcanvasOpen: boolean;
  readonly onCloseOffcanvas: () => void;
  readonly sidebarWidth: string;
}

function WebSidebar({
  isCollapsed,
  onToggle,
  isMobile,
  isNarrow = false,
  isOffcanvasOpen,
  onCloseOffcanvas,
  sidebarWidth,
}: WebSidebarProps) {
  const navRef = useRef<{ closeSubmenu: () => void }>(null);
  const pathname = usePathname();
  const { address } = useSeizeConnectContext();
  const { connectedProfile } = useAuth();
  const { profile } = useIdentity({
    handleOrWallet: address || "",
    initialProfile: null,
  });
  const profilePath = useMemo(() => {
    if (connectedProfile?.handle) return `/${connectedProfile.handle}`;
    if (address) return `/${address}`;
    return null;
  }, [connectedProfile?.handle, address]);

  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    const { window: browserWindow } = globalThis as typeof globalThis & {
      window?: Window | undefined;
    };
    if (
      browserWindow === undefined ||
      typeof browserWindow.matchMedia !== "function"
    ) {
      setIsTouchScreen(false);
      return;
    }

    const coarsePointerQuery = browserWindow.matchMedia("(pointer: coarse)");
    const handlePointerChange = (event: MediaQueryListEvent) => {
      setIsTouchScreen(event.matches);
    };

    setIsTouchScreen(coarsePointerQuery.matches);

    if (typeof coarsePointerQuery.addEventListener === "function") {
      coarsePointerQuery.addEventListener("change", handlePointerChange);
      return () =>
        coarsePointerQuery.removeEventListener("change", handlePointerChange);
    }

    if ("onchange" in coarsePointerQuery) {
      const originalHandler = coarsePointerQuery.onchange;
      coarsePointerQuery.onchange = handlePointerChange;
      return () => {
        if (coarsePointerQuery.onchange === handlePointerChange) {
          coarsePointerQuery.onchange = originalHandler ?? null;
        }
      };
    }
    return;
  }, []);

  // Close sidebar on route change when on mobile
  const prevPathnameRef = useRef(pathname);
  const isOverlayActive = isOffcanvasOpen && (isMobile || isNarrow);

  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      if ((isMobile || isOverlayActive) && isOffcanvasOpen) {
        onCloseOffcanvas();
      }
    }
  }, [pathname, isMobile, isOverlayActive, isOffcanvasOpen, onCloseOffcanvas]);

  // ESC key closes off-canvas overlay
  useEffect(() => {
    if ((!isMobile && !isOverlayActive) || !isOffcanvasOpen) return;

    const { window: browserWindow } = globalThis as typeof globalThis & {
      window?: Window | undefined;
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
  }, [isMobile, isOffcanvasOpen, isOverlayActive, onCloseOffcanvas]);

  // Sidebar is expanded when offcanvas is open (mobile or narrow desktop)
  const shouldShowCollapsed = isMobile && isOffcanvasOpen ? false : isCollapsed;
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleToggle = () => {
    // Close submenu immediately before toggling
    navRef.current?.closeSubmenu();
    onToggle();
  };

  const shouldRenderSidebar = !isMobile || isOffcanvasOpen;
  if (!shouldRenderSidebar) {
    return null;
  }

  return (
    <>
      {isOverlayActive && (
        <button
          type="button"
          className={
            isMobile
              ? "tw-fixed tw-inset-0 tw-z-[70] tw-border-0 tw-bg-gray-600 tw-bg-opacity-50 focus:tw-outline-none"
              : "tw-fixed tw-inset-0 tw-z-30 tw-border-0 tw-bg-gray-600 tw-bg-opacity-50 focus:tw-outline-none"
          }
          onClick={onCloseOffcanvas}
          aria-label="Close menu overlay"
        />
      )}
      <div
        className={
          isMobile
            ? "tw-fixed tw-inset-y-0 tw-left-0 tw-z-[80] focus:tw-outline-none"
            : "tw-fixed tw-inset-y-0 tw-left-0 tw-z-40 focus:tw-outline-none"
        }
        style={isMobile ? undefined : { left: "var(--layout-margin, 0px)" }}
      >
        <div
          className="tw-group tw-relative tw-z-50 tw-h-full tw-border-0 tw-border-y-0 tw-border-l-0 tw-border-r tw-border-solid tw-border-iron-800 tw-bg-black tw-transition-[width] tw-duration-300 tw-ease-in-out focus:tw-outline-none"
          style={{ width: sidebarWidth }}
          aria-label="Primary sidebar"
          ref={scrollContainerRef}
        >
          <div className="tw-flex tw-h-full tw-flex-col tw-pt-2">
            <WebSidebarHeader
              collapsed={shouldShowCollapsed}
              onToggle={handleToggle}
            />

            <div
              className="no-scrollbar tw-flex tw-h-full tw-flex-col tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-track-iron-800 tw-scrollbar-thumb-iron-500 desktop-hover:hover:tw-scrollbar-thumb-iron-300"
              data-sidebar-scroll="true"
            >
              <div className="tw-flex-1">
                <WebSidebarNav
                  ref={navRef}
                  isCollapsed={shouldShowCollapsed}
                  isMobile={isMobile}
                />
              </div>

              {profilePath && (
                <div className="tw-px-3 tw-pt-2">
                  <WebSidebarNavItem
                    href={profilePath}
                    icon={UserIcon}
                    iconSizeClass="tw-h-6 tw-w-6"
                    active={pathname === profilePath}
                    collapsed={shouldShowCollapsed}
                    label="Profile"
                  />
                </div>
              )}

              <HeaderShare isCollapsed={shouldShowCollapsed} />

              <WebSidebarUser
                isCollapsed={shouldShowCollapsed}
                profile={profile}
              />
            </div>
          </div>
        </div>
      </div>
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
