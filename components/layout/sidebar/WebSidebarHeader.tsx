"use client";

import { ChevronDoubleLeftIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import Link from "next/link";
import EnvironmentBadge from "@/components/common/EnvironmentBadge";

interface WebSidebarHeaderProps {
  readonly collapsed: boolean;
  readonly onToggle: () => void;
}

function WebSidebarHeader({ collapsed, onToggle }: WebSidebarHeaderProps) {
  return (
    <div className="tw-relative tw-flex tw-h-16 tw-shrink-0 tw-items-center tw-justify-between tw-px-2">
      <Link
        href="/"
        className="tw-relative tw-z-10 tw-ml-3 tw-flex tw-size-10 tw-items-center tw-ease-in-out"
      >
        <Image
          unoptimized
          loading="eager"
          priority
          alt="6529Seize"
          src="/6529.svg"
          className="tw-h-10 tw-w-10 tw-flex-shrink-0 tw-transition-all tw-duration-100 hover:tw-scale-[1.02] desktop-hover:hover:tw-shadow-[0_0_20px_10px_rgba(255,215,215,0.3)]"
          width={40}
          height={40}
        />
      </Link>
      <div className="tw-pointer-events-none tw-absolute tw-left-10 tw-top-11 tw-flex -tw-translate-x-1/2 tw-justify-center">
        <EnvironmentBadge compact />
      </div>
      <button
        type="button"
        onClick={onToggle}
        onMouseDown={(event) => event.preventDefault()}
        className={`tw-absolute tw-top-1/2 tw-flex -tw-translate-y-1/2 tw-items-center tw-justify-center tw-border tw-border-solid tw-border-iron-700 tw-bg-iron-800 tw-shadow-[0_12px_28px_rgba(0,0,0,0.35)] desktop-hover:hover:tw-border-iron-600 desktop-hover:hover:tw-bg-iron-700 desktop-hover:hover:tw-shadow-[0_16px_34px_rgba(0,0,0,0.4)] ${
          collapsed
            ? "-tw-right-3 tw-h-6 tw-w-6 tw-rotate-180 tw-rounded-lg"
            : "tw-right-4 tw-h-8 tw-w-8 tw-rounded-xl"
        }`}
        aria-label="Toggle right sidebar"
      >
        <ChevronDoubleLeftIcon
          strokeWidth={2}
          className="tw-h-4 tw-w-4 tw-flex-shrink-0 tw-text-iron-200 tw-transition-all tw-duration-300 tw-ease-in-out group-hover:desktop-hover:hover:tw-text-white"
        />
      </button>
    </div>
  );
}

export default WebSidebarHeader;
