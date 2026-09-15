"use client";

import Image from "next/image";
import Link from "next/link";
import EnvironmentBadge from "@/components/common/EnvironmentBadge";

interface WebSidebarHeaderProps {
  readonly collapsed: boolean;
}

function WebSidebarHeader({ collapsed }: WebSidebarHeaderProps) {
  return (
    <div className="tw-relative tw-shrink-0 tw-px-2">
      <div className="tw-flex tw-h-16 tw-items-center tw-justify-between">
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
      </div>
      <div
        className={`tw-flex tw-pb-2 empty:tw-hidden ${
          collapsed ? "tw-justify-center" : "tw-ml-3 tw-justify-start"
        }`}
      >
        <EnvironmentBadge compact />
      </div>
    </div>
  );
}

export default WebSidebarHeader;
