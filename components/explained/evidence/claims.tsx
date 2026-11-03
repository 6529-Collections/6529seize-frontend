import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { factText, fmt, isFact, type FactEntry } from "@/lib/explained/facts";
import { kt } from "../i18n";
import Mark, { type MarkKind } from "../marks/Mark";
import FactValue from "../facts/FactValue";
import PhoneMore from "../layout/PhoneMore";
import { PHONE_MORE_HIDDEN } from "../layout/phoneMoreClass";

/**
 * Claims with their proof (EXPLAINED.md §6.4, §9): a claim told to the end
 * (as written, refuted, what is proved now), claims with their limits
 * beside them, the scoreboard of counts and the assumption ledger.
 */

export interface ClaimPart {
  /** "11:32 UTC · as first written" */
  readonly when: string;
  /** "P26 §7.1, commit 0621ed4" */
  readonly where: string;
  /** The sentence, quoted word for word. */
  readonly quote: ReactNode;
  readonly mark: { readonly kind: MarkKind; readonly refText?: string };
  /** The refutation's numbers, or what the proof covers. */
  readonly body: ReactNode;
  /** The Lean name, file:line and axioms, for the part that is proved. */
  readonly lean?: {
    readonly name: FactEntry | null;
    readonly file: FactEntry | null;
    readonly line: FactEntry | null;
    readonly axioms: FactEntry | null;
    /** The commit the file and line are read at, when it is not the part's own. */
    readonly at?: FactEntry | null;
  };
  /** What the proof does not cover. */
  readonly doesNotCover?: ReactNode;
  readonly cap?: ReactNode;
}

export interface ClaimSpan {
  readonly duration: string;
  readonly what: string;
  readonly outcome: "refuted" | "holds";
  /**
   * How long it stood, in minutes: the timeline's segments are drawn to
   * scale. A span still standing has none; it takes the longest one's
   * width and fades out at its open end.
   */
  readonly minutes?: number;
}

/** The timeline's columns: each closed span to scale, an open one as wide as the longest. */
function spanColumns(spans: readonly ClaimSpan[]): string | undefined {
  const closed = spans.flatMap((span) =>
    span.minutes === undefined ? [] : [span.minutes]
  );
  if (closed.length === 0) return undefined;
  const longest = Math.max(...closed);
  return spans
    .map((span) => `minmax(0,${span.minutes ?? longest}fr)`)
    .join(" ");
}

function LeanBlock({
  lean,
  locale,
}: {
  readonly lean: NonNullable<ClaimPart["lean"]>;
  readonly locale: SupportedLocale;
}) {
  const text = (entry: FactEntry | null) =>
    entry && isFact(entry) ? fmt(entry, locale, "long") : "";
  const axioms =
    lean.axioms && isFact(lean.axioms) && factText(lean.axioms).length > 0
      ? kt(locale, "explained.kit.claim.axioms", { list: text(lean.axioms) })
      : kt(locale, "explained.kit.claim.noAxioms");
  return (
    <div
      className="tw-my-3 tw-whitespace-pre-wrap tw-rounded-md tw-bg-black/40 tw-p-3 tw-font-mono tw-text-[13px] tw-leading-[21px] tw-text-iron-50 [overflow-wrap:anywhere]"
      data-fact={lean.name?.id ?? ""}
    >
      {`${text(lean.name)}\n${text(lean.file)}:${text(lean.line)}${
        lean.at && isFact(lean.at)
          ? ` ${kt(locale, "explained.kit.claim.at", {
              commit: fmt(lean.at, locale),
            })}`
          : ""
      }\n${axioms}`}
    </div>
  );
}

