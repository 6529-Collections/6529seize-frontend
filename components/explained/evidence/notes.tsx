import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { kt } from "../i18n";
import { Glyph, type GlyphKind } from "../marks/glyphs";
import Mark, { type MarkKind } from "../marks/Mark";

/**
 * The sentences that travel with a claim (EXPLAINED.md §3 rule 4, §9): the
 * limit inside the block, the failure sentence, the definition chip and the
 * two-column boxes (It shows / It does not show; What it is / is not yet).
 */

/** "Not guaranteed: the history before the snapshot." A dashed, neutral sentence. */
export function LimitNote({
  title,
  children,
  tone = "limit",
}: {
  /** The bold first sentence, starting with the limit's words. */
  readonly title: ReactNode;
  readonly children?: ReactNode;
  /** "holds": a green-edged note for a record that was included (Tested). */
  readonly tone?: "limit" | "holds";
}) {
  const frame =
    tone === "holds"
      ? "tw-border-solid tw-border-green/40"
      : "tw-border-dashed tw-border-iron-700";
  return (
    <div
      className={`tw-grid tw-grid-cols-[18px_minmax(0,1fr)] tw-gap-2.5 tw-rounded-lg tw-border tw-px-4 tw-py-3.5 tw-text-base tw-leading-[25px] tw-text-iron-300 max-[359px]:tw-grid-cols-1 max-[359px]:tw-px-3 ${frame}`}
      data-limit={tone}
    >
      <Glyph
        kind={tone === "holds" ? "tested" : "notGuaranteed"}
        className="tw-mt-1 tw-size-4"
      />
      <div>
        <b className="tw-font-semibold tw-text-iron-50">{title}</b> {children}
      </div>
    </div>
  );
}

