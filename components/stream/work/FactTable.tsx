import type { ReactNode } from "react";

import { STREAM_LABEL } from "@/components/stream/ui/styles";

/**
 * The app's global `::before, ::after { content: "" }` rule gives table rows
 * pseudo-elements that a fixed table layout counts as columns; this removes
 * them, as other tables in the app do.
 */
export const TABLE_RESET =
  "before:tw-content-none after:tw-content-none [&_:is(thead,tbody,tr)]:before:tw-content-none [&_:is(thead,tbody,tr)]:after:tw-content-none";

export interface FactRow {
  readonly key: string;
  readonly label: string;
  readonly value: ReactNode;
}

/** A compact two-column facts table: a row header and its value per line. */
export default function FactTable({
  caption,
  rows,
}: {
  readonly caption: string;
  readonly rows: readonly FactRow[];
}) {
  return (
    <table
      className={`tw-w-full tw-table-fixed tw-border-collapse tw-text-left tw-text-sm ${TABLE_RESET}`}
    >
      <caption className={`${STREAM_LABEL} tw-pb-2 tw-text-left`}>
        {caption}
      </caption>
      <tbody>
        {rows.map((row) => (
          <tr
            key={row.key}
            className="tw-border-0 tw-border-t tw-border-solid tw-border-white/[0.07]"
          >
            <th
              scope="row"
              className="tw-w-2/5 tw-py-2 tw-pr-3 tw-text-left tw-align-top tw-text-xs tw-font-medium tw-leading-5 tw-text-iron-400 sm:tw-w-1/3"
            >
              {row.label}
            </th>
            <td className="tw-break-words tw-py-2 tw-align-top tw-leading-5 tw-text-iron-100">
              {row.value}
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
