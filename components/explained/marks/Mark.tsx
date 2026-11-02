import type { SupportedLocale } from "@/i18n/locales";
import { kt, type KitKey } from "../i18n";
import { Glyph, type GlyphKind } from "./glyphs";

/**
 * The marks of the four questions (EXPLAINED.md §3): a glyph and a word,
 * set as text, with no border and no pill. Every mark reads in greyscale,
 * because the word says what the shape says.
 */
export type MarkKind = GlyphKind | "notProved";
export type MarkSize = "md" | "sm";

const WORD: Record<MarkKind, KitKey> = {
  decided: "explained.kit.mark.decided",
  absolute: "explained.kit.mark.absolute",
  proposed: "explained.kit.mark.proposed",
  open: "explained.kit.mark.open",
  proved: "explained.kit.mark.proved",
  tested: "explained.kit.mark.tested",
  shownFalse: "explained.kit.mark.shownFalse",
  notGuaranteed: "explained.kit.mark.notGuaranteed",
  notYet: "explained.kit.mark.notYet",
  drift: "explained.kit.mark.drift",
  assumed: "explained.kit.mark.assumed",
  notProved: "explained.kit.mark.notProved",
};

const GLYPH: Record<MarkKind, GlyphKind> = {
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

/** Which question a mark answers; a day's verdict uses the same marks (§3.8). */
export const MARK_QUESTION: Record<
  MarkKind,
  "standing" | "evidence" | "since"
> = {
  decided: "standing",
  absolute: "standing",
  proposed: "standing",
  open: "standing",
  proved: "evidence",
  tested: "evidence",
  shownFalse: "evidence",
  notGuaranteed: "evidence",
  notYet: "evidence",
  assumed: "evidence",
  notProved: "evidence",
  drift: "since",
};

export const MARK_TEXT: Record<MarkSize, string> = {
  md: "tw-text-sm tw-leading-5",
  sm: "tw-text-[13px] tw-leading-5",
};

const MARK_GLYPH: Record<MarkSize, string> = {
  md: "tw-size-3.5",
  sm: "tw-size-3",
};

export interface MarkProps {
  readonly kind: MarkKind;
  readonly locale: SupportedLocale;
  /**
   * A word in place of the mark's own, such as "Recomputed daily" for
   * Tested. The mark's own word stays for screen readers.
   */
  readonly label?: string;
  /** The reference after the word, in ink-3: a D-number, a count, a scope. */
  readonly refText?: string;
  readonly size?: MarkSize;
}

export function markWord(locale: SupportedLocale, kind: MarkKind): string {
  return kt(locale, WORD[kind]);
}

export default function Mark({
  kind,
  locale,
  label,
  refText,
  size = "md",
}: MarkProps) {
  const word = markWord(locale, kind);
  const shown = label ?? word;
  return (
    <span
      className={`tw-inline-flex tw-max-w-full tw-flex-wrap tw-items-center tw-gap-x-1.5 tw-whitespace-nowrap tw-font-semibold tw-text-iron-50 ${MARK_TEXT[size]}`}
      data-mark={kind}
    >
      <Glyph kind={GLYPH[kind]} className={MARK_GLYPH[size]} />
      {label !== undefined && label !== word && (
        <span className="tw-sr-only">{`${word}: `}</span>
      )}
      <span>{shown}</span>
      {refText !== undefined && (
        <span className="tw-whitespace-normal tw-font-medium tw-text-iron-400">
          {refText}
        </span>
      )}
    </span>
  );
}
