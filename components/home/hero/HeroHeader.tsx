"use client";

import { HeartIcon } from "@heroicons/react/24/solid";
import Link from "next/link";

export default function HeroHeader() {
  return (
    <section
      data-home-section="Introduction"
      className="tw-relative tw-px-4 tw-pb-6 tw-pt-10 tw-text-left tw-@container md:tw-px-6 md:tw-pb-8 md:tw-pt-12 lg:tw-px-8"
    >
      <Link
        data-home-action="Open network health"
        href="/network/health"
        aria-label="Open network health dashboard"
        title="Network health"
        className="tw-bg-red/8 desktop-hover:hover:tw-bg-red/18 tw-fixed tw-right-4 tw-top-4 tw-z-40 tw-hidden tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-red/35 tw-text-red/85 tw-no-underline tw-shadow-[0_0_12px_rgba(249,112,102,0.16)] tw-backdrop-blur-sm tw-transition-colors tw-duration-200 tw-ease-out focus-visible:tw-border-red/55 focus-visible:tw-text-red focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-red/40 active:tw-bg-red/20 desktop-hover:hover:tw-border-red/55 desktop-hover:hover:tw-text-red motion-reduce:tw-transition-none md:tw-right-6 md:tw-top-5 md:tw-inline-flex [.capacitor-native_&]:tw-hidden"
      >
        <span className="tw-relative tw-inline-flex tw-items-center tw-justify-center">
          <HeartIcon className="tw-relative tw-size-4" aria-hidden />
        </span>
      </Link>
      <p className="tw-mb-4 tw-mt-0 tw-text-xs tw-font-medium tw-uppercase tw-leading-4 tw-tracking-wider tw-text-iron-400 md:tw-mb-5">
        6529
      </p>
      <h1 className="tw-m-0 tw-max-w-4xl tw-text-[clamp(2rem,10vw,2.375rem)] tw-font-semibold tw-leading-[1.02] tw-tracking-[-0.04em] tw-text-iron-50 md:tw-text-5xl lg:tw-text-6xl">
        Building a decentralized <span className="tw-block">network state</span>
      </h1>
    </section>
  );
}
