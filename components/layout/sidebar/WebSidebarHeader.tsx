"use client";

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
            className="tw-size-9 tw-shrink-0 tw-transition-[transform,box-shadow] tw-duration-150 desktop-hover:group-hover/sidebar-logo:tw-shadow-[0_0_20px_10px_rgba(255,215,215,0.4)] motion-safe:desktop-hover:group-hover/sidebar-logo:tw-scale-[1.02] motion-reduce:tw-transition-none"
            width={36}
            height={36}
          />
        </Link>
      </div>
      <div
        className={`tw-flex tw-px-2 tw-pb-2 empty:tw-hidden ${
          collapsed ? "tw-justify-center" : "tw-ml-3 tw-justify-start"
        }`}
      >
        <EnvironmentBadge compact />
      </div>
      {/* Position against the full-height WebSidebar, not the logo header. */}
      <button
        type="button"
        onClick={onToggle}
        onMouseDown={(event) => event.preventDefault()}
        className={`tw-group/sidebar-toggle tw-absolute tw-right-0 tw-top-1/2 tw-z-20 tw-flex tw-h-[52px] -tw-translate-y-1/2 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-opacity-0 tw-transition-opacity tw-duration-150 group-focus-within/sidebar:tw-opacity-100 group-hover/sidebar:tw-opacity-100 focus-visible:tw-opacity-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 touch-only:tw-opacity-100 motion-reduce:tw-transition-none ${collapsed ? "tw-w-5" : "tw-w-6"}`}
        aria-label="Toggle right sidebar"
        aria-expanded={!collapsed}
      >
        <svg
          viewBox="0 0 24 52"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-fill-iron-800 tw-stroke-iron-700 tw-drop-shadow-[0_12px_14px_rgba(0,0,0,0.35)] tw-transition-[fill,stroke,filter] tw-duration-150 desktop-hover:group-hover/sidebar-toggle:tw-fill-iron-700 desktop-hover:group-hover/sidebar-toggle:tw-stroke-iron-600 desktop-hover:group-hover/sidebar-toggle:tw-drop-shadow-[0_16px_17px_rgba(0,0,0,0.4)] motion-reduce:tw-transition-none"
        >
          <path
            d="M24 0C24 10 0 8 0 21V31C0 44 24 42 24 52Z"
            vectorEffect="non-scaling-stroke"
          />
        </svg>
        <ChevronLeftIcon
          strokeWidth={2}
          aria-hidden="true"
          className={`tw-relative tw-scale-x-75 tw-text-iron-200 tw-transition-colors desktop-hover:group-hover/sidebar-toggle:tw-text-white motion-reduce:tw-transition-none ${collapsed ? "tw-size-4 tw-rotate-180" : "tw-size-5"}`}
        />
      </button>
    </div>
  );
}

export default WebSidebarHeader;
