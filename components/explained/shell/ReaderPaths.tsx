import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { withCc0 } from "../marks/Cc0";
import { EX_FOCUS } from "../tokens";

/**
 * "Who are you reading as?" (EXPLAINED.md §6.2): a few pages in order for
 * each reader, with the time it takes.
 */
export interface ReaderPath {
  readonly who: string;
  readonly route: string;
  /** Minutes, from the page's facts or the path's own count. */
  readonly minutes: number;
  /** Words after the time: "more with chapter 02". */
  readonly more?: string;
  readonly href: string;
}

export default function ReaderPaths({
  paths,
  locale,
}: {
  readonly paths: readonly ReaderPath[];
  readonly locale: SupportedLocale;
}) {
  return (
    <ul
      aria-label={kt(locale, "explained.kit.paths.label")}
      // Two short tiles a row on a phone, each who and time only, so the
      // eight paths take two screens less; the route shows from a tablet.
      className={`tw-m-0 tw-grid tw-list-none tw-grid-cols-2 tw-gap-2.5 tw-p-0 md:tw-gap-3.5 ${
        paths.length === 7
          ? // Seven paths: four, then three that fill the row, never an empty slot.
            "xl:tw-grid-cols-12 xl:[&>li:nth-child(-n+4)]:tw-col-span-3 xl:[&>li:nth-child(n+5)]:tw-col-span-4"
          : "xl:tw-grid-cols-4"
      }`}
    >
      {paths.map((path) => (
        <li key={path.who}>
          <Link
            href={path.href}
            className={`tw-flex tw-h-full tw-flex-col tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-3.5 tw-pb-3.5 tw-pt-3.5 tw-no-underline hover:tw-border-iron-700 md:tw-px-5 md:tw-pb-[18px] md:tw-pt-5 ${EX_FOCUS}`}
          >
            <span className="tw-block tw-text-base tw-font-semibold tw-leading-[22px] tw-text-iron-50 md:tw-text-lg md:tw-leading-[25px]">
              {path.who}
            </span>
            <span className="tw-mt-2 tw-hidden tw-text-[15px] tw-leading-6 tw-text-iron-300 md:tw-block">
              {withCc0(path.route)}
            </span>
            {/* The time sits on the card's foot, so a row of cards reads as a grid. */}
            <span className="tw-mt-auto tw-block tw-pt-3 tw-text-[13px] tw-font-semibold tw-text-primary-300">
              {kt(locale, "explained.kit.paths.minutes", {
                minutes: path.minutes,
              })}
              {path.more ? ` · ${path.more}` : ""}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
