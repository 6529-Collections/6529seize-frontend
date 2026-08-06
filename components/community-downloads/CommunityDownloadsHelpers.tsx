"use client";

import type { ReactNode } from "react";
import { ABOUT_PAGE_HORIZONTAL_PADDING_CLASS_NAME } from "@/components/about/AboutLayout";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import {
  DATA_TABLE_HEADER_TEXT_CLASS_NAME,
  DATA_TABLE_INTERACTIVE_ROW_CLASS_NAME,
} from "@/components/utils/table/tableStyles";
import { useBrowserLocale } from "@/hooks/useBrowserLocale";
import { t } from "@/i18n/messages";

export const DOWNLOADS_TABLE_ROW_CLASS_NAME = `tw-group ${DATA_TABLE_INTERACTIVE_ROW_CLASS_NAME}`;

export const DOWNLOADS_TABLE_CELL_CLASS_NAME =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-align-middle tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-100 md:tw-px-4 md:tw-py-3 md:tw-text-sm";

const DOWNLOADS_TABLE_HEADER_CELL_CLASS_NAME = `tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-2 tw-py-2 tw-text-left tw-align-middle tw-font-semibold tw-text-iron-400 md:tw-px-4 md:tw-py-3 ${DATA_TABLE_HEADER_TEXT_CLASS_NAME}`;

export function formatDate(dateString: string): string {
  const isYYYYMMDDFormat = (str: string): boolean => /^\d{8}$/.test(str);
  if (isYYYYMMDDFormat(dateString)) {
    const year = Number(dateString.substring(0, 4));
    const month = Number(dateString.substring(4, 6)) - 1;
    const day = Number(dateString.substring(6, 8));
    const d = new Date(year, month, day);
    return d.toDateString();
  }

  const d = new Date(dateString);
  return d.toDateString();
}

export function DownloadsLayout({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  const locale = useBrowserLocale();

  return (
    <section
      className={`tailwind-scope tw-container tw-mx-auto tw-w-full tw-pb-4 tw-pt-6 sm:tw-pt-8 ${ABOUT_PAGE_HORIZONTAL_PADDING_CLASS_NAME}`}
    >
      <h1 className="tw-m-0 tw-text-[22px] tw-font-semibold tw-leading-tight tw-tracking-tight tw-text-iron-50 sm:tw-text-[26px]">
        {t(locale, "openData.downloads.pageTitle", { title })}
      </h1>
      {children}
    </section>
  );
}

export function DownloadsTable<T>({
  data,
  columns,
  renderRow,
}: {
  readonly data: T[] | undefined;
  readonly columns: string[];
  readonly renderRow: (item: T, index: number) => ReactNode;
}) {
  if (data === undefined) {
    return null;
  }

  if (data.length === 0) {
    return <NothingHereYetSummer />;
  }

  return (
    <div className="tw-mt-2 tw-overflow-x-auto tw-scrollbar-thin tw-scrollbar-track-transparent tw-scrollbar-thumb-iron-700 desktop-hover:hover:tw-scrollbar-thumb-iron-600 lg:tw-mt-3">
      <table className="tw-mb-4 tw-min-w-full tw-border-collapse">
        <thead>
          <tr>
            {columns.map((col) => (
              <th
                className={DOWNLOADS_TABLE_HEADER_CELL_CLASS_NAME}
                key={col}
                scope="col"
              >
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{data.map((item, index) => renderRow(item, index))}</tbody>
      </table>
    </div>
  );
}
