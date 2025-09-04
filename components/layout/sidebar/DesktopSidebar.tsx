"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { Tooltip } from "react-tooltip";
import DesktopSidebarNav from "./DesktopSidebarNav";
import DesktopSidebarUser from "./DesktopSidebarUser";
import { ChevronDoubleLeftIcon } from "@heroicons/react/24/outline";

interface DesktopSidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

function DesktopSidebar({ isCollapsed, onToggle }: DesktopSidebarProps) {
  return (
    <div className="tw-group tw-fixed tw-inset-y-0 tw-left-0 tw-w-72 tw-pt-4 tw-h-full tw-bg-black tw-border-r tw-border-iron-800 tw-border-solid">
      <div
        className={`tw-flex tw-flex-col tw-h-full tw-overflow-y-auto tw-overflow-x-hidden tw-scrollbar-thin tw-scrollbar-thumb-iron-500 tw-scrollbar-track-iron-800 desktop-hover:hover:tw-scrollbar-thumb-iron-300 ${
          isCollapsed ? "tw-ml-auto tw-w-16" : "tw-w-72"
        }`}
      >
        {/* Header/Logo section */}
        <div
          className={`tw-flex tw-shrink-0 ${
            isCollapsed
              ? "tw-flex-col tw-items-center tw-gap-y-4 tw-px-2"
              : "tw-items-center tw-justify-between tw-px-4"
          }`}
        >
          {/* Logo - always visible */}
          <Link href="/" className={isCollapsed ? "tw-mx-auto" : "tw-ml-1.5"}>
            <Image
              alt="6529Seize"
              src="/6529.png"
              className="tw-h-9 tw-w-9"
              width={32}
              height={32}
            />
          </Link>

          {/* Collapse toggle */}
          <button
            type="button"
            onClick={onToggle}
            className="tw-group tw-size-8 tw-flex tw-items-center tw-justify-center tw-rounded-lg tw-bg-gradient-to-br tw-from-iron-800 tw-to-iron-900 tw-border tw-border-solid tw-border-transparent tw-transition-colors tw-duration-200 desktop-hover:hover:tw-from-iron-750 desktop-hover:hover:tw-to-iron-850 desktop-hover:hover:tw-border-iron-650"
            aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <ChevronDoubleLeftIcon
              className={`tw-h-4 tw-w-4 tw-text-iron-200 group-hover:tw-text-white tw-transition-transform tw-duration-200 ${
                isCollapsed ? "tw-rotate-180" : ""
              }`}
            />
          </button>
        </div>

        {/* Navigation section */}
        {/* <DesktopSidebarNav isCollapsed={isCollapsed} /> */}

        {/* User section */}
        {/* <DesktopSidebarUser isCollapsed={isCollapsed} /> */}
      </div>

      {/* Global tooltip for navigation items when collapsed */}
      <Tooltip
        id="sidebar-tooltip"
        place="right"
        offset={16}
        opacity={1}
        style={{ 
          pointerEvents: "none",
          filter: "drop-shadow(0 4px 12px rgba(0, 0, 0, 0.4))",
          padding: "4px 8px",
          background: "linear-gradient(to bottom right, rgb(64, 64, 64), rgb(38, 38, 38))",
          color: "white",
          fontSize: "13px",
          fontWeight: "500",
          borderRadius: "6px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid rgb(64, 64, 64)",
          backdropFilter: "blur(4px)",
          zIndex: 9999
        }}
        noArrow={false}
        variant="dark"
        border="1px solid rgba(64, 64, 64, 0.3)"
      />
    </div>
  );
}

export default DesktopSidebar;
