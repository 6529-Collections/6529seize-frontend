import Link from "next/link";
import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { Icon } from "../marks/glyphs";
import Track, { type Maturity } from "../marks/Track";
import { EX_FOCUS } from "../tokens";

/**
 * The chapters on the hub (EXPLAINED.md §6.2): a live chapter has its blue
 * number and a link; a coming one its place in the order, what it waits on,
 * no link and no number until it ships.
 */
export interface ChapterIndexRow {
  readonly id: string;
  /** "01" when live; "Next", "Then", "Later", "Last" while coming. */
  readonly order: string;
  readonly title: string;
  readonly question: string;
  readonly maturity: Maturity;
  /** The maturity's own words: "Live subject", "Built, 0.1.0". */
  readonly maturityLabel?: string;
  /** "checked every day since Oct 14", or what it waits on. */
  readonly note: ReactNode;
  readonly href?: string;
}

const ROW =
  "tw-grid tw-grid-cols-[40px_minmax(0,1fr)] tw-items-center tw-gap-x-3 tw-gap-y-2 tw-py-5 lg:tw-grid-cols-[72px_minmax(0,1fr)_280px_140px] lg:tw-gap-x-6 md:tw-py-6";

export default function ChapterIndex({
  rows,
  locale,
}: {
  readonly rows: readonly ChapterIndexRow[];
  readonly locale: SupportedLocale;
}) {
  return (
    <ol
      aria-label={kt(locale, "explained.kit.chapters.label")}
      className="tw-m-0 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-p-0"
    >
      {rows.map((row) => {
        const live = row.href !== undefined;
        const body = (
          <>
            <span
              className={`tw-text-[17px] tw-font-semibold ${live ? "tw-text-primary-300" : "tw-text-iron-400"}`}
            >
              {row.order}
            </span>
            <span>
              <span
                className={`tw-block tw-text-[21px] tw-font-semibold tw-leading-[27px] tw-tracking-[-0.015em] md:tw-text-[26px] md:tw-leading-8 ${live ? "tw-text-iron-50" : "tw-text-iron-300"}`}
              >
                {row.title}
              </span>
              <span className="tw-mt-1 tw-block tw-text-base tw-leading-6 tw-text-iron-400">
                {row.question}
              </span>
            </span>
            <span className="tw-col-start-2 tw-flex tw-flex-col tw-gap-1.5 tw-text-sm tw-leading-5 tw-text-iron-400 lg:tw-col-start-3">
              {/* The status answers the legend's question, so it says which. */}
              <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.1em] tw-text-iron-400">
                {kt(locale, "explained.kit.chapters.runs")}
              </span>
              <Track
                maturity={row.maturity}
                locale={locale}
                size="sm"
                {...(row.maturityLabel ? { label: row.maturityLabel } : {})}
              />
              <span>{row.note}</span>
            </span>
            <span className="tw-col-start-2 tw-justify-self-start lg:tw-col-start-4 lg:tw-justify-self-end">
              {live ? (
                <span className="tw-inline-flex tw-items-center tw-gap-1.5 tw-text-base tw-font-semibold tw-text-primary-300">
                  {kt(locale, "explained.kit.chapters.read")}
                  <Icon kind="arrow" className="tw-size-[15px]" />
                </span>
              ) : (
                <span className="tw-text-[15px] tw-text-iron-400">
                  {kt(locale, "explained.kit.chapters.coming")}
                </span>
              )}
            </span>
          </>
        );
        return (
          <li
            key={row.id}
            className={`tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 ${live ? "tw-bg-[linear-gradient(90deg,rgba(82,139,255,0.07),transparent_70%)]" : ""}`}
            data-chapter={row.id}
          >
            {live && row.href ? (
              <Link
                href={row.href}
                className={`${ROW} tw-no-underline ${EX_FOCUS}`}
              >
                {body}
              </Link>
            ) : (
              <div className={ROW}>{body}</div>
            )}
          </li>
        );
      })}
    </ol>
  );
}
