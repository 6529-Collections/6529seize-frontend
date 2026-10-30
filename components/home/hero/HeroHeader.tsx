"use client";

import { HeartIcon } from "@heroicons/react/24/solid";
import Link from "next/link";
import type { ReactNode } from "react";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export default function HeroHeader({
  children,
}: {
  readonly children?: ReactNode;
}) {
  const locale = useBrowserLocale();
  return (
    <section
      data-home-section="Introduction"
      className="tw-relative tw-px-4 tw-pb-10 tw-pt-10 tw-text-left tw-@container md:tw-px-6 md:tw-py-16 lg:tw-px-8 lg:tw-py-20"
    >
      <Link
        data-home-action="Open network health"
        href="/network/health"
        aria-label={t(locale, "home.hero.healthLabel")}
        title={t(locale, "home.hero.healthTitle")}
        className="tw-bg-red/8 desktop-hover:hover:tw-bg-red/18 tw-fixed tw-right-4 tw-top-4 tw-z-40 tw-hidden tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-red/35 tw-text-red/85 tw-no-underline tw-shadow-[0_0_12px_rgba(249,112,102,0.16)] tw-backdrop-blur-sm tw-transition-colors tw-duration-200 tw-ease-out focus-visible:tw-border-red/55 focus-visible:tw-text-red focus-visible:tw-outline-none focus-visible:tw-ring-2 focus-visible:tw-ring-primary-400 active:tw-bg-red/20 desktop-hover:hover:tw-border-red/55 desktop-hover:hover:tw-text-red motion-reduce:tw-transition-none md:tw-right-6 md:tw-top-5 md:tw-inline-flex [.capacitor-native_&]:tw-hidden"
      >
        <span className="tw-relative tw-inline-flex tw-items-center tw-justify-center">
          <HeartIcon className="tw-relative tw-size-4" aria-hidden />
        </span>
      </Link>
      <div className="tw-mx-auto tw-max-w-[1200px]">
        <div className="tw-min-w-0">
          <p className="tw-m-0 tw-text-xs tw-font-medium tw-leading-4 tw-tracking-[0.2em] tw-text-iron-400">
            6529
          </p>
          <h1 className="tw-mb-0 tw-mt-6 tw-max-w-[1000px] tw-text-balance tw-text-[clamp(2.375rem,10cqw,3.5rem)] tw-font-semibold tw-leading-[1.06] tw-tracking-[-0.05em] tw-text-iron-50 lg:tw-text-[clamp(2.375rem,5.7cqw,4.5rem)]">
            {t(locale, "home.hero.title")}
          </h1>
          <p className="tw-mb-0 tw-mt-6 tw-max-w-[720px] tw-text-pretty tw-text-base tw-leading-relaxed tw-text-iron-300 md:tw-mt-8 md:tw-text-lg">
            {t(locale, "home.hero.description")}
          </p>
          {children}
        </div>
      </div>
    </section>
  );
}
