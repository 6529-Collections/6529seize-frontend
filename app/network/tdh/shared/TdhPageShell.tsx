import type { ReactNode } from "react";
import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import {
  NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES,
  NETWORK_REFERENCE_PAGE_CLASSES,
} from "@/components/network/networkPageLayoutClasses";
import type { SupportedLocale } from "@/i18n/locales";
import TdhPageTitle from "./TdhPageTitle";
import TdhSubnav, { type TdhPageHref } from "./TdhSubnav";

/**
 * The frame of every TDH sub-page: the About contents menu, the TDH section
 * navigation, then a header with the H1, status pills and lede.
 */
export default function TdhPageShell({
  locale,
  current,
  dropdownHref,
  documentTitle,
  title,
  pills,
  lede,
  children,
  headerExtra,
}: {
  readonly locale: SupportedLocale;
  readonly current: TdhPageHref;
  readonly dropdownHref: string;
  readonly documentTitle: string;
  readonly title: string;
  readonly pills?: ReactNode;
  readonly lede?: ReactNode;
  readonly headerExtra?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <div className={NETWORK_REFERENCE_PAGE_CLASSES}>
      <TdhPageTitle title={documentTitle} />
      <AboutContentsDropdown
        className={NETWORK_REFERENCE_DROPDOWN_ROW_CLASSES}
        currentHref={dropdownHref}
        locale={locale}
        desktopFlush
        withDivider
      />
      <article className="tw-mx-auto tw-max-w-6xl tw-pb-8">
        <TdhSubnav current={current} locale={locale} />
        <header
          id="top"
          className="tw-scroll-mt-24 tw-pb-8 tw-pt-5 sm:tw-pb-10 sm:tw-pt-8"
        >
          <h1 className="tw-m-0 tw-text-2xl tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-3xl">
            {title}
          </h1>
          {pills !== undefined && (
            <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              {pills}
            </div>
          )}
          {lede !== undefined && (
            <div className="tw-mt-4 tw-max-w-3xl tw-space-y-3 tw-text-base tw-leading-7 tw-text-iron-200">
              {lede}
            </div>
          )}
          {headerExtra}
        </header>
        {children}
      </article>
    </div>
  );
}
