"use client";

import {
  ComputerDesktopIcon,
  DevicePhoneMobileIcon,
} from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import { useSetTitle } from "@/contexts/TitleContext";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { DesktopAppDownloads } from "./DesktopAppDownloads";
import { MobileAppDownloads } from "./MobileAppDownloads";

const APPS_LOCALE = DEFAULT_LOCALE;

export default function AppsPage() {
  useSetTitle(t(APPS_LOCALE, "apps.metadata.title"));

  return (
    <main className="tailwind-scope tw-min-h-[100dvh] tw-w-full tw-overflow-x-hidden tw-bg-black tw-text-iron-50">
      <div className="tw-mx-auto tw-w-full tw-max-w-6xl tw-px-4 tw-pb-16 tw-pt-6 sm:tw-px-6 lg:tw-px-8">
        <AboutContentsDropdown currentHref="/about/6529-apps" />

        <header className="tw-mb-8 tw-max-w-3xl">
          <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-iron-400">
            {t(APPS_LOCALE, "apps.eyebrow")}
          </p>
          <h1 className="tw-m-0 tw-text-3xl tw-font-semibold tw-leading-tight tw-text-white md:tw-text-4xl">
            {t(APPS_LOCALE, "apps.title")}
          </h1>
        </header>

        <div className="tw-grid tw-gap-5 lg:tw-grid-cols-2">
          <AppPanel
            id="6529-mobile"
            icon={DevicePhoneMobileIcon}
            title={t(APPS_LOCALE, "apps.mobile.title")}
            description={t(APPS_LOCALE, "apps.mobile.description")}
            contentClassName="tw-flex tw-flex-1 tw-items-center tw-justify-center"
          >
            <MobileAppDownloads />
          </AppPanel>

          <AppPanel
            id="6529-desktop"
            icon={ComputerDesktopIcon}
            title={t(APPS_LOCALE, "apps.desktop.title")}
            description={t(APPS_LOCALE, "apps.desktop.description")}
          >
            <DesktopAppDownloads />
          </AppPanel>
        </div>
      </div>
    </main>
  );
}

function AppPanel({
  id,
  icon: Icon,
  title,
  description,
  children,
  contentClassName = "tw-mt-auto",
}: {
  readonly id: string;
  readonly icon: typeof DevicePhoneMobileIcon;
  readonly title: string;
  readonly description: string;
  readonly children: ReactNode;
  readonly contentClassName?: string | undefined;
}) {
  const headingId = `${id}-heading`;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className="tw-flex tw-h-full tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-white/10 tw-bg-iron-950/80 tw-p-5 sm:tw-p-6"
    >
      <div className="tw-mb-6 tw-flex tw-items-center tw-gap-4">
        <span className="tw-flex tw-size-11 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-text-primary-300">
          <Icon aria-hidden="true" className="tw-size-6" />
        </span>
        <div className="tw-min-w-0">
          <h2
            id={headingId}
            className="tw-m-0 tw-text-xl tw-font-semibold tw-leading-7 tw-text-white"
          >
            {title}
          </h2>
          <p className="tw-mb-0 tw-mt-1 tw-text-sm tw-leading-6 tw-text-iron-400">
            {description}
          </p>
        </div>
      </div>
      <div className={contentClassName}>{children}</div>
    </section>
  );
}