/** "This number would be wrong if…" (§9), with what would close each gap. */
export function FailureSentence({
  ifs,
  closedBy,
  locale,
}: {
  readonly ifs: readonly ReactNode[];
  readonly closedBy?: ReactNode;
  readonly locale: SupportedLocale;
}) {
  return (
    <div
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 tw-px-[22px] tw-py-5"
      data-failure=""
    >
      <p className="tw-m-0 tw-text-base tw-font-semibold tw-leading-6 tw-text-iron-50">
        {kt(locale, "explained.kit.failure.lead")}
      </p>
      <ul className="tw-m-0 tw-mt-3 tw-grid tw-list-none tw-gap-2.5 tw-p-0">
        {ifs.map((item, index) => (
          // The conditions are fixed copy in a fixed order.
          <li
            key={index}
            className="tw-grid tw-grid-cols-[16px_minmax(0,1fr)] tw-gap-2.5 tw-text-[15px] tw-leading-[23px] tw-text-iron-300"
          >
            <Glyph kind="notGuaranteed" className="tw-mt-[5px] tw-size-3.5" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
      {closedBy !== undefined && (
        <p className="tw-m-0 tw-mt-3.5 tw-text-[15px] tw-leading-[23px] tw-text-iron-400">
          <b className="tw-font-semibold tw-text-iron-300">
            {kt(locale, "explained.kit.failure.closedBy")}:{" "}
          </b>
          {closedBy}
        </p>
      )}
    </div>
  );
}

/** Two right numbers for one name (§9): with and without the burn addresses. */
export function DefinitionChip({
  title,
  children,
}: {
  readonly title: string;
  readonly children: ReactNode;
}) {
  return (
    <div
      className="tw-rounded-xl tw-border tw-border-solid tw-border-iron-900 tw-bg-iron-950 tw-p-6"
      data-definition=""
    >
      <span className="tw-block tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
        {title}
      </span>
      <div className="tw-mt-2 tw-text-[15px] tw-leading-6 tw-text-iron-300">
        {children}
      </div>
    </div>
  );
}

export interface TwoColumnItem {
  readonly text: ReactNode;
  /** The item's evidence mark; defaults to the column's. */
  readonly mark?: MarkKind;
}

const ITEM_GLYPH: Record<MarkKind, GlyphKind> = {
  decided: "decided",
  absolute: "absolute",
  proposed: "proposed",
  open: "open",
  proved: "proved",
  tested: "tested",
  shownFalse: "shownFalse",
  notGuaranteed: "notGuaranteed",
  notYet: "notYet",
  drift: "drift",
  assumed: "assumed",
  notProved: "notGuaranteed",
};

function Column({
  label,
  items,
  fallback,
}: {
  readonly label: string;
  readonly items: readonly TwoColumnItem[];
  readonly fallback: MarkKind;
}) {
  return (
    <div className="tw-px-6 tw-py-[22px]">
      <span className="tw-text-xs tw-font-semibold tw-uppercase tw-leading-4 tw-tracking-[0.12em] tw-text-iron-400">
        {label}
      </span>
      <ul className="tw-m-0 tw-mt-3.5 tw-grid tw-list-none tw-gap-3 tw-p-0">
        {items.map((item, index) => {
          const kind = ITEM_GLYPH[item.mark ?? fallback];
          return (
            // Items are fixed copy in a fixed order.
            <li
              key={index}
              className="tw-grid tw-grid-cols-[16px_minmax(0,1fr)] tw-gap-2.5 tw-text-base tw-leading-[25px] tw-text-iron-300"
            >
              <Glyph kind={kind} className="tw-mt-[5px] tw-size-3.5" />
              <span>{item.text}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

function TwoColumns({
  left,
  right,
  label,
}: {
  readonly left: {
    readonly label: string;
    readonly items: readonly TwoColumnItem[];
    readonly mark: MarkKind;
  };
  readonly right: {
    readonly label: string;
    readonly items: readonly TwoColumnItem[];
    readonly mark: MarkKind;
  };
  readonly label?: string;
}) {
  return (
    <div
      className="tw-grid tw-grid-cols-1 tw-overflow-hidden tw-rounded-xl tw-border tw-border-solid tw-border-iron-800 md:tw-grid-cols-2"
      {...(label ? { "aria-label": label, role: "group" } : {})}
    >
      <Column label={left.label} items={left.items} fallback={left.mark} />
      <div className="tw-border-0 tw-border-t tw-border-solid tw-border-iron-800 md:tw-border-l md:tw-border-t-0">
        <Column label={right.label} items={right.items} fallback={right.mark} />
      </div>
    </div>
  );
}

/** It shows / It does not show (§9): for a check that could be over-read. */
export function HonestyBox({
  shows,
  doesNot,
  locale,
}: {
  readonly shows: readonly TwoColumnItem[];
  readonly doesNot: readonly TwoColumnItem[];
  readonly locale: SupportedLocale;
}) {
  return (
    <TwoColumns
      left={{
        label: kt(locale, "explained.kit.honest.shows"),
        items: shows,
        mark: "tested",
      }}
      right={{
        label: kt(locale, "explained.kit.honest.doesNot"),
        items: doesNot,
        mark: "notGuaranteed",
      }}
    />
  );
}

/** What it is today / what it is not yet (§9): for a chapter whose subject is not live. */
export function IsIsNot({
  is,
  isNot,
  locale,
  label,
}: {
  readonly is: readonly TwoColumnItem[];
  readonly isNot: readonly TwoColumnItem[];
  readonly locale: SupportedLocale;
  readonly label?: string;
}) {
  return (
    <TwoColumns
      left={{
        label: kt(locale, "explained.kit.isnot.is"),
        items: is,
        mark: "tested",
      }}
      right={{
        label: kt(locale, "explained.kit.isnot.isNot"),
        items: isNot,
        mark: "notYet",
      }}
      {...(label ? { label } : {})}
    />
  );
}

/** A mark list for a legend: the four questions and their marks. */
export function MarkList({
  marks,
  locale,
}: {
  readonly marks: readonly {
    readonly kind: MarkKind;
    readonly note?: string;
  }[];
  readonly locale: SupportedLocale;
}) {
  return (
    <ul className="tw-m-0 tw-grid tw-list-none tw-gap-2 tw-p-0">
      {marks.map((mark) => (
        <li
          key={mark.kind}
          className="tw-text-sm tw-leading-5 tw-text-iron-400"
        >
          <Mark kind={mark.kind} locale={locale} size="sm" />
          {mark.note ? ` ${mark.note}` : ""}
        </li>
      ))}
    </ul>
  );
}
