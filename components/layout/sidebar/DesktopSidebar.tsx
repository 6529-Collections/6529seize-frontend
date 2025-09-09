"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tooltip } from "react-tooltip";
import DesktopSidebarNav from "./DesktopSidebarNav";
import DesktopSidebarUser from "./DesktopSidebarUser";
import CollectionsSubmenu from "./CollectionsSubmenu";
import { ChevronDoubleLeftIcon } from "@heroicons/react/24/outline";

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
      className="tw-group tw-inset-y-0 tw-left-0 tw-h-full tw-bg-black tw-border-r tw-border-iron-800 tw-border-solid tw-transition-all tw-duration-300 tw-ease-out tw-z-[9999]"
      style={{ width: sidebarWidth }}
      aria-label="Primary sidebar"
    >
      <div className="tw-flex tw-flex-col tw-h-full tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300">
        <div
          className={`tw-flex tw-shrink-0 tw-pt-2.5 ${
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
            className="tw-flex tw-group tw-size-8 tw-items-center tw-justify-center tw-rounded-lg tw-bg-gradient-to-br tw-from-iron-800 tw-to-iron-900 tw-border tw-border-solid tw-border-transparent tw-transition-colors tw-duration-200 desktop-hover:hover:tw-from-iron-750 desktop-hover:hover:tw-to-iron-850 desktop-hover:hover:tw-border-iron-650"
            aria-label={
              isVisuallyCollapsed ? "Expand sidebar" : "Collapse sidebar"
            }
            aria-expanded={!isVisuallyCollapsed}
          >
            <ChevronDoubleLeftIcon
              className={`tw-h-4 tw-w-4 tw-text-iron-200 group-hover:tw-text-white tw-transition-transform tw-duration-200 ${
                isVisuallyCollapsed ? "tw-rotate-180" : ""
              }`}
            />
          </button>
        </div>

        <DesktopSidebarNav
          isCollapsed={isVisuallyCollapsed}
          isCollectionsOpen={isCollectionsSubmenuOpen}
          onCollectionsClick={handleCollectionsClick}
        />

        <DesktopSidebarUser isCollapsed={isVisuallyCollapsed} />
      </div>

      <CollectionsSubmenu
        isOpen={isCollectionsSubmenuOpen}
        sidebarCollapsed={isVisuallyCollapsed}
        onExpandSidebar={() => !isVisuallyCollapsed && null}
        onClose={() => onCollectionsSubmenuToggle(false)}
      />
    </div>
  );

  // Tooltip - rendered as sibling for proper z-index handling
  const tooltip = (
    <Tooltip
      id="sidebar-tooltip"
      place="right"
      offset={16}
      opacity={1}
      style={{
        pointerEvents: "none",
        filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))",
        padding: "4px 8px",
        background:
          "linear-gradient(to bottom right, rgb(64, 64, 64), rgb(38, 38, 38))",
        color: "white",
        fontSize: "13px",
        fontWeight: "500",
        borderRadius: "6px",
        boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
        backdropFilter: "blur(4px)",
        zIndex: 9999,
      }}
      border="1px solid rgb(64, 64, 64)"
    />
  );

  // Mobile off-canvas: overlay behavior
  if (isMobile && isOffcanvasOpen) {
    return (
      <>
        <div
          className="tw-fixed tw-inset-0 tw-bg-black/50 tw-z-[9998]"
          onClick={onCloseOffcanvas}
          role="button"
          aria-label="Close menu overlay"
        />
        <div
          className="tw-fixed tw-inset-y-0 tw-left-0 tw-z-[9999]"
          role="dialog"
          aria-modal="true"
        >
          {inner}
        </div>
        {tooltip}
      </>
    );
  }

  // Always visible sidebar (collapsed by default on mobile, responsive on desktop)
  return (
    <>
      <div className="tw-fixed tw-inset-y-0 tw-left-0">{inner}</div>
      {tooltip}
    </>
  );
}

export default DesktopSidebar;
