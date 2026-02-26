"use client";

import { HeartIcon } from "@heroicons/react/24/outline";
import clsx from "clsx";
import Link from "next/link";

import type { ComponentProps } from "react";

type NetworkHealthCTAProps = Omit<ComponentProps<typeof Link>, "href" | "children">;

export default function NetworkHealthCTA({
  className,
  ...props
}: NetworkHealthCTAProps) {
  return (
    <Link
      href="/network/health"
      aria-label="Open network health dashboard"
      title="Network health"
      {...props}
      className={clsx(
        "tw-bg-red/8 desktop-hover:hover:tw-bg-red/18 tw-group tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-red/35 tw-text-red/85 tw-no-underline tw-shadow-[0_0_12px_rgba(249,112,102,0.16)] tw-backdrop-blur-sm tw-transition-all tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-red/40 active:tw-scale-95 desktop-hover:hover:tw-border-red/55 desktop-hover:hover:tw-text-red desktop-hover:hover:tw-shadow-[0_0_22px_rgba(249,112,102,0.26)]",
        className
      )}
    >
      <HeartIcon className="tw-h-4 tw-w-4" aria-hidden />
    </Link>
  );
}
