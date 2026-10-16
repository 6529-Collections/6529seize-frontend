import type { ReactNode } from "react";
import { AboutContentsDropdown } from "@/components/about/AboutContentsDropdown";
import type { SupportedLocale } from "@/i18n/locales";
import TdhPageTitle from "./TdhPageTitle";
import TdhSubnav, { type TdhPageHref } from "./TdhSubnav";
import {
  TDH_DROPDOWN_ROW,
  TDH_H1,
  TDH_LEDE,
  TDH_PAGE,
  TDH_PAGE_HEADER_TOP,
} from "./tdhStyles";

/**
 * The frame of every TDH sub-page: the About contents menu, the TDH section
 * navigation, then a header with the H1, status pills and lede; the section
 * tabs above say which page it is, so it carries no eyebrow.
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
    <div className={TDH_PAGE}>
      <TdhPageTitle title={documentTitle} />
      <AboutContentsDropdown
        className={TDH_DROPDOWN_ROW}
        currentHref={dropdownHref}
        locale={locale}
        desktopFlush
        withDivider
      />
      <article className="tw-mx-auto tw-max-w-6xl tw-pb-8">
        <TdhSubnav current={current} locale={locale} />
        <header
          id="top"
          className={`tw-scroll-mt-24 tw-pb-8 sm:tw-pb-10 ${TDH_PAGE_HEADER_TOP}`}
        >
          <h1 className={TDH_H1}>{title}</h1>
          {pills !== undefined && (
            <div className="tw-mt-3 tw-flex tw-flex-wrap tw-items-center tw-gap-2">
              {pills}
            </div>
          )}
          {lede !== undefined && (
            <div className={`tw-mt-4 tw-max-w-[38em] tw-space-y-3 ${TDH_LEDE}`}>
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
