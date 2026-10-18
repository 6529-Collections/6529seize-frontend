import Link from "next/link";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { Icon } from "../marks/glyphs";
import { EX_FOCUS } from "../tokens";

/**
 * A chapter's pages, numbered (EXPLAINED.md §6.2): the spine 1 to 4 in blue,
 * then the shelf S1 to S5, titles only.
 */
export interface PageIndexRow {
  readonly no: string;
  readonly title: string;
  readonly desc?: string;
  readonly href: string;
  readonly shelf?: boolean;
}

export default function PageIndex({
  rows,
  locale,
}: {
  readonly rows: readonly PageIndexRow[];
  readonly locale: SupportedLocale;
}) {
  return (
    <ol
      aria-label={kt(locale, "explained.kit.index.label")}
      className="tw-m-0 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-p-0"
    >
      {rows.map((row) => (
        <li
          key={row.href}
          className="tw-border-0 tw-border-b tw-border-solid tw-border-iron-900"
        >
          <Link
            href={row.href}
            className={`tw-grid tw-grid-cols-[40px_minmax(0,1fr)] tw-items-baseline tw-gap-x-3 tw-gap-y-1 tw-py-5 tw-no-underline hover:tw-bg-white/[0.015] md:tw-grid-cols-[56px_minmax(0,1fr)_minmax(0,1.2fr)_30px] md:tw-gap-x-5 ${EX_FOCUS}`}
          >
            <span
              className={`tw-text-[15px] tw-font-semibold ${row.shelf ? "tw-text-iron-400" : "tw-text-primary-300"}`}
            >
              {row.no}
            </span>
            <span
              className={`tw-font-semibold tw-text-iron-50 ${row.shelf ? "tw-text-lg tw-leading-6" : "tw-text-[21px] tw-leading-7"}`}
            >
              {row.title}
            </span>
            {row.desc !== undefined && (
              <span className="tw-col-start-2 tw-text-base tw-leading-6 tw-text-iron-400 md:tw-col-start-3">
                {row.desc}
              </span>
            )}
            <span className="tw-hidden tw-justify-self-end tw-text-iron-400 md:tw-col-start-4 md:tw-row-start-1 md:tw-block">
              <Icon kind="arrow" />
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}
