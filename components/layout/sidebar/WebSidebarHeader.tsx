"use client";

import IconButton from "@/components/utils/button/IconButton";

import { ChevronLeftIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import EnvironmentBadge from "@/components/common/EnvironmentBadge";

interface WebSidebarHeaderProps {
  readonly collapsed: boolean;
  readonly onToggle: () => void;
}

function WebSidebarHeader({ collapsed, onToggle }: WebSidebarHeaderProps) {
  return (
    <div className="tw-shrink-0">
      <div className="tw-flex tw-h-16 tw-items-center tw-justify-between">
        <Link
          href="/"
          className="tw-group/sidebar-logo tw-relative tw-ml-5 tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-md focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          <Image
            unoptimized
            loading="eager"
            priority
            alt="6529Seize"
            src="/6529.svg"
            className="tw-size-10 tw-shrink-0 tw-transition-[transform,box-shadow] tw-duration-150 desktop-hover:group-hover/sidebar-logo:tw-shadow-[0_0_20px_10px_rgba(255,215,215,0.35)] motion-safe:desktop-hover:group-hover/sidebar-logo:tw-scale-[1.02] motion-reduce:tw-transition-none"
            width={40}
            height={40}
          />
          <EnvironmentBadge logoOverlay />
        </Link>
      </div>
      {/* Position against the full-height WebSidebar, not the logo header. */}
      <IconButton
        type="button"
        onClick={onToggle}
        onMouseDown={(event) => event.preventDefault()}
        layout="sidebar-rail"
        className={
          collapsed
            ? "[body:has([data-sidebar-flyout])_&]:tw-hidden"
            : undefined
        }
        aria-label="Toggle right sidebar"
        aria-expanded={!collapsed}
      >
        {/* The open stroke meets the existing divider at its center; no second right edge. */}
        <svg
          viewBox="0 0 24 52"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="tw-absolute tw-inset-0 tw-h-full tw-w-[calc(100%+0.5px)] tw-overflow-visible tw-fill-iron-800 tw-stroke-iron-800 tw-drop-shadow-[0_12px_14px_rgba(0,0,0,0.35)] tw-transition-[fill,filter] tw-duration-150 desktop-hover:group-hover/sidebar-toggle:tw-fill-iron-700 desktop-hover:group-hover/sidebar-toggle:tw-drop-shadow-[0_16px_17px_rgba(0,0,0,0.4)] motion-reduce:tw-transition-none"
        >
          <path
            d="M24 0C24 10 0 8 0 21V31C0 44 24 42 24 52"
            strokeWidth={1}
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <ChevronLeftIcon
          strokeWidth={2}
          aria-hidden="true"
          className={`tw-relative tw-scale-x-75 tw-text-iron-200 tw-transition-colors desktop-hover:group-hover/sidebar-toggle:tw-text-white motion-reduce:tw-transition-none ${collapsed ? "tw-size-4 tw-rotate-180" : "tw-size-5"}`}
        />
      </IconButton>
    </div>
  );
}

export default WebSidebarHeader;
