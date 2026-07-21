"use client";

import { ChevronDownIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";
import { DEFAULT_LOCALE, type SupportedLocale } from "@/i18n/locales";
import { t } from "@/i18n/messages";

export const STATS_SECTION_HEADING_CLASS =
  "tw-mb-0 tw-text-lg tw-font-semibold tw-text-iron-100";

export const STATS_TABLE_CLASS =
  "tw-w-full tw-border-collapse tw-text-left tw-text-sm";

export const STATS_TABLE_HEAD_CLASS =
  "tw-bg-white/[0.04] tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500";

export const STATS_TABLE_HEADER_CELL_CLASS =
  "tw-whitespace-nowrap tw-px-4 tw-py-3 tw-font-semibold";

export const STATS_TABLE_ROW_CLASS =
  "tw-border-x-0 tw-border-b tw-border-t-0 tw-border-solid tw-border-white/[0.06] last:tw-border-b-0";

export const STATS_TABLE_GROUP_START_ROW_CLASS =
  "tw-border-x-0 tw-border-b tw-border-t tw-border-solid tw-border-white/[0.08] last:tw-border-b-0";

export const STATS_TABLE_ROW_HEADER_CLASS =
  "tw-sticky tw-left-0 tw-z-[1] tw-whitespace-nowrap tw-bg-iron-950 tw-px-4 tw-py-3 tw-font-medium tw-text-iron-400";

export const STATS_TABLE_VALUE_CELL_CLASS =
  "tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-font-medium tw-tabular-nums tw-text-iron-100";

export const STATS_TABLE_MUTED_VALUE_CELL_CLASS =
  "tw-whitespace-nowrap tw-px-4 tw-py-3 tw-text-right tw-tabular-nums tw-text-iron-500";

/** Renders a consistently styled, initially expanded Details subsection. */
export function UserPageStatsDisclosure({
  title,
  children,
}: Readonly<{
  title: string;
  children: ReactNode;
}>) {
  return (
    <details
      className="tw-group tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-white/[0.08] tw-bg-white/[0.02]"
      open
    >
      <summary className="tw-flex tw-min-h-12 tw-w-full tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-3 tw-px-4 tw-py-3 tw-text-left tw-text-sm tw-font-semibold tw-text-iron-200 tw-transition-colors hover:tw-bg-white/[0.03] hover:tw-text-iron-50 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400 [&::-webkit-details-marker]:tw-hidden">
        <span>{title}</span>
        <ChevronDownIcon
          aria-hidden="true"
          className="tw-h-4 tw-w-4 tw-shrink-0 tw-text-iron-500 tw-transition-transform tw-duration-200 group-open:tw-rotate-180"
        />
      </summary>
      <div className="tw-border-x-0 tw-border-b-0 tw-border-t tw-border-solid tw-border-white/[0.08]">
        {children}
      </div>
    </details>
  );
}

/** Provides a labelled horizontal scroll area for wide Details tables. */
export function UserPageStatsTableScroll({
  label,
  children,
}: Readonly<{
  label: string;
  children: ReactNode;
}>) {
  return (
    <section
      aria-label={label}
      className="tw-overflow-x-auto tw-overscroll-x-contain tw-pb-1 tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700/70 desktop-hover:hover:tw-scrollbar-thumb-iron-500 focus-visible:tw-outline focus-visible:tw-outline-2 focus-visible:tw-outline-offset-[-2px] focus-visible:tw-outline-primary-400"
      tabIndex={0}
    >
      {children}
    </section>
  );
}

function getTableColumnLabels(locale: SupportedLocale) {
  return {
    metric: t(locale, "user.collected.stats.details.tables.column.metric"),
    total: t(locale, "user.collected.stats.details.tables.column.total"),
    memes: t(locale, "user.collected.stats.details.tables.column.memes"),
    nextGen: t(locale, "user.collected.stats.details.tables.column.nextGen"),
    gradient: t(locale, "user.collected.stats.details.tables.column.gradient"),
    memeLab: t(locale, "user.collected.stats.details.tables.column.memeLab"),
  };
}

export function UserPageStatsTableHead({
  caption,
  locale = DEFAULT_LOCALE,
}: Readonly<{
  caption?: string;
  locale?: SupportedLocale | undefined;
}> = {}) {
  const labels = getTableColumnLabels(locale);
  const columns = [
    labels.total,
    labels.memes,
    labels.nextGen,
    labels.gradient,
    labels.memeLab,
  ];

  return (
    <>
      {caption ? <caption className="tw-sr-only">{caption}</caption> : null}
      <thead className={STATS_TABLE_HEAD_CLASS}>
        <tr>
          <th
            scope="col"
            className={`${STATS_TABLE_HEADER_CELL_CLASS} tw-sticky tw-left-0 tw-z-[2] tw-bg-iron-900 tw-text-left`}
          >
            {labels.metric}
          </th>
          {columns.map((label) => (
            <th
              key={label}
              scope="col"
              className={`${STATS_TABLE_HEADER_CELL_CLASS} tw-text-right`}
            >
              {label}
            </th>
          ))}
        </tr>
      </thead>
    </>
  );
}
