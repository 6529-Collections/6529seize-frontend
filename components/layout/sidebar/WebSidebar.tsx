"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Tooltip as ReactTooltip } from "react-tooltip";
import WebSidebarNav from "./WebSidebarNav";
import WebSidebarUser from "./WebSidebarUser";
import CollectionsSubmenu from "./CollectionsSubmenu";
import { ChevronDoubleLeftIcon } from "@heroicons/react/24/outline";
import { useSeizeConnectContext } from "../../auth/SeizeConnectContext";
import { useIdentity } from "../../../hooks/useIdentity";

interface WebSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
  isCollectionsSubmenuOpen: boolean;
  onCollectionsSubmenuToggle: (open: boolean) => void;
  isMobile: boolean;
  isOffcanvasOpen: boolean;
  onCloseOffcanvas: () => void;
  sidebarWidth: string;
}

function WebSidebar({
  isCollapsed,
  onToggle,
  isCollectionsSubmenuOpen,
  onCollectionsSubmenuToggle,
  isMobile,
  isOffcanvasOpen,
  onCloseOffcanvas,
  sidebarWidth,
}: WebSidebarProps) {
  const { address } = useSeizeConnectContext();
  const { profile } = useIdentity({
    handleOrWallet: address || "",
    initialProfile: null,
  });

  const [isTouchScreen, setIsTouchScreen] = useState(false);
  useEffect(() => {
    setIsTouchScreen(window.matchMedia("(pointer: coarse)").matches);
  }, []);

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

  // Sidebar is expanded on mobile when offcanvas is open
  const shouldShowCollapsed = isMobile && isOffcanvasOpen ? false : isCollapsed;

  return (
    <>
      {isMobile && isOffcanvasOpen && (
        <div
          className="tw-fixed tw-inset-0 tw-bg-gray-500 tw-bg-opacity-50 tw-z-[70]"
          onClick={onCloseOffcanvas}
          role="button"
          aria-label="Close menu overlay"
        />
      )}
      <div
        className={`tw-fixed tw-inset-y-0 tw-left-0 ${
          isMobile && isOffcanvasOpen ? "tw-z-[80]" : "tw-z-40"
        }`}
        role={isMobile && isOffcanvasOpen ? "dialog" : undefined}
        aria-modal={isMobile && isOffcanvasOpen ? "true" : undefined}
      >
        <div
          className="tw-relative tw-z-50 tw-h-full tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 tw-bg-black tw-border-r tw-border-y-0 tw-border-l-0 tw-border-iron-800 tw-border-solid tw-transition-all tw-duration-300 tw-ease-out tw-overflow-hidden"
          style={{ width: sidebarWidth }}
          aria-label="Primary sidebar"
        >
          <div className="tw-flex tw-flex-col tw-h-full">
            <div
              className={`tw-shrink-0 tw-py-3 ${
                shouldShowCollapsed
                  ? "tw-flex tw-flex-col tw-items-center tw-gap-y-3 tw-px-2"
                  : "tw-flex tw-items-center tw-justify-between tw-px-4"
              }`}
            >
              <Link
                href="/"
                className={`tw-flex tw-items-center ${
                  shouldShowCollapsed ? "" : "tw-ml-1.5"
                }`}
              >
                <Image
                  unoptimized
                  loading="eager"
                  priority
                  alt="6529Seize"
                  src="/6529.png"
                  className="tw-h-10 tw-w-10 tw-flex-shrink-0 tw-transition-all tw-duration-100 hover:tw-scale-[1.02] hover:tw-shadow-[0_0_20px_10px_rgba(255,215,215,0.3)]"
                  width={40}
                  height={40}
                />
              </Link>

              <button
                type="button"
                onClick={onToggle}
                className={`tw-group tw-size-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-800/85 tw-border tw-border-iron-700/70 tw-border-solid tw-backdrop-blur-sm tw-transition-all tw-duration-200 tw-shadow-[0_10px_24px_rgba(0,0,0,0.45)] desktop-hover:hover:tw-bg-iron-700/95 desktop-hover:hover:tw-border-iron-500/70 desktop-hover:hover:tw-shadow-[0_12px_30px_rgba(0,0,0,0.55)] ${
                  shouldShowCollapsed ? "tw-self-center" : ""
                }`}
                aria-label={shouldShowCollapsed ? "Expand" : "Collapse"}
                aria-expanded={!shouldShowCollapsed}
                data-tooltip-id="sidebar-tooltip"
                data-tooltip-content={
                  shouldShowCollapsed ? "Expand" : "Collapse"
                }
              >
                <ChevronDoubleLeftIcon
                  strokeWidth={2.5}
                  className={`tw-h-4 tw-w-4 tw-text-iron-200 group-hover:hover:tw-text-white tw-transition-all tw-duration-200 ${
                    shouldShowCollapsed ? "tw-rotate-180" : ""
                  }`}
                />
              </button>
            </div>

            <div className="tw-flex-1">
              <WebSidebarNav
                isCollapsed={shouldShowCollapsed}
                isCollectionsOpen={isCollectionsSubmenuOpen}
                onCollectionsClick={handleCollectionsClick}
              />
            </div>

            <WebSidebarUser
              isCollapsed={shouldShowCollapsed}
              profile={profile}
            />
          </div>

          <CollectionsSubmenu
            isOpen={isCollectionsSubmenuOpen}
            sidebarCollapsed={shouldShowCollapsed}
            onClose={() => onCollectionsSubmenuToggle(false)}
          />
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
