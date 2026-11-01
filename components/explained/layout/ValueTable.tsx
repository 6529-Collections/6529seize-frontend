import type { ReactNode } from "react";

/**
 * A small table inside a model's stage: a label column and value columns,
 * numbers right-aligned in tabular figures. A row can be marked as the one
 * the readout uses (blue rule on its left) or set back (dimmed). It stays a
 * table on a phone: its values are short.
 *
 * Built for How it works (counterexample I, the totals); a candidate for
 * the kit's lens parts.
 */
interface ValueRow {
  readonly key: string;
  readonly label: ReactNode;
  readonly values: readonly ReactNode[];
  readonly tone?: "on" | "off" | "plain";
}

export default function ValueTable({
  caption,
  head,
  rows,
}: {
  /** For a screen reader: what the table compares. */
  readonly caption: string;
  /** The column heads after the label column; the first may be empty. */
  readonly head: readonly ReactNode[];
  readonly rows: readonly ValueRow[];
}) {
  return (
    <table
      className="tw-w-full tw-border-collapse tw-text-[15px] tw-leading-6 max-[399px]:tw-text-sm"
      aria-label={caption}
    >
      <thead>
        <tr>
          {head.map((cell, index) => (
            <th
              // The heads are a fixed sequence.
              key={index}
              scope="col"
              className={`tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-pb-2 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.08em] tw-text-iron-400 ${index === 0 ? "tw-text-left" : "tw-whitespace-nowrap tw-pl-2 tw-text-right min-[400px]:tw-pl-3"}`}
            >
              {cell}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => {
          let tone = "tw-text-iron-300";
          if (row.tone === "on") tone = "tw-text-iron-50";
          if (row.tone === "off") tone = "tw-text-iron-400";
          return (
            <tr key={row.key} data-row-tone={row.tone ?? "plain"}>
              <th
                scope="row"
                className={`tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-2 tw-pr-2 tw-text-left tw-font-normal ${tone} ${row.tone === "on" ? "tw-shadow-[inset_2px_0_0_0_rgb(82,139,255)]" : ""} tw-pl-3`}
              >
                {row.label}
              </th>
              {row.values.map((value, index) => (
                <td
                  // The values are a fixed sequence of columns.
                  key={index}
                  className={`tw-whitespace-nowrap tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-2 tw-pl-2 tw-text-right tw-tabular-nums min-[400px]:tw-pl-3 ${tone} ${row.tone === "on" ? "tw-font-semibold" : ""}`}
                >
                  {value}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
