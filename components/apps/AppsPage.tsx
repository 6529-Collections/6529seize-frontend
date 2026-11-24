"use client";

import {
  ChevronDownIcon,
  ComputerDesktopIcon,
  CpuChipIcon,
  DevicePhoneMobileIcon,
  ServerStackIcon,
} from "@heroicons/react/24/outline";
import Link from "next/link";
import { type ReactNode, useState } from "react";

import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  ABOUT_CARD_CLASS_NAME,
  ABOUT_PAGE_BOUNDARY_CLASS_NAME,
  ABOUT_PAGE_TITLE_CLASS_NAME,
  ABOUT_SECTION_HEADING_CLASS_NAME,
  ABOUT_SUPPORTING_TEXT_CLASS_NAME,
} from "@/components/about/AboutLayout";
import { useSetTitle } from "@/contexts/TitleContext";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { DEFAULT_LOCALE } from "@/i18n/locales";
import { t } from "@/i18n/messages";
import { DesktopAppDownloads } from "./DesktopAppDownloads";
import { MobileAppDownloads } from "./MobileAppDownloads";

const APPS_LOCALE = DEFAULT_LOCALE;

export default function AppsPage() {
  useSetTitle(t(APPS_LOCALE, "apps.metadata.title"));

  return (
    <main
      className={`tailwind-scope ${ABOUT_PAGE_BOUNDARY_CLASS_NAME} tw-bg-black tw-text-iron-50`}
    >
      <AboutContentsDropdown
        className="tw-w-full tw-px-4 sm:tw-px-6 lg:tw-px-8"
        currentHref="/about/6529-apps"
        flushBottom
        withDivider
      />

      <div className="tw-mx-auto tw-w-full tw-max-w-6xl tw-px-4 tw-pb-16 tw-pt-8 sm:tw-px-6 sm:tw-pt-12 lg:tw-px-8">
        <header className="tw-mb-8 tw-max-w-3xl">
          <p className="tw-mb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-wide tw-text-primary-300">
            {t(APPS_LOCALE, "apps.eyebrow")}
          </p>
          <h1 className={ABOUT_PAGE_TITLE_CLASS_NAME}>
            {t(APPS_LOCALE, "apps.title")}
          </h1>
        </header>

        <div className="tw-grid tw-gap-5">
          <AppPanel
            id="6529-mobile"
            icon={DevicePhoneMobileIcon}
            title={t(APPS_LOCALE, "apps.mobile.title")}
            description={t(APPS_LOCALE, "apps.mobile.description")}
            mobile
          >
            <MobileAppDownloads />
          </AppPanel>

          <Link
            href="/desktop"
            aria-labelledby="6529-desktop-test-heading"
            aria-describedby="6529-desktop-test-description"
            className="tw-block tw-rounded-xl tw-no-underline tw-transition-colors hover:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400"
          >
            <AppPanel
              id="6529-desktop-test"
              icon={ComputerDesktopIcon}
              title={t(APPS_LOCALE, "apps.newDesktop.title")}
              description={t(APPS_LOCALE, "apps.newDesktop.description")}
              linked
            />
          </Link>

          <DesktopClassicPanel />

          <Link
            href="/validator"
            aria-labelledby="6529-validator-heading"
            aria-describedby="6529-validator-description"
            className="tw-block tw-rounded-xl tw-no-underline tw-transition-colors hover:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400"
          >
            <AppPanel
              id="6529-validator"
              icon={ServerStackIcon}
              title={t(APPS_LOCALE, "apps.validator.title")}
              description={t(APPS_LOCALE, "apps.validator.description")}
              linked
            />
          </Link>

          <Link
            href="/ai"
            aria-labelledby="6529-ai-heading"
            aria-describedby="6529-ai-description"
            className="tw-block tw-rounded-xl tw-no-underline tw-transition-colors hover:tw-bg-iron-900 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-4 focus-visible:tw-outline-primary-400"
          >
            <AppPanel
              id="6529-ai"
              icon={CpuChipIcon}
              title={t(APPS_LOCALE, "apps.ai.title")}
              description={t(APPS_LOCALE, "apps.ai.description")}
              linked
            />
          </Link>
        </div>
      </div>
    </main>
  );
}

