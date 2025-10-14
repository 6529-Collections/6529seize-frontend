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
        className="tw-relative tw-z-10 tw-flex tw-items-center tw-ml-1.5 tw-ease-in-out"
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
        className={`tw-group tw-absolute tw-top-1/2 -tw-translate-y-1/2 tw-right-0 tw-flex tw-items-center tw-justify-center tw-h-8 tw-w-8 tw-rounded-xl tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 w-backdrop-blur-sm tw-shadow-[0_12px_28px_rgba(0,0,0,0.35)] tw-transition tw-duration-300 tw-ease-out desktop-hover:hover:tw-border-iron-500/80 desktop-hover:hover:tw-bg-iron-700/85 desktop-hover:hover:tw-shadow-[0_16px_34px_rgba(0,0,0,0.4)] ${
          collapsed ? "-tw-right-6 tw-rotate-180" : " tw-right-4"
        }`}
        aria-label="Toggle right sidebar"
      >
        <ChevronDoubleLeftIcon
          strokeWidth={2}
          className={`tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-200 group-hover:desktop-hover:hover:tw-text-white tw-transition-all tw-duration-300 tw-ease-in-out ${
            collapsed ? "" : ""
          }`}
        />
      </button>
    </div>
  );
}

export default WebSidebarHeader;
