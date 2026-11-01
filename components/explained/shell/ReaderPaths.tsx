import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
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
      className={`tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-3.5 tw-p-0 md:tw-grid-cols-2 ${
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
            className={`tw-block tw-h-full tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950 tw-px-5 tw-pb-[18px] tw-pt-5 tw-no-underline hover:tw-border-iron-700 ${EX_FOCUS}`}
          >
            <span className="tw-block tw-text-lg tw-font-semibold tw-leading-[25px] tw-text-iron-50">
              {path.who}
            </span>
            <span className="tw-mt-2 tw-block tw-text-[15px] tw-leading-[23px] tw-text-iron-400">
              {path.route}
            </span>
            <span className="tw-mt-3 tw-block tw-text-[13px] tw-font-semibold tw-text-primary-300">
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
