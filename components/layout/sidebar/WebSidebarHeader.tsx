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
          className="tw-relative tw-ml-5 tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-md focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400"
        >
          <Image
            unoptimized
            loading="eager"
            priority
            alt="6529Seize"
            src="/6529.svg"
            className="tw-size-9 tw-shrink-0 tw-transition-[transform,box-shadow] tw-duration-150 desktop-hover:hover:tw-shadow-[0_0_18px_6px_rgba(255,215,215,0.24)] motion-safe:desktop-hover:hover:tw-scale-[1.02] motion-reduce:tw-transition-none"
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
        className={`tw-group/sidebar-toggle tw-absolute tw-right-0 tw-top-1/2 tw-z-20 tw-flex tw-h-[52px] -tw-translate-y-1/2 tw-items-center tw-justify-center tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-600 tw-opacity-0 tw-transition-[color,opacity] tw-duration-150 group-focus-within/sidebar:tw-opacity-100 group-hover/sidebar:tw-opacity-100 focus-visible:tw-opacity-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-100 touch-only:tw-opacity-100 motion-reduce:tw-transition-none ${collapsed ? "tw-w-5" : "tw-w-6"}`}
        aria-label="Toggle right sidebar"
        aria-expanded={!collapsed}
      >
        <svg
          viewBox="0 0 24 52"
          preserveAspectRatio="none"
          aria-hidden="true"
          className="tw-absolute tw-inset-0 tw-h-full tw-w-full tw-fill-current"
        >
          <path d="M24 0C24 10 0 8 0 21V31C0 44 24 42 24 52Z" />
        </svg>
        <ChevronLeftIcon
          strokeWidth={2}
          aria-hidden="true"
          className={`tw-relative tw-scale-x-75 tw-text-iron-100 tw-transition-colors desktop-hover:group-hover/sidebar-toggle:tw-text-iron-950 motion-reduce:tw-transition-none ${collapsed ? "tw-size-4 tw-rotate-180" : "tw-size-5"}`}
        />
      </button>
    </div>
  );
}

export default WebSidebarHeader;
