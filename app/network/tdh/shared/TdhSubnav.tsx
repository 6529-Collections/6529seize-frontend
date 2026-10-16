import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { t, type MessageKey } from "@/i18n/messages";
import { TDH_FOCUS_RING } from "./tdhStyles";
import TdhSubnavScroll from "./TdhSubnavScroll";

export const TDH_PAGES = [
  { href: "/network/tdh", key: "overview" },
  { href: "/network/tdh/how-it-works", key: "how" },
  { href: "/network/tdh/specification", key: "spec" },
  { href: "/network/tdh/formal", key: "formal" },
  { href: "/network/tdh/implementations", key: "impl" },
  { href: "/network/tdh/verification", key: "verify" },
] as const;

export const TDH_MORE_PAGES = [
  { href: "/network/tdh/consolidation", key: "consolidation" },
  { href: "/network/tdh/historic-boosts", key: "historic" },
  { href: "/network/tdh#glossary", key: "glossary" },
] as const;

export type TdhPageHref = (typeof TDH_PAGES)[number]["href"];
export type TdhMorePageHref = Exclude<
  (typeof TDH_MORE_PAGES)[number]["href"],
  "/network/tdh#glossary"
>;

const ITEM = `tw-inline-flex tw-min-h-11 tw-shrink-0 tw-items-center tw-whitespace-nowrap tw-rounded-lg tw-px-3 tw-text-sm tw-font-medium tw-no-underline tw-transition-colors motion-reduce:tw-transition-none ${TDH_FOCUS_RING}`;
const CURRENT =
  "tw-bg-iron-800 tw-text-iron-50 tw-shadow-[inset_0_-2px_0_0] tw-shadow-primary-400";

/**
 * The TDH section navigation (plan §3.2), shared by every TDH page,
 * including the consolidation guide and historic boosts. It is one row at
 * every width: where it does not fit, it scrolls sideways inside its own
 * region with edge fades, starting at the current page, and the page itself
 * never scrolls sideways.
 */
export default function TdhSubnav({
  current,
  locale,
}: {
  readonly current: TdhPageHref | TdhMorePageHref;
  readonly locale: SupportedLocale;
}) {
  const label = (key: string) =>
    t(locale, `network.tdh.shared.nav.${key}` as MessageKey);
  return (
    <nav
      aria-label={t(locale, "network.tdh.shared.nav.label")}
      className="tw-relative -tw-mx-3 tw-mb-2 tw-mt-1 lg:tw-mx-0"
    >
      <TdhSubnavScroll className="tw-overflow-x-auto tw-px-3 tw-scrollbar-none lg:tw-px-0">
        <ul className="tw-m-0 tw-flex tw-w-max tw-list-none tw-items-center tw-gap-1 tw-p-0">
          {TDH_PAGES.map((page) => {
            const isCurrent = page.href === current;
            return (
              <li key={page.href}>
                <Link
                  href={page.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`${ITEM} ${
                    isCurrent
                      ? CURRENT
                      : "tw-text-iron-300 hover:tw-bg-iron-900 hover:tw-text-iron-50"
                  }`}
                >
                  {label(page.key)}
                </Link>
              </li>
            );
          })}
          <li
            aria-hidden="true"
            className="tw-mx-1 tw-h-5 tw-w-px tw-bg-iron-800"
          />
          {TDH_MORE_PAGES.map((page) => {
            const isCurrent = page.href === current;
            return (
              <li key={page.href}>
                <Link
                  href={page.href}
                  aria-current={isCurrent ? "page" : undefined}
                  className={`${ITEM} ${
                    isCurrent
                      ? CURRENT
                      : "tw-text-iron-400 hover:tw-bg-iron-900 hover:tw-text-iron-200"
                  }`}
                >
                  {label(page.key)}
                </Link>
              </li>
            );
          })}
        </ul>
      </TdhSubnavScroll>
    </nav>
  );
}
