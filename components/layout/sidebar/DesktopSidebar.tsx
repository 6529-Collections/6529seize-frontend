"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tooltip as ReactTooltip } from "react-tooltip";
import DesktopSidebarNav from "./DesktopSidebarNav";
import DesktopSidebarUser from "./DesktopSidebarUser";
import CollectionsSubmenu from "./CollectionsSubmenu";
import { ChevronDoubleLeftIcon } from "@heroicons/react/24/outline";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import { useIdentity } from "../../../hooks/useIdentity";

interface DesktopSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isCollectionsSubmenuOpen: boolean;
  onCollectionsSubmenuToggle: (open: boolean) => void;
  isMobile: boolean;
  isOffcanvasOpen: boolean;
  onCloseOffcanvas: () => void;
  sidebarWidth: string;
}

function DesktopSidebar({
  isCollapsed,
  onToggle,
  isCollectionsSubmenuOpen,
  onCollectionsSubmenuToggle,
  isMobile,
  isOffcanvasOpen,
  onCloseOffcanvas,
  sidebarWidth,
}: DesktopSidebarProps) {
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { address } = useSeizeConnectContext();
  const { profile } = useIdentity({
    handleOrWallet: address || "",
    initialProfile: null,
  });

  const onToggleUserMenu = () => setShowUserMenu(!showUserMenu);

  // ESC key closes off-canvas overlay
  useEffect(() => {
    if (!isMobile || !isOffcanvasOpen) return;
    const onKey = (e: KeyboardEvent) =>
      e.key === "Escape" && onCloseOffcanvas();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isMobile, isOffcanvasOpen, onCloseOffcanvas]);

  const handleCollectionsClick = () =>
    onCollectionsSubmenuToggle(!isCollectionsSubmenuOpen);

  // Determine visual collapsed state (for component rendering)
  const isVisuallyCollapsed = isCollapsed && !(isMobile && isOffcanvasOpen);

  // Sidebar content
  const inner = (
    <div
      className="tw-relative tw-z-50 tw-h-full  tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-bg-black tw-border-r tw-border-y-0 tw-border-l-0 tw-border-white/20 tw-border-solid tw-transition-all tw-duration-300 tw-ease-out tw-overflow-hidden"
      style={{ width: sidebarWidth }}
      aria-label="Primary sidebar"
    >
      <div className="tw-flex tw-flex-col tw-h-full">
        <div
          className={`tw-flex tw-shrink-0 tw-pt-3 ${
            isVisuallyCollapsed
              ? "tw-flex-col tw-items-center tw-gap-y-4 tw-px-2"
              : "tw-items-center tw-justify-between tw-px-4"
          }`}
        >
          <Link
            href="/"
            className={isVisuallyCollapsed ? "tw-mx-auto" : "tw-ml-1.5"}
          >
            <Image
              alt="6529Seize"
              src="/6529.png"
              className="tw-h-9 tw-w-9 tw-flex-shrink-0"
              width={32}
              height={32}
            />
          </Link>

          <button
            type="button"
            onClick={onToggle}
            className="tw-group tw-size-8 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-iron-800 tw-border tw-border-solid tw-border-iron-700 tw-transition-all tw-duration-200 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-border-iron-600 tw-shadow-sm tw-flex-shrink-0"
            aria-label={isVisuallyCollapsed ? "Expand" : "Collapse"}
            aria-expanded={!isVisuallyCollapsed}
            data-tooltip-id="sidebar-tooltip"
            data-tooltip-content={isVisuallyCollapsed ? "Expand" : "Collapse"}
          >
            <ChevronDoubleLeftIcon
              strokeWidth={3}
              className={`tw-h-4 tw-w-4 tw-text-iron-300 group-hover:hover:tw-text-iron-200 tw-transition-all tw-duration-200 ${
                isVisuallyCollapsed ? "tw-rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <div className="tw-flex-1">
          <DesktopSidebarNav
            isCollapsed={isVisuallyCollapsed}
            isCollectionsOpen={isCollectionsSubmenuOpen}
            onCollectionsClick={handleCollectionsClick}
          />
        </div>

        <DesktopSidebarUser
          isCollapsed={isVisuallyCollapsed}
          showUserMenu={showUserMenu}
          onToggleUserMenu={onToggleUserMenu}
          profile={profile}
        />
      </div>

      <CollectionsSubmenu
        isOpen={isCollectionsSubmenuOpen}
        sidebarCollapsed={isVisuallyCollapsed}
        onExpandSidebar={() => {}}
        onClose={() => onCollectionsSubmenuToggle(false)}
      />
    </div>
  );

  // Tooltip - rendered as sibling for proper z-index handling
  // Inline styling copied from the old common/Tooltip.tsx (variant: "sidebar")
  const isTouchDevice = (() => {
    if (typeof window === "undefined") return false;
    try {
      return (
        "ontouchstart" in window ||
        (navigator as any)?.maxTouchPoints > 0 ||
        window.matchMedia?.("(pointer: coarse)").matches
      );
    } catch {
      return false;
    }
  })();

  const sidebarTooltip = !isTouchDevice ? (
    <ReactTooltip
      id="sidebar-tooltip"
      place="right"
      offset={16}
      opacity={1}
      style={{
        padding: "4px 8px",
        background: "#37373E", // iron-700 solid background
        color: "white",
        fontSize: "13px",
        fontWeight: 500,
        borderRadius: "6px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        zIndex: 9999,
        pointerEvents: "none",
      }}
      border="1px solid #4C4C55" // iron-650 border
    />
  ) : null;

  // Mobile off-canvas: overlay behavior
  if (isMobile && isOffcanvasOpen) {
    return (
      <>
        <div
          className="tw-fixed tw-inset-0 tw-bg-black/60 tw-z-[70]"
          onClick={onCloseOffcanvas}
          role="button"
          aria-label="Close menu overlay"
        />
        <div
          className={`tw-fixed tw-inset-y-0 tw-left-0 ${
            // Keep sidebar above overlay and content; raise further when user menu is open
            showUserMenu ? "tw-z-[120]" : "tw-z-[80]"
          }`}
          role="dialog"
          aria-modal="true"
        >
          {inner}
        </div>
        {sidebarTooltip}
      </>
    );
  }

  // Always visible sidebar (collapsed by default on mobile, responsive on desktop)
  return (
    <>
      <div
        className={`tw-fixed tw-inset-y-0 tw-left-0 ${
          // Keep sidebar above base content; raise above right-sidebar when user menu is open
          showUserMenu ? "tw-z-[120]" : "tw-z-40"
        }`}
      >
        {inner}
      </div>
      {sidebarTooltip}
    </>
  );
}

export default DesktopSidebar;
