"use client";

import Link from "next/link";
import Image from "next/image";
import { ChevronDoubleLeftIcon } from "@heroicons/react/24/outline";

interface WebSidebarHeaderProps {
  readonly collapsed: boolean;
  readonly onToggle: () => void;
}

function WebSidebarHeader({ collapsed, onToggle }: WebSidebarHeaderProps) {
  return (
    <div className="tw-relative tw-shrink-0 tw-h-12 tw-flex tw-items-center tw-justify-between tw-px-2">
      <Link
        href="/"
        className={`tw-relative tw-z-10 tw-flex tw-items-center tw-ml-1.5 tw-transition-all tw-duration-100 tw-ease-in-out ${
          collapsed
            ? "tw-opacity-0 tw-scale-75 tw-pointer-events-none"
            : "tw-opacity-100 tw-scale-100"
        }`}
      >
        <Image
          unoptimized
          loading="eager"
          priority
          alt="6529Seize"
          src="/6529.png"
          className="tw-h-10 tw-w-10 tw-flex-shrink-0 tw-transition-all tw-duration-100 hover:tw-scale-[1.02] desktop-hover:hover:tw-shadow-[0_0_20px_10px_rgba(255,215,215,0.3)]"
          width={40}
          height={40}
        />
      </Link>

      <button
        type="button"
        onClick={onToggle}
        onMouseDown={(event) => event.preventDefault()}
        className={`tw-group tw-size-8 tw-flex-shrink-0 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-iron-700 tw-border tw-border-iron-700 tw-border-solid tw-backdrop-blur-sm tw-shadow-[0_10px_24px_rgba(0,0,0,0.45)] desktop-hover:hover:tw-bg-iron-650 desktop-hover:hover:tw-border-iron-650 desktop-hover:hover:tw-shadow-[0_12px_30px_rgba(0,0,0,0.55)] tw-absolute tw-transition-all tw-duration-300 tw-ease-in-out ${
          collapsed ? "tw-left-4" : "tw-right-4"
        }`}
        aria-label={collapsed ? "Expand" : "Collapse"}
        aria-expanded={!collapsed}
      >
        <ChevronDoubleLeftIcon
          strokeWidth={2}
          className={`tw-h-5 tw-w-5 tw-flex-shrink-0 tw-text-iron-200 group-hover:desktop-hover:hover:tw-text-white tw-transition-all tw-duration-300 tw-ease-in-out ${
            collapsed ? "tw-rotate-180" : ""
          }`}
        />
      </button>
    </div>
  );
}

export default WebSidebarHeader;
