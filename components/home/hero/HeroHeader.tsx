"use client";

import { HeartIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function HeroHeader() {
  return (
    <section className="tw-relative tw-max-w-xl tw-px-4 tw-pt-10 md:tw-mx-auto md:tw-max-w-3xl md:tw-px-6 md:tw-text-center lg:tw-px-8">
      <Link
        href="/network/health"
        aria-label="Open network health dashboard"
        title="Network health"
        className="tw-bg-red/8 desktop-hover:hover:tw-bg-red/18 tw-group tw-fixed tw-right-4 tw-top-4 tw-z-40 tw-inline-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-red/35 tw-text-red/85 tw-no-underline tw-shadow-[0_0_12px_rgba(249,112,102,0.16)] tw-backdrop-blur-sm tw-transition-all tw-duration-300 focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-red/40 active:tw-scale-95 desktop-hover:hover:tw-border-red/55 desktop-hover:hover:tw-text-red desktop-hover:hover:tw-shadow-[0_0_22px_rgba(249,112,102,0.26)] md:tw-right-6 md:tw-top-5"
      >
        <span className="tw-relative tw-inline-flex tw-items-center tw-justify-center">
          <HeartIcon
            className="tw-relative tw-size-4 tw-opacity-90 tw-transition-opacity tw-duration-300 group-hover:tw-opacity-100 motion-safe:tw-animate-heart-beat-soft motion-reduce:tw-animate-none"
            aria-hidden
          />
        </span>
      </Link>
      <p className="tw-mx-auto tw-mb-2 tw-text-balance tw-text-xs tw-uppercase tw-tracking-[0.2em] tw-text-iron-500">
        6529
      </p>
      <h1 className="tw-mb-3 tw-text-balance tw-text-3xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-100 md:tw-text-4xl">
        Building a decentralized network state
      </h1>
    </section>
  );
}
