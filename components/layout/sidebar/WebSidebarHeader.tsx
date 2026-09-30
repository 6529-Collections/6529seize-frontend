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
    <div className="tw-relative tw-shrink-0">
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
            className="tw-size-9 tw-shrink-0 tw-transition-[transform,box-shadow] tw-duration-150 desktop-hover:hover:tw-shadow-[0_0_10px_2px_rgba(255,215,215,0.12)] motion-safe:desktop-hover:hover:tw-scale-[1.02] motion-reduce:tw-transition-none"
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
      <button
        type="button"
        onClick={onToggle}
        onMouseDown={(event) => event.preventDefault()}
        className="tw-absolute tw-right-0 tw-top-8 tw-flex tw-h-[52px] tw-w-4 -tw-translate-y-1/2 tw-items-center tw-justify-end tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-700 tw-opacity-0 tw-transition-opacity group-focus-within/sidebar:tw-opacity-100 group-hover/sidebar:tw-opacity-100 focus-visible:tw-opacity-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-600 touch-only:tw-opacity-100 motion-reduce:tw-transition-none"
        aria-label="Toggle right sidebar"
        aria-expanded={!collapsed}
      >
        <svg
          viewBox="0 0 16 52"
          aria-hidden="true"
          className="tw-h-[52px] tw-w-4 tw-fill-current"
        >
          <path d="M16 0C16 10 0 8 0 21V31C0 44 16 42 16 52Z" />
        </svg>
        <ChevronLeftIcon
          strokeWidth={2}
          aria-hidden="true"
          className={`tw-absolute tw-right-0 tw-size-4 tw-scale-x-75 tw-text-iron-100 ${collapsed ? "tw-rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}

export default WebSidebarHeader;
