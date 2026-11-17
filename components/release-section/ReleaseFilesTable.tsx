import { ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import type { ReactNode } from "react";

import CopyChecksumButton from "@/components/validator-page/CopyChecksumButton";
import { SECONDARY_BUTTON } from "@/components/validator-page/validatorStyles";

const CELL =
  "tw-border-0 tw-border-solid tw-border-white/[0.06] tw-align-middle lg:tw-border-b lg:tw-px-3 lg:tw-py-3";
const MOBILE_LABEL =
  "tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-500 lg:tw-hidden";
const HEAD =
  "tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.08] tw-px-3 tw-py-2 tw-text-left tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-iron-400";

/** One file of a release, with its words already in the page's language. */
export type ReleaseFileRow = {
  readonly name: string;
  /** "Mac", "Windows". */
  readonly title: string;
  /** What kind of file it is: "App (.dmg)". */
  readonly what: string;
  /** Its size as the page writes it, or the page's word for unknown. */
  readonly size: string;
  /** Lowercase hex SHA-256. */
  readonly sha256: string;
  /** The copy button's accessible name. */
  readonly copyLabel: string;
  /** The publisher cell, when the table has that column. */
  readonly publisher?: string | undefined;
  /** The download link; without it the row offers no download. */
  readonly href?: string | undefined;
  /** The download link's accessible name, with the file name. */
  readonly downloadLabel?: string | undefined;
};

/** The column headings; without `publisher` the table has no such column. */
type ReleaseFileColumns = {
  readonly file: string;
  readonly size: string;
  readonly sha256: string;
  readonly publisher?: string | undefined;
  readonly download: string;
};

function Cell({
  label,
  children,
  className = "",
}: {
  readonly label: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <td
      className={`${CELL} max-lg:tw-flex max-lg:tw-items-center max-lg:tw-justify-between max-lg:tw-gap-3 ${className}`}
    >
      {/* The header row is hidden below 1024 px, so this label names the
          cell there; it is hidden from 1024 px, where the header does. */}
      <span className={MOBILE_LABEL}>{label}</span>
      {children}
    </td>
  );
}

/**
 * Every file of a release in one table, with its size, its SHA-256 and,
 * when the row has one, a download link. Below 1024 px each row is a card.
 */
export default function ReleaseFilesTable({
  rows,
  columns,
  downloadText,
  fullHash = false,
}: {
  readonly rows: readonly ReleaseFileRow[];
  readonly columns: ReleaseFileColumns;
  readonly downloadText: string;
  /**
   * Print each SHA-256 whole, as a page of releases does, rather than its
   * first 12 digits.
   */
  readonly fullHash?: boolean | undefined;
}) {
  const { publisher } = columns;
  return (
    <table className="tw-w-full tw-border-collapse tw-text-sm max-lg:tw-block">
      <thead className="max-lg:tw-hidden">
        <tr>
          <th scope="col" className={HEAD}>
            {columns.file}
          </th>
          <th scope="col" className={HEAD}>
            {columns.size}
          </th>
          <th scope="col" className={HEAD}>
            {columns.sha256}
          </th>
          {publisher && (
            <th scope="col" className={HEAD}>
              {publisher}
            </th>
          )}
          <th scope="col" className={HEAD}>
            <span className="tw-sr-only">{columns.download}</span>
          </th>
        </tr>
      </thead>
      <tbody className="max-lg:tw-grid max-lg:tw-gap-3">
        {rows.map((row) => (
          <tr
            key={row.name}
            className="max-lg:tw-flex max-lg:tw-flex-col max-lg:tw-gap-3 max-lg:tw-rounded-xl max-lg:tw-border max-lg:tw-border-solid max-lg:tw-border-white/[0.08] max-lg:tw-bg-iron-950/60 max-lg:tw-p-4"
          >
            <td className={`${CELL} max-lg:tw-block`}>
              <span className="tw-block tw-font-semibold tw-text-iron-50">
                {row.title}
              </span>
              <span className="tw-block tw-text-iron-400">{row.what}</span>
              <span className="tw-block tw-break-all tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-300">
                {row.name}
              </span>
            </td>
            <Cell
              label={columns.size}
              className="tw-whitespace-nowrap tw-text-iron-300"
            >
              {row.size}
            </Cell>
            <Cell label={columns.sha256}>
              {fullHash ? (
                <span className="tw-flex tw-min-w-0 tw-items-start tw-gap-2 max-lg:tw-w-full max-lg:tw-flex-col">
                  <code className="tw-min-w-0 tw-break-all tw-font-mono tw-text-xs tw-leading-5 tw-text-iron-200 lg:tw-max-w-[16rem]">
                    {row.sha256}
                  </code>
                  <CopyChecksumButton
                    value={row.sha256}
                    label={row.copyLabel}
                  />
                </span>
              ) : (
                <span className="tw-inline-flex tw-items-center tw-gap-2">
                  <code
                    aria-hidden="true"
                    title={row.sha256}
                    className="tw-font-mono tw-text-xs tw-text-iron-200"
                  >
                    {row.sha256.slice(0, 12)}…
                  </code>
                  <span className="tw-sr-only">{row.sha256}</span>
                  <CopyChecksumButton
                    value={row.sha256}
                    label={row.copyLabel}
                  />
                </span>
              )}
            </Cell>
            {publisher && (
              <Cell label={publisher} className="tw-text-iron-300">
                <span className="max-lg:tw-text-right">{row.publisher}</span>
              </Cell>
            )}
            <td className={`${CELL} lg:tw-text-right`}>
              {row.href && (
                <a
                  href={row.href}
                  className={`${SECONDARY_BUTTON} max-lg:tw-w-full`}
                  aria-label={row.downloadLabel}
                >
                  <ArrowDownTrayIcon aria-hidden="true" className="tw-size-4" />
                  {downloadText}
                </a>
              )}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
