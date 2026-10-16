import type { ReactNode } from "react";

interface TdhStackColumn {
  readonly key: string;
  readonly label: string;
  /** A fuller label, as the header's tooltip, for a short header. */
  readonly title?: string;
  /** Extra classes for the column's header, such as its width from xl. */
  readonly className?: string;
}

interface TdhStackRow {
  readonly key: string;
  /** One cell per column; the first is the row's header. */
  readonly cells: readonly ReactNode[];
  /** Extra classes per cell, by column index. */
  readonly cellClassNames?: Readonly<Record<number, string>>;
}

const INLINE_LABEL =
  "tw-mr-1.5 tw-inline tw-text-sm tw-font-medium tw-text-iron-400 xl:tw-hidden";
const BLOCK_LABEL =
  "tw-block tw-text-sm tw-font-medium tw-text-iron-400 xl:tw-hidden";

const CELL =
  "tw-block tw-border-0 tw-p-0 tw-align-top tw-text-sm tw-leading-6 tw-text-iron-200 xl:tw-table-cell xl:tw-border-b xl:tw-border-solid xl:tw-border-white/[0.05] xl:tw-px-4 xl:tw-py-3";
const HEADER =
  "tw-border-0 tw-border-b tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-px-4 tw-py-2.5 tw-text-left tw-align-bottom tw-text-sm tw-font-medium tw-text-iron-400";

/**
 * A table that is a table from `xl` and a card per row below, with each
 * value labelled by its column, so no column is ever squeezed to a word per
 * line and nothing scrolls sideways. One element serves both layouts, so
 * the table's semantics and any row anchors stay single.
 */
export default function TdhStackTable({
  label,
  columns,
  rows,
  inlineColumns = [],
}: {
  readonly label: string;
  readonly columns: readonly TdhStackColumn[];
  readonly rows: readonly TdhStackRow[];
  /**
   * Columns with short values that a card shows on one line, label and
   * value side by side, so the cards stay short on a phone.
   */
  readonly inlineColumns?: readonly number[];
}) {
  return (
    <div className="xl:tw-overflow-hidden xl:tw-rounded-lg xl:tw-border xl:tw-border-solid xl:tw-border-white/[0.07]">
      <table
        aria-label={label}
        className="tw-m-0 tw-block tw-w-full tw-border-collapse tw-border-0 tw-text-left xl:tw-table"
      >
        <thead className="tw-hidden xl:tw-table-header-group">
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                scope="col"
                className={`${HEADER} ${column.className ?? ""}`}
                title={column.title}
              >
                {column.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="tw-grid tw-gap-2 sm:tw-grid-cols-2 xl:tw-table-row-group">
          {rows.map((row) => (
            <tr
              key={row.key}
              className="tw-grid tw-gap-2 tw-rounded-lg tw-border tw-border-solid tw-border-white/[0.07] tw-bg-iron-900 tw-p-3 xl:tw-table-row xl:tw-rounded-none xl:tw-border-0 xl:tw-bg-transparent xl:tw-p-0"
            >
              {row.cells.map((cell, index) => {
                const column = columns[index];
                const extra = row.cellClassNames?.[index] ?? "";
                if (index === 0) {
                  return (
                    <th
                      key={column?.key ?? index}
                      scope="row"
                      className={`${CELL} tw-font-medium tw-text-iron-50 ${extra}`}
                    >
                      {cell}
                    </th>
                  );
                }
                return (
                  <td key={column?.key ?? index} className={`${CELL} ${extra}`}>
                    <span
                      className={
                        inlineColumns.includes(index)
                          ? INLINE_LABEL
                          : BLOCK_LABEL
                      }
                    >
                      {column?.label}
                    </span>
                    {cell}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
