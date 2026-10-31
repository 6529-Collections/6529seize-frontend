import type { ReactNode } from "react";
import { EX_FOCUS, EX_TEXT } from "@/components/explained/tokens";
import type { SupportedLocale } from "@/i18n/locales";
import { sourceTitle } from "./_lib/facts";
import type { SourceId } from "./_lib/sources";

/**
 * The hardware page's layout parts, built from the kit's tokens: the card's
 * section head (a blue kicker, a title, a note), a card, a chip, a
 * disclosure, and a table whose rows each carry their source and stack on a
 * phone.
 */

/** The card's section head: "HOME / OFFICE  Three tiers  Tor on by default…". */
export function CardHead({
  id,
  kicker,
  title,
  note,
}: {
  readonly id: string;
  readonly kicker: ReactNode;
  readonly title: ReactNode;
  readonly note?: ReactNode;
}) {
  return (
    <div className="tw-mb-6 md:tw-mb-8">
      <p className="tw-m-0 tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.14em] tw-text-primary-300">
        {kicker}
      </p>
      <h2 id={id} className={`${EX_TEXT.h2} tw-mt-2.5 tw-scroll-mt-24`}>
        {title}
      </h2>
      {note !== undefined && (
        <p className="tw-m-0 tw-mt-2 tw-max-w-[760px] tw-text-[15px] tw-leading-6 tw-text-iron-400 md:tw-text-base md:tw-leading-[26px]">
          {note}
        </p>
      )}
    </div>
  );
}

/** A spec as the card shows it: "16 GB RAM". A soft tile, never a bordered pill. */
export function Chip({ children }: { readonly children: ReactNode }) {
  return (
    <li className="tw-rounded-lg tw-bg-iron-900 tw-px-2.5 tw-py-1 tw-text-sm tw-font-semibold tw-leading-6 tw-text-iron-50">
      {children}
    </li>
  );
}

/** A block of detail behind a summary line, closed until asked for. */
export function Disclosure({
  summary,
  children,
  open = false,
  id,
  hint,
}: {
  readonly summary: ReactNode;
  readonly children: ReactNode;
  readonly open?: boolean;
  readonly id?: string;
  /** What is inside, under the summary: "Processor, memory, …". */
  readonly hint?: ReactNode;
}) {
  return (
    <details
      id={id}
      open={open}
      className="tw-group tw-scroll-mt-24 tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-bg-iron-950"
    >
      <summary
        className={`tw-flex tw-min-h-[52px] tw-cursor-pointer tw-list-none tw-items-center tw-justify-between tw-gap-4 tw-rounded-xl tw-px-5 tw-py-3.5 md:tw-px-6 [&::-webkit-details-marker]:tw-hidden ${EX_FOCUS}`}
      >
        <span>
          <span className="tw-block tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
            {summary}
          </span>
          {hint !== undefined && (
            <span className="tw-mt-0.5 tw-block tw-text-sm tw-leading-5 tw-text-iron-400">
              {hint}
            </span>
          )}
        </span>
        <span
          className="tw-flex tw-size-7 tw-flex-none tw-items-center tw-justify-center tw-rounded-full tw-border tw-border-solid tw-border-iron-700 tw-text-base tw-font-medium tw-leading-none tw-text-iron-300 group-open:tw-rotate-45 motion-safe:tw-transition-transform"
          aria-hidden="true"
        >
          +
        </span>
      </summary>
      <div className="tw-hidden tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 tw-px-5 tw-pb-5 tw-pt-4 group-open:tw-block md:tw-px-6 md:tw-pb-6">
        {children}
      </div>
    </details>
  );
}

interface FactColumn {
  readonly key: string;
  readonly label: string;
  /** Right-aligned on a wide screen: prices. */
  readonly numeric?: boolean;
  /** Width hint for a wide screen: "tw-w-[22%]". */
  readonly width?: string;
}

interface FactRow {
  readonly key: string;
  /** The fact id the row prints: "machine.pi5". */
  readonly fact: string;
  readonly source: SourceId;
  readonly cells: Readonly<Record<string, ReactNode>>;
  /** Shown quieter: a type that cannot be ordered. */
  readonly muted?: boolean;
}

const TH =
  "tw-border-0 tw-border-b tw-border-solid tw-border-iron-700 tw-py-2.5 tw-pr-4 tw-text-left tw-align-bottom tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.1em] tw-text-iron-400 last:tw-pr-0";

/**
 * A table of sourced rows: each row carries the fact it prints and the
 * source it was read from (a title on hover, `data-fact` for the gates).
 * Below `lg` each row becomes a block: the first cell its title, every other
 * cell its label above its value.
 */
export function FactTable({
  columns,
  rows,
  caption,
  locale,
}: {
  readonly columns: readonly FactColumn[];
  readonly rows: readonly FactRow[];
  /** The table's name for screen readers. */
  readonly caption: string;
  readonly locale: SupportedLocale;
}) {
  return (
    <table
      className="tw-w-full tw-border-collapse tw-text-[15px] tw-leading-6 before:tw-content-none after:tw-content-none [&_:is(thead,tbody,tr)]:before:tw-content-none [&_:is(thead,tbody,tr)]:after:tw-content-none"
      aria-label={caption}
    >
      <thead className="tw-hidden lg:tw-table-header-group">
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={`${TH} ${column.numeric ? "lg:tw-text-right" : ""} ${column.width ?? ""}`}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className="tw-block lg:tw-table-row-group">
        {rows.map((row) => (
          <tr
            key={row.key}
            data-fact={`hw.${row.fact}`}
            title={sourceTitle(row.source, locale)}
            className={`tw-block tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3.5 lg:tw-table-row lg:tw-py-0 ${row.muted ? "tw-opacity-60" : ""}`}
          >
            {columns.map((column, index) => {
              const label = (
                <span className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-iron-400 lg:tw-hidden">
                  {column.label}
                </span>
              );
              const cell = row.cells[column.key] ?? "–";
              const base = `tw-block tw-border-0 tw-py-1 tw-align-top lg:tw-table-cell lg:tw-border-b lg:tw-border-solid lg:tw-border-iron-900 lg:tw-py-3.5 lg:tw-pr-4 lg:last:tw-pr-0 ${column.numeric ? "lg:tw-text-right" : ""}`;
              return index === 0 ? (
                <th
                  key={column.key}
                  scope="row"
                  className={`${base} tw-text-left tw-font-semibold tw-text-iron-50`}
                >
                  {cell}
                </th>
              ) : (
                <td key={column.key} className={`${base} tw-text-iron-300`}>
                  {label}
                  {cell}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
