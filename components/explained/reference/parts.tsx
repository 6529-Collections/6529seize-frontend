import Link from "next/link";
import type { ReactNode } from "react";
import { EX_FOCUS, EX_LAYOUT, EX_TEXT } from "../tokens";

/**
 * The reference genre's layout parts (SCORECARD.md §2, genre R: How sure
 * and every chapter's shelf), built from the kit's tokens: the page head,
 * an editorial section, prose, a table that stacks on a phone, a
 * definition list, a code block, a note with a blue edge, contents.
 */

/** The eyebrow, H1 and one-sentence lede of an evidence or reference page. */
export function PageHead({
  eyebrow,
  title,
  lede,
  id,
  children,
}: {
  readonly eyebrow: ReactNode;
  readonly title: ReactNode;
  readonly lede: ReactNode;
  readonly id?: string;
  readonly children?: ReactNode;
}) {
  return (
    <header className="tw-scroll-mt-24 tw-pt-[30px] md:tw-pt-[52px]" id={id}>
      <p className={`${EX_TEXT.label} tw-m-0 tw-mb-4`}>{eyebrow}</p>
      <h1
        className={`${EX_TEXT.h1r} tw-max-w-[900px] max-[359px]:tw-text-[23px] max-[359px]:tw-leading-[28px]`}
      >
        {title}
      </h1>
      <p className={`${EX_TEXT.lede} tw-mt-4 md:tw-mt-[22px]`} data-ex-lede="">
        {lede}
      </p>
      {children}
    </header>
  );
}

/** "4" in blue inside an eyebrow: where the page sits in the chapter. */
export function EyebrowNumber({ children }: { readonly children: ReactNode }) {
  return <span className="tw-text-primary-300">{children}</span>;
}

/**
 * A section on the editorial grid: its number and label on the left, the
 * heading and content across the text and margin columns (EXPLAINED.md
 * §5.3). On a phone, one column.
 */
export function EdSection({
  id,
  no,
  label,
  title,
  titleId,
  tight = true,
  children,
  full,
}: {
  readonly id?: string;
  readonly no?: ReactNode;
  readonly label: ReactNode;
  readonly title: ReactNode;
  /** An id for the heading itself, an anchor older links use. */
  readonly titleId?: string;
  readonly tight?: boolean;
  readonly children?: ReactNode;
  /** Content across the whole width, under the grid: a wide table. */
  readonly full?: ReactNode;
}) {
  return (
    <section
      id={id}
      className={`tw-scroll-mt-24 ${tight ? EX_LAYOUT.sectionTight : EX_LAYOUT.section}`}
    >
      <div className={EX_LAYOUT.ed}>
        <div className="lg:tw-pt-2.5">
          {no !== undefined && (
            <span className="tw-mb-1.5 tw-block tw-text-sm tw-font-semibold tw-leading-5 tw-text-primary-300">
              {no}
            </span>
          )}
          <span className={`${EX_TEXT.label} tw-block`}>{label}</span>
        </div>
        <div className={`${EX_LAYOUT.edWide} tw-min-w-0`}>
          <h2
            className={`${EX_TEXT.h2} tw-mb-4 tw-scroll-mt-24 max-[359px]:tw-text-[19px] max-[359px]:tw-leading-[25px]`}
            id={titleId}
          >
            {title}
          </h2>
          {children}
        </div>
      </div>
      {full}
    </section>
  );
}

