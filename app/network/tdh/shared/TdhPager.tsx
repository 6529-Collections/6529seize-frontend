import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { TDH_PAGES, type TdhPageHref } from "./TdhSubnav";
import { TDH_FOCUS_RING } from "./tdhStyles";

const CARD = `tw-group tw-flex tw-min-h-11 tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-1 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-3 tw-no-underline tw-transition-colors hover:tw-border-primary-400/50 motion-reduce:tw-transition-none ${TDH_FOCUS_RING}`;

/** Previous and next page of the TDH section, at the end of each page. */
export default function TdhPager({
  current,
  locale,
}: {
  readonly current: TdhPageHref;
  readonly locale: SupportedLocale;
}) {
  const index = TDH_PAGES.findIndex((page) => page.href === current);
  const previous = index > 0 ? TDH_PAGES[index - 1] : undefined;
  const next = index >= 0 ? TDH_PAGES[index + 1] : undefined;
  const label = (key: string) =>
    t(locale, `network.tdh.shared.nav.${key}` as MessageKey);
  return (
    <nav
      aria-label={t(locale, "network.tdh.shared.pager")}
      className="tw-mt-12 tw-flex tw-flex-col tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8 sm:tw-flex-row"
    >
      {previous ? (
        <Link href={previous.href} className={CARD} rel="prev">
          <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-text-iron-400">
            <ArrowLeftIcon aria-hidden="true" className="tw-size-3.5" />
            {t(locale, "network.tdh.shared.pager.previous")}
          </span>
          <span className="tw-text-base tw-font-medium tw-text-iron-50 group-hover:tw-text-primary-300">
            {label(previous.key)}
          </span>
        </Link>
      ) : (
        <span className="tw-hidden tw-flex-1 sm:tw-block" />
      )}
      {next ? (
        <Link
          href={next.href}
          className={`${CARD} tw-items-end tw-text-right`}
          rel="next"
        >
          <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-text-iron-400">
            {t(locale, "network.tdh.shared.pager.next")}
            <ArrowRightIcon aria-hidden="true" className="tw-size-3.5" />
          </span>
          <span className="tw-text-base tw-font-medium tw-text-iron-50 group-hover:tw-text-primary-300">
            {label(next.key)}
          </span>
        </Link>
      ) : (
        <span className="tw-hidden tw-flex-1 sm:tw-block" />
      )}
    </nav>
  );
}
