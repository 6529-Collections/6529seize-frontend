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
          className="tw-relative tw-ml-5 tw-flex tw-size-10 tw-items-center tw-justify-center tw-rounded-md tw-transition-colors focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-bg-iron-800 desktop-hover:hover:tw-ring-1 desktop-hover:hover:tw-ring-inset desktop-hover:hover:tw-ring-iron-600 motion-reduce:tw-transition-none"
        >
          <Image
            unoptimized
            loading="eager"
            priority
            alt="6529Seize"
            src="/6529.svg"
            className="tw-size-9 tw-shrink-0"
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
        className="tw-absolute tw-right-0 tw-top-8 tw-flex tw-h-11 tw-w-4 -tw-translate-y-1/2 tw-items-center tw-justify-end tw-border-0 tw-bg-transparent tw-p-0 tw-text-iron-800 tw-opacity-0 tw-transition-opacity group-focus-within/sidebar:tw-opacity-100 group-hover/sidebar:tw-opacity-100 focus-visible:tw-opacity-100 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-inset focus-visible:tw-ring-primary-400 desktop-hover:hover:tw-text-iron-700 touch-only:tw-opacity-100 motion-reduce:tw-transition-none"
        aria-label="Toggle right sidebar"
        aria-expanded={!collapsed}
      >
        <svg
          viewBox="0 0 16 44"
          aria-hidden="true"
          className="tw-h-11 tw-w-4 tw-fill-current"
        >
          <path d="M16 0C16 8 0 6 0 17V27C0 38 16 36 16 44Z" />
        </svg>
        <ChevronLeftIcon
          strokeWidth={2}
          aria-hidden="true"
          className={`tw-absolute tw-right-0 tw-size-4 tw-text-iron-200 ${collapsed ? "tw-rotate-180" : ""}`}
        />
      </button>
    </div>
  );
}

export default WebSidebarHeader;