function DesktopClassicPanel() {
  const hasHydrated = useHasHydrated();
  const [{ expanded, platformResetKey }, setDisclosure] = useState({
    expanded: false,
    platformResetKey: 0,
  });

  const toggle = () => {
    setDisclosure((current) => ({
      expanded: !current.expanded,
      platformResetKey: current.expanded
        ? current.platformResetKey
        : current.platformResetKey + 1,
    }));
  };

  return (
    <section
      id="6529-desktop"
      aria-labelledby="6529-desktop-heading"
      className={`${ABOUT_CARD_CLASS_NAME} tw-overflow-hidden`}
    >
      <h2 className="tw-m-0" aria-labelledby="6529-desktop-heading">
        <button
          type="button"
          aria-controls="desktop-classic-downloads"
          aria-expanded={expanded}
          aria-labelledby="6529-desktop-heading"
          aria-describedby="6529-desktop-description"
          disabled={!hasHydrated}
          onClick={toggle}
          className="tw-flex tw-w-full tw-items-center tw-gap-3 tw-border-0 tw-bg-transparent tw-p-5 tw-text-left enabled:hover:tw-bg-iron-900/60 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-3px] focus-visible:tw-outline-primary-400 sm:tw-p-6"
        >
          <AppPanelIcon icon={ComputerDesktopIcon} />
          <span className="tw-grid tw-min-w-0 tw-flex-1">
            <span
              id="6529-desktop-heading"
              className={ABOUT_SECTION_HEADING_CLASS_NAME}
            >
              {t(APPS_LOCALE, "apps.desktop.title")}
            </span>
            <span
              id="6529-desktop-description"
              className={ABOUT_SUPPORTING_TEXT_CLASS_NAME}
            >
              {t(APPS_LOCALE, "apps.desktop.description")}
            </span>
          </span>
          <ChevronDownIcon
            aria-hidden="true"
            className={`tw-size-4 tw-shrink-0 tw-text-iron-300 motion-safe:tw-transition-transform motion-safe:tw-duration-[180ms] motion-safe:tw-ease-out ${expanded ? "tw-rotate-180" : ""}`}
          />
        </button>
      </h2>
      <div
        id="desktop-classic-downloads"
        inert={!expanded}
        className={`tw-grid motion-safe:tw-transition-[grid-template-rows] motion-safe:tw-duration-[180ms] motion-safe:tw-ease-out ${expanded ? "tw-grid-rows-[1fr]" : "tw-grid-rows-[0fr]"}`}
      >
        <div className="tw-min-h-0 tw-overflow-hidden">
          <DesktopAppDownloads platformResetKey={platformResetKey} />
        </div>
      </div>
    </section>
  );
}

function AppPanelIcon({
  icon: Icon,
}: {
  readonly icon: typeof DevicePhoneMobileIcon;
}) {
  return (
    <span className="tw-flex tw-size-12 tw-flex-none tw-items-center tw-justify-center tw-rounded-lg tw-border tw-border-solid tw-border-white/10 tw-bg-iron-900 tw-text-primary-300">
      <Icon aria-hidden="true" className="tw-size-7" />
    </span>
  );
}

function AppPanel({
  id,
  icon,
  title,
  description,
  children,
  mobile = false,
  linked = false,
}: {
  readonly id: string;
  readonly icon: typeof DevicePhoneMobileIcon;
  readonly title: string;
  readonly description: string;
  readonly children?: ReactNode;
  readonly mobile?: boolean;
  readonly linked?: boolean;
}) {
  const headingId = `${id}-heading`;
  const Panel = linked ? "div" : "section";

  return (
    <Panel
      id={id}
      aria-labelledby={linked ? undefined : headingId}
      className={`${ABOUT_CARD_CLASS_NAME} ${mobile ? "tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-5 tw-p-5 sm:tw-p-6" : "tw-overflow-hidden"}`}
    >
      <div
        className={`tw-flex tw-items-center tw-gap-3 ${mobile ? "" : "tw-p-5 sm:tw-p-6"}`}
      >
        <AppPanelIcon icon={icon} />
        <div className="tw-min-w-0">
          <h2 id={headingId} className={ABOUT_SECTION_HEADING_CLASS_NAME}>
            {title}
          </h2>
          <p
            id={linked ? `${id}-description` : undefined}
            className={`tw-m-0 ${ABOUT_SUPPORTING_TEXT_CLASS_NAME}`}
          >
            {description}
          </p>
        </div>
      </div>
      <div className={mobile ? "tw-min-w-0 tw-max-w-full" : undefined}>
        {children}
      </div>
    </Panel>
  );
}