/** One claim, to the end: as written, refuted, narrowed, proved, with a timeline. */
export function ClaimInParts({
  parts,
  spans,
  locale,
}: {
  readonly parts: readonly ClaimPart[];
  readonly spans?: readonly ClaimSpan[];
  readonly locale: SupportedLocale;
}) {
  return (
    <div data-claim-parts="">
      <ol
        className="tw-m-0 tw-grid tw-list-none tw-grid-cols-1 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-p-0 lg:[grid-template-columns:repeat(var(--ex-parts),minmax(0,1fr))]"
        style={{ ["--ex-parts" as string]: String(parts.length) }}
      >
        {parts.map((part, index) => (
          <li
            key={part.where}
            className={`tw-p-[22px] ${index > 0 ? "tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 lg:tw-border-l lg:tw-border-t-0" : ""}`}
          >
            <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
              {part.when}
            </span>
            <span className="tw-mt-1.5 tw-block tw-text-[13px] tw-font-semibold tw-text-iron-400">
              {part.where}
            </span>
            <blockquote className="tw-my-3 tw-ml-0 tw-mr-0 tw-border-0 tw-border-l-2 tw-border-solid tw-border-iron-400 tw-pl-3 tw-text-base tw-leading-[26px] tw-text-iron-50">
              {part.quote}
            </blockquote>
            <Mark
              kind={part.mark.kind}
              locale={locale}
              {...(part.mark.refText ? { refText: part.mark.refText } : {})}
            />
            {part.lean && <LeanBlock lean={part.lean} locale={locale} />}
            <div className="tw-mt-3 tw-text-[15px] tw-leading-6 tw-text-iron-300">
              {part.body}
            </div>
            {part.doesNotCover !== undefined && (
              <p className="tw-m-0 tw-mt-2 tw-text-[15px] tw-leading-6 tw-text-iron-300">
                <b className="tw-font-semibold tw-text-iron-50">
                  {kt(locale, "explained.kit.claim.doesNotCover")}
                </b>{" "}
                {part.doesNotCover}
              </p>
            )}
            {part.cap !== undefined && (
              <p className="tw-m-0 tw-mt-2 tw-text-[15px] tw-leading-6 tw-text-iron-400">
                {part.cap}
              </p>
            )}
          </li>
        ))}
      </ol>
      {spans && (
        <ol
          className="tw-m-0 tw-mt-[18px] tw-grid tw-list-none tw-grid-cols-1 tw-gap-2.5 tw-p-0 md:tw-gap-x-1 md:tw-gap-y-0 md:[grid-template-columns:var(--ex-spans)]"
          style={{
            ["--ex-spans" as string]:
              spanColumns(spans) ?? `repeat(${spans.length},minmax(0,1fr))`,
          }}
          aria-label={kt(locale, "explained.kit.claim.timeline")}
        >
          {spans.map((span) => (
            <li
              key={span.what}
              className={`tw-relative tw-border-0 tw-border-t-[3px] tw-border-solid tw-pr-3 tw-pt-2.5 tw-text-sm tw-leading-[21px] tw-text-iron-400 ${span.outcome === "holds" ? "tw-border-green" : "tw-border-error"} ${span.outcome === "holds" && span.minutes === undefined ? "md:[border-image:linear-gradient(90deg,#3ccb7f_70%,transparent)_1]" : ""}`}
            >
              <b className="tw-block tw-text-[15px] tw-font-semibold tw-text-iron-50">
                {span.duration}
              </b>
              {span.what}
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export interface ClaimRow {
  readonly what: string;
  readonly detail: string;
  readonly limit: ReactNode;
  /** Counts from the manifest: proved, shown false, limits. */
  readonly counts: {
    readonly proved?: FactEntry | null;
    readonly shownFalse?: FactEntry | null;
    readonly limits?: FactEntry | null;
  };
}

/** Claims with the limit beside each and their counts (§9). */
export function ClaimTable({
  rows,
  locale,
  phoneFold,
}: {
  readonly rows: readonly ClaimRow[];
  readonly locale: SupportedLocale;
  /**
   * On a phone, only `limit` claims show until the reader opens the rest
   * with `more` ("All 9 claims", its count a fact); every claim shows from
   * a tablet up.
   */
  readonly phoneFold?: {
    readonly limit: number;
    readonly more: ReactNode;
    readonly less: ReactNode;
  };
}) {
  // On a phone each count is a line of words ("16 proved"); from a
  // desktop up the counts are three right-aligned columns of numerals under
  // one heading row, the words kept for screen readers.
  const count = (
    entry: FactEntry | null | undefined,
    key: "proved" | "shownFalse" | "limits"
  ) => {
    if (!entry || !isFact(entry) || entry.value === 0) {
      return (
        <span
          aria-hidden="true"
          className="tw-hidden tw-text-iron-600 lg:tw-block"
        >
          –
        </span>
      );
    }
    const one = key === "limits" && entry.value === 1;
    let messageKey: Parameters<typeof kt>[1] =
      "explained.kit.claimTable.proved";
    if (key === "shownFalse")
      messageKey = "explained.kit.claimTable.shownFalse";
    if (key === "limits")
      messageKey = one
        ? "explained.kit.claimTable.oneLimit"
        : "explained.kit.claimTable.limits";
    return (
      <span className="tw-block" data-fact={entry.id}>
        <span className="lg:tw-sr-only">
          {kt(locale, messageKey, { count: fmt(entry, locale) })}
        </span>
        <span
          aria-hidden="true"
          className="tw-hidden tw-text-[15px] tw-font-semibold tw-leading-6 tw-text-iron-50 lg:tw-block"
        >
          {fmt(entry, locale)}
        </span>
      </span>
    );
  };
  const columns = "lg:tw-grid-cols-[48px_minmax(0,1.2fr)_minmax(0,1fr)_204px]";
  const folds = phoneFold !== undefined && rows.length > phoneFold.limit;
  const list = (
    <>
      {/* The counts' heading row, from a desktop up only: on a phone each
        count says its own word. */}
      <div
        aria-hidden="true"
        className={`tw-hidden tw-gap-[22px] tw-pb-2 lg:tw-grid ${columns}`}
      >
        <span className="tw-col-start-4 tw-grid tw-grid-cols-3 tw-items-end tw-gap-x-4 tw-text-right tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.1em] tw-text-iron-400">
          <span>{kt(locale, "explained.kit.claimTable.colProved")}</span>
          <span>{kt(locale, "explained.kit.claimTable.colShownFalse")}</span>
          <span>{kt(locale, "explained.kit.claimTable.colLimits")}</span>
        </span>
      </div>
      <ol
        className="tw-m-0 tw-list-none tw-border-0 tw-border-t tw-border-solid tw-border-iron-700 tw-p-0"
        data-claims=""
      >
        {rows.map((row, index) => (
          <li
            key={row.what}
            className={`tw-grid tw-grid-cols-[30px_minmax(0,1fr)] tw-gap-x-2.5 tw-gap-y-2 tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-5 ${columns} lg:tw-gap-[22px] ${folds && index >= phoneFold.limit ? PHONE_MORE_HIDDEN : ""}`}
          >
            <span className="tw-text-[15px] tw-font-semibold tw-text-iron-400">
              {index + 1}
            </span>
            <span className="tw-text-[17px] tw-font-semibold tw-leading-[25px] tw-text-iron-50">
              {row.what}
              <span className="tw-mt-1.5 tw-block tw-text-base tw-font-normal tw-leading-[26px] tw-text-iron-300">
                {row.detail}
              </span>
            </span>
            <span className="tw-col-start-2 tw-text-[15px] tw-leading-6 tw-text-iron-300 lg:tw-col-start-3">
              <span className="tw-mb-1.5 tw-block tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-text-iron-400">
                {kt(locale, "explained.kit.claimTable.limit")}
              </span>
              {row.limit}
            </span>
            <span className="tw-col-start-2 tw-text-sm tw-leading-[21px] tw-text-iron-400 lg:tw-col-start-4 lg:tw-grid lg:tw-grid-cols-3 lg:tw-content-start lg:tw-gap-x-4 lg:tw-text-right lg:tw-tabular-nums">
              {count(row.counts.proved, "proved")}
              {count(row.counts.shownFalse, "shownFalse")}
              {count(row.counts.limits, "limits")}
            </span>
          </li>
        ))}
      </ol>
    </>
  );
  if (!folds || phoneFold === undefined) return list;
  return (
    <PhoneMore more={phoneFold.more} less={phoneFold.less}>
      {list}
    </PhoneMore>
  );
}

export interface ScoreCell {
  readonly value: FactEntry | null;
  readonly caption: ReactNode;
}

/** One row of counts with their units, once per page (§6.4). */
/**
 * A cell's rules: on a phone an even count is a grid of two columns (a rule
 * left of the second column, above every row after the first), an odd one
 * a single column; on a wide screen one row, a rule left of each cell.
 */
function scoreBorders(index: number, count: number): string {
  const wide = index > 0 ? "lg:tw-border-l lg:tw-border-t-0" : "";
  if (count % 2 !== 0) {
    return index > 0 ? `tw-border-t ${wide}` : "";
  }
  // On a phone the cells stack in one column, a rule above each; two
  // columns from a tablet up.
  const left = index % 2 === 1 ? "md:tw-border-l" : "";
  const top =
    index >= 2 ? "tw-border-t" : index === 1 ? "max-md:tw-border-t" : "";
  return `${left} ${top} ${wide}`.trim();
}

export function Scoreboard({
  cells,
  label,
  locale,
}: {
  readonly cells: readonly ScoreCell[];
  readonly label: string;
  readonly locale: SupportedLocale;
}) {
  return (
    <dl
      className={`tw-m-0 tw-grid tw-grid-cols-1 ${cells.length % 2 === 0 ? "md:tw-grid-cols-2" : ""} tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 lg:[grid-template-columns:repeat(var(--ex-score),minmax(0,1fr))]`}
      style={{ ["--ex-score" as string]: String(cells.length) }}
      aria-label={label}
      data-scoreboard=""
    >
      {cells.map((cell, index) => (
        <div
          key={cell.value?.id ?? index}
          className={`tw-border-0 tw-border-solid tw-border-iron-800 tw-px-4 tw-py-3.5 md:tw-px-[22px] md:tw-py-5 ${scoreBorders(index, cells.length)}`}
        >
          <dt className="tw-sr-only">
            {typeof cell.caption === "string" ? cell.caption : ""}
          </dt>
          {/* On a phone the number sits beside its caption, one row a count. */}
          <dd className="tw-m-0 max-md:tw-flex max-md:tw-flex-wrap max-md:tw-items-baseline max-md:tw-gap-x-3">
            <FactValue
              fact={cell.value}
              locale={locale}
              className="tw-block tw-text-[30px] tw-font-semibold tw-leading-9 tw-tracking-[-0.02em] tw-text-iron-50 md:tw-text-[40px] md:tw-leading-[46px]"
            />
            <span className="tw-block tw-text-[15px] tw-leading-[22px] tw-text-iron-400 max-md:tw-min-w-[180px] max-md:tw-flex-1 md:tw-mt-1.5">
              {cell.caption}
            </span>
          </dd>
        </div>
      ))}
    </dl>
  );
}

export interface LedgerRow {
  readonly assumption: string;
  readonly mark: "assumed" | "tested" | "notProved" | "notYet" | "proved";
  /** A narrower word for the mark: "Tested, one machine". */
  readonly markLabel?: string;
  readonly covers: ReactNode;
}

/** What you still have to trust (§9): each assumption, its mark, what covers it. */
export function AssumptionLedger({
  rows,
  locale,
}: {
  readonly rows: readonly LedgerRow[];
  readonly locale: SupportedLocale;
}) {
  const head =
    "tw-border-0 tw-border-b tw-border-solid tw-border-iron-700 tw-py-2.5 tw-pr-3.5 tw-text-left tw-align-bottom tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.1em] tw-text-iron-400";
  const cell =
    "tw-block tw-border-0 tw-px-0 tw-py-[3px] tw-align-top tw-text-base tw-leading-[26px] tw-text-iron-300 md:tw-table-cell md:tw-border-b md:tw-border-solid md:tw-border-iron-900 md:tw-py-3.5 md:tw-pr-3.5";
  return (
    <table className="tw-w-full tw-border-collapse" data-ledger="">
      <thead className="tw-hidden md:tw-table-header-group">
        <tr>
          <th scope="col" className={head}>
            {kt(locale, "explained.kit.ledger.assumption")}
          </th>
          <th scope="col" className={head}>
            {kt(locale, "explained.kit.ledger.mark")}
          </th>
          <th scope="col" className={head}>
            {kt(locale, "explained.kit.ledger.covers")}
          </th>
        </tr>
      </thead>
      <tbody className="tw-block md:tw-table-row-group">
        {rows.map((row) => (
          <tr
            key={row.assumption}
            className="tw-block tw-border-0 tw-border-b tw-border-solid tw-border-iron-900 tw-py-3 md:tw-table-row md:tw-py-0"
          >
            <th
              scope="row"
              className={`${cell} tw-text-left tw-font-semibold tw-text-iron-50 md:tw-w-[34%] md:tw-min-w-[200px]`}
            >
              {row.assumption}
            </th>
            <td className={`${cell} md:tw-min-w-[172px]`}>
              <Mark
                kind={row.mark}
                locale={locale}
                size="sm"
                {...(row.markLabel === undefined
                  ? {}
                  : { label: row.markLabel })}
              />
            </td>
            <td className={cell}>{row.covers}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
