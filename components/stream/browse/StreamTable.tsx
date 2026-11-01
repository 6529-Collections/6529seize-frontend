import type { ReactNode } from "react";

import { STREAM_FOCUS, STREAM_LABEL } from "@/components/stream/ui/styles";

/**
 * One table per job, in the TDH page's style: a labelled, horizontally
 * scrollable region, 11px uppercase headers, hairline rows and tabular
 * numbers. The first cell of each row is its header.
 */

interface StreamColumn {
  readonly key: string;
  readonly label: string;
  /** Right-aligned (amounts, counts). */
  readonly numeric?: boolean;
  /** Secondary detail, hidden below the `sm` breakpoint. */
  readonly wide?: boolean;
}

interface StreamRow {
  readonly key: string;
  /** One cell per column, in column order. */
  readonly cells: readonly ReactNode[];
}

const CELL = "tw-px-3 tw-py-3 tw-align-middle first:tw-pl-0 last:tw-pr-0";

function cellClass(column: StreamColumn): string {
  return [
    CELL,
    column.numeric ? "tw-whitespace-nowrap tw-text-right" : "tw-text-left",
    column.wide ? "tw-hidden sm:tw-table-cell" : "",
  ].join(" ");
}

export default function StreamTable({
  caption,
  columns,
  rows,
}: {
  /** Names the table and its scroll region for assistive technology. */
  readonly caption: string;
  readonly columns: readonly StreamColumn[];
  readonly rows: readonly StreamRow[];
}) {
  return (
    <div
      role="region"
      aria-label={caption}
      tabIndex={0}
      className={`tw-overflow-x-auto tw-rounded-lg ${STREAM_FOCUS}`}
    >
      <table className="tw-w-full tw-border-collapse tw-text-sm tw-tabular-nums tw-text-iron-200">
        <caption className="tw-sr-only">{caption}</caption>
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`${cellClass(column)} ${STREAM_LABEL} tw-whitespace-nowrap tw-pb-2 tw-pt-0`}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr
              key={row.key}
              className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07]"
            >
              {columns.map((column, index) =>
                index === 0 ? (
                  <th
                    key={column.key}
                    scope="row"
                    className={`${cellClass(column)} tw-font-normal`}
                  >
                    {row.cells[index]}
                  </th>
                ) : (
                  <td key={column.key} className={cellClass(column)}>
                    {row.cells[index]}
                  </td>
                )
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
