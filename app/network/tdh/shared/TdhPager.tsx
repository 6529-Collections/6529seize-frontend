import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import {
  TDH_PAGES,
  TDH_MORE_PAGES,
  type TdhMorePageHref,
  type TdhPageHref,
} from "./TdhSubnav";
import { TDH_FOCUS_RING } from "./tdhStyles";

const CARD = `tw-group tw-flex tw-min-h-11 tw-min-w-0 tw-flex-1 tw-flex-col tw-gap-1 tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-3 tw-no-underline tw-transition-colors hover:tw-border-primary-400/50 motion-reduce:tw-transition-none ${TDH_FOCUS_RING}`;

/**
 * The six core pages, then the consolidation guide and historic boosts, and
 * last the overview's glossary, so the last page also leads somewhere.
 */
const SEQUENCE: ReadonlyArray<{ readonly href: string; readonly key: string }> =
  [...TDH_PAGES, ...TDH_MORE_PAGES];

/**
 * Previous and next page of the TDH section, at the end of each page. A card
 * with no partner (the first and last pages) keeps half the row, on its own
 * side, so it never stretches across the page.
 */
export default function TdhPager({
  current,
  locale,
}: {
  readonly current: TdhPageHref | TdhMorePageHref;
  readonly locale: SupportedLocale;
}) {
  const index = SEQUENCE.findIndex((page) => page.href === current);
  const previous = index > 0 ? SEQUENCE[index - 1] : undefined;
  const next = index >= 0 ? SEQUENCE[index + 1] : undefined;
  const label = (key: string) =>
    t(locale, `network.tdh.shared.nav.${key}` as MessageKey);
  return (
    <nav
      aria-label={t(locale, "network.tdh.shared.pager")}
      className="tw-mt-12 tw-flex tw-flex-col tw-gap-3 tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-pt-8 sm:tw-flex-row"
    >
      {previous ? (
        <Link
          href={previous.href}
          className={`${CARD} ${next ? "" : "sm:tw-max-w-[calc(50%_-_0.375rem)]"}`}
          rel="prev"
        >
          <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-xs tw-text-iron-400">
            <ArrowLeftIcon aria-hidden="true" className="tw-size-3.5" />
            {t(locale, "network.tdh.shared.pager.previous")}
          </span>
          <span className="tw-text-base tw-font-medium tw-text-iron-50 group-hover:tw-text-primary-300">
            {label(previous.key)}
          </span>
        </Link>
      ) : null}
      {next ? (
        <Link
          href={next.href}
          className={`${CARD} tw-items-end tw-text-right ${previous ? "" : "sm:tw-ml-auto sm:tw-max-w-[calc(50%_-_0.375rem)]"}`}
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
      ) : null}
    </nav>
  );
}
