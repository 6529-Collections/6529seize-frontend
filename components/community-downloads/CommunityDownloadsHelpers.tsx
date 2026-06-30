"use client";

import type { ReactNode } from "react";
import { Fragment } from "react";
import NothingHereYetSummer from "@/components/nothingHereYet/NothingHereYetSummer";
import styles from "./CommunityDownloads.module.scss";
import { getRandomObjectId } from "@/helpers/AllowlistToolHelpers";

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
  return (
    <section className="[min-width:1200px]:tw-max-w-[1050px] [min-width:1300px]:tw-max-w-[1150px] [min-width:1400px]:tw-max-w-[1250px] [min-width:1500px]:tw-max-w-[1280px] tw-mx-auto tw-w-full tw-px-3 tw-pt-4 sm:tw-max-w-[540px] md:tw-max-w-[720px] lg:tw-max-w-[960px]">
      <h1>{title} Downloads</h1>
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
    <div className={`tw-pt-3 ${styles["downloadsScrollContainer"] ?? ""}`}>
      <table className={`tw-w-full ${styles["downloadsTable"] ?? ""}`}>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col}>{col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((item, idx) => (
            <Fragment key={getRandomObjectId()}>
              {renderRow(item, idx)}
            </Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}