/** A paragraph of body text at reading size, at most 660 px wide. */
export function Prose({
  children,
  className = "",
}: {
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return <p className={`${EX_LAYOUT.paragraph} ${className}`}>{children}</p>;
}

/** A caption or source note under a block, at most about 80 characters a line. */
export function Caption({
  children,
  className = "",
  id,
}: {
  readonly children: ReactNode;
  readonly className?: string;
  readonly id?: string;
}) {
  return (
    <p
      id={id}
      className={`tw-m-0 tw-max-w-[560px] ${EX_TEXT.cap} ${className}`.trim()}
    >
      {children}
    </p>
  );
}

/**
 * A code name set in mono, never in capitals: `tdh-v1.4`, `DEV-2`,
 * `totalMax`. Short names stay on one line; a long identifier (`wrap`)
 * breaks anywhere rather than overflow its column.
 */
export function CodeName({
  children,
  wrap = false,
}: {
  readonly children: ReactNode;
  readonly wrap?: boolean;
}) {
  return (
    <code
      className={`tw-font-mono tw-text-[0.88em] tw-normal-case tw-tracking-normal tw-text-iron-50 ${wrap ? "[overflow-wrap:anywhere]" : "tw-whitespace-nowrap"}`}
    >
      {children}
    </code>
  );
}

interface StackColumn {
  readonly key: string;
  readonly label: string;
  /** Right-aligned on a desktop: numbers. */
  readonly numeric?: boolean;
  /**
   * Whether the stacked row on a phone repeats this column's label above
   * its value. A term and its meaning read without one.
   */
  readonly phoneLabel?: boolean;
}

interface StackRow {
  readonly key: string;
  readonly id?: string;
  readonly cells: Readonly<Record<string, ReactNode>>;
}

const TH =
  "tw-border-0 tw-border-b tw-border-solid tw-border-iron-700 tw-py-2.5 tw-pr-3.5 tw-text-left tw-align-bottom tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.1em] tw-text-iron-400 last:tw-pr-0";

/**
 * The classes that turn the stacked rows into a table from a breakpoint:
 * md (768 px) for tables of three columns, lg (1024 px) for wider ones,
 * whose columns would wrap a word a line on a tablet.
 */
const FROM = {
  md: {
    head: "tw-hidden md:tw-table-header-group",
    body: "tw-block md:tw-table-row-group",
    row: "tw-block tw-scroll-mt-24 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3 md:tw-table-row md:tw-border-0 md:tw-py-0",
    cell: "tw-block tw-border-0 tw-py-[3px] tw-align-top tw-text-iron-300 md:tw-table-cell md:tw-border-b md:tw-border-solid md:tw-border-iron-900 md:tw-py-3.5 md:tw-pr-3.5 md:last:tw-pr-0",
    label:
      "tw-block tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-iron-400 md:tw-hidden",
    right: "md:tw-text-right",
  },
  lg: {
    head: "tw-hidden lg:tw-table-header-group",
    body: "tw-block lg:tw-table-row-group",
    row: "tw-block tw-scroll-mt-24 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3 lg:tw-table-row lg:tw-border-0 lg:tw-py-0",
    cell: "tw-block tw-border-0 tw-py-[3px] tw-align-top tw-text-iron-300 lg:tw-table-cell lg:tw-border-b lg:tw-border-solid lg:tw-border-iron-900 lg:tw-py-3.5 lg:tw-pr-3.5 lg:last:tw-pr-0",
    label:
      "tw-block tw-text-xs tw-font-semibold tw-uppercase tw-leading-5 tw-tracking-[0.1em] tw-text-iron-400 lg:tw-hidden",
    right: "lg:tw-text-right",
  },
} as const;

/**
 * A table that stacks on a phone: each row becomes a block, each cell its
 * label above its value (TDH-DESIGN.md §6). The first column is the row's
 * header. The table is named by aria-label: a hidden caption would sit out
 * of flow and add a column.
 */
export function StackTable({
  columns,
  rows,
  caption,
  size = "body",
  from = "md",
}: {
  readonly columns: readonly StackColumn[];
  readonly rows: readonly StackRow[];
  /** The table's name for screen readers. */
  readonly caption: string;
  readonly size?: "body" | "small";
  /** Where the rows become a table: md for three columns, lg for more. */
  readonly from?: keyof typeof FROM;
}) {
  const at = FROM[from];
  const text =
    size === "small"
      ? "tw-text-[15px] tw-leading-6"
      : "tw-text-base tw-leading-6";
  return (
    <table
      className={`tw-w-full tw-border-collapse ${text}`}
      aria-label={caption}
    >
      <thead className={at.head}>
        <tr>
          {columns.map((column) => (
            <th
              key={column.key}
              scope="col"
              className={`${TH} ${column.numeric ? at.right : ""}`}
            >
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody className={at.body}>
        {rows.map((row) => (
          <tr key={row.key} id={row.id} className={at.row}>
            {columns.map((column, index) => {
              const label =
                column.phoneLabel === false ? null : (
                  <span className={at.label}>{column.label}</span>
                );
              const cell = row.cells[column.key] ?? "–";
              const align = column.numeric ? at.right : "";
              return index === 0 ? (
                <th
                  key={column.key}
                  scope="row"
                  className={`${at.cell} tw-text-left tw-font-semibold tw-text-iron-50 ${align}`}
                >
                  {label}
                  {cell}
                </th>
              ) : (
                <td key={column.key} className={`${at.cell} ${align}`}>
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

/** Label and value pairs in two columns; one column on a phone. */
export function FactsList({
  rows,
  label,
}: {
  readonly rows: readonly {
    readonly key: string;
    readonly term: ReactNode;
    readonly value: ReactNode;
  }[];
  readonly label?: string;
}) {
  return (
    <dl
      className="tw-m-0 tw-grid tw-grid-cols-1 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-text-[15px] tw-leading-6 sm:tw-grid-cols-[max-content_minmax(0,1fr)]"
      aria-label={label}
    >
      {rows.map((row) => (
        <div key={row.key} className="tw-contents">
          <dt className="tw-border-0 tw-pt-3 tw-text-iron-400 sm:tw-border-b sm:tw-border-solid sm:tw-border-iron-900 sm:tw-pb-3 sm:tw-pr-7">
            {row.term}
          </dt>
          <dd className="tw-m-0 tw-min-w-0 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-pb-3 tw-pt-0.5 tw-text-iron-50 sm:tw-pt-3">
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

/**
 * A note with a blue edge: a trap an implementer must not fall into, or an
 * ask. Its label says which.
 */
export function Trap({
  label,
  children,
  className = "",
}: {
  readonly label: ReactNode;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <aside
      className={`tw-rounded-lg tw-border tw-border-l-[3px] tw-border-solid tw-border-iron-700 tw-border-l-primary-400 tw-bg-primary-400/[0.04] tw-px-5 tw-py-[18px] ${className}`.trim()}
    >
      <span className="tw-mb-1.5 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-primary-300">
        {label}
      </span>
      <div className="tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {children}
      </div>
    </aside>
  );
}

/**
 * A block of the rule's own text: formulas and pseudocode quoted from the
 * specification, never translated. Comments (`#`, or Lean's `--`) are set
 * quieter. From a tablet up, lines keep their columns, and where a line is
 * wider than the frame the block scrolls sideways inside it (a focusable,
 * named region), never the page.
 *
 * On a phone, a block whose lines align columns with runs of spaces
 * (`minted[i]  = ...`) keeps scrolling, since wrapped it reads as a
 * staircase, and shows a fade at its right edge so the cut is visibly a
 * scroll. Any other block wraps, each line hanging two characters to the
 * right of its own start, so no rule is cut mid-token out of sight.
 */
const ALIGNED_COLUMNS = /\S {2,}\S/;

export function CodeBlock({
  code,
  label,
  className = "",
  comment: marker = "#",
  showLabel = false,
}: {
  readonly code: string;
  /** What the block is, for screen readers. */
  readonly label: string;
  readonly className?: string;
  /** Where a comment starts: `#` in the specification, `--` in Lean. */
  readonly comment?: string;
  /** Print the label above the code, for blocks that read as steps. */
  readonly showLabel?: boolean;
}) {
  const lines = code.split("\n");
  const aligned = lines.some((line) => ALIGNED_COLUMNS.test(line));
  // Wrapped on a wide screen, so a long rule line is never cut at the
  // frame's edge out of sight. A column-aligned block scrolls, and so does
  // Lean on a phone, where wrapping would split its long identifiers; a
  // scrolling block fades at its right edge to say there is more.
  const lean = marker === "--";
  const wrap = aligned
    ? "tw-whitespace-pre"
    : lean
      ? "max-md:tw-whitespace-pre md:tw-whitespace-pre-wrap md:[overflow-wrap:anywhere]"
      : "tw-whitespace-pre-wrap [overflow-wrap:anywhere]";
  return (
    <div
      className={`tw-relative tw-min-w-0 tw-max-w-[924px] tw-rounded-lg tw-border tw-border-solid tw-border-iron-800 tw-bg-[#0a0a0c] ${className}`.trim()}
      data-code-wrap={aligned ? "scroll" : "wrap"}
    >
      {showLabel && (
        <span
          className="tw-block tw-border-0 tw-border-b tw-border-solid tw-border-iron-800 tw-px-4 tw-py-2 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400 md:tw-px-[18px]"
          aria-hidden="true"
        >
          {label}
        </span>
      )}
      <pre
        className={`tw-m-0 tw-overflow-x-auto tw-bg-transparent tw-px-4 tw-py-4 tw-font-mono tw-text-[13px] tw-leading-[21px] tw-text-iron-50 md:tw-px-[18px] md:tw-text-sm md:tw-leading-[22px] ${wrap} ${EX_FOCUS}`}
        aria-label={label}
        data-tdh-scroll=""
        role="region"
        tabIndex={0}
      >
        <code className="tw-font-mono tw-text-iron-50">
          {lines.map((line, index) => {
            const hash = line.indexOf(marker);
            const rule = hash >= 0 ? line.slice(0, hash) : line;
            const comment = hash >= 0 ? line.slice(hash) : "";
            const hang = `${line.length - line.trimStart().length + 2}ch`;
            return (
              // A quoted block's lines are fixed in order.
              <span
                key={index}
                className="tw-block"
                style={
                  aligned
                    ? undefined
                    : { paddingLeft: hang, textIndent: `-${hang}` }
                }
              >
                {rule}
                {comment && <span className="tw-text-iron-400">{comment}</span>}
                {line === "" ? " " : null}
              </span>
            );
          })}
        </code>
      </pre>
      {(aligned || lean) && (
        <span
          className="tw-pointer-events-none tw-absolute tw-inset-y-0 tw-right-0 tw-w-8 tw-rounded-r-lg tw-bg-gradient-to-l tw-from-[#0a0a0c] tw-to-transparent md:tw-hidden"
          aria-hidden="true"
        />
      )}
    </div>
  );
}

/** Contents: numbered links in two columns, one on a phone. */
export function Contents({
  items,
  label,
}: {
  readonly items: readonly {
    readonly href: string;
    readonly no: ReactNode;
    readonly title: ReactNode;
  }[];
  readonly label: string;
}) {
  return (
    <nav aria-label={label}>
      <ol className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-gap-x-8 tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-p-0 md:tw-grid-cols-2">
        {items.map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className={`tw-grid tw-min-h-11 tw-grid-cols-[32px_minmax(0,1fr)] tw-items-center tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-2.5 tw-text-base tw-leading-6 tw-text-iron-50 tw-no-underline hover:tw-text-primary-300 min-[360px]:tw-grid-cols-[44px_minmax(0,1fr)] ${EX_FOCUS}`}
            >
              <span className="tw-font-semibold tw-text-iron-400">
                {item.no}
              </span>
              <span>{item.title}</span>
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
