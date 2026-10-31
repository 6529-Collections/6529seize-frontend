import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import type { MessageKey } from "@/i18n/messages";
import type { Fact, FactBook } from "@/lib/explained/facts";
import type { ManifestSection } from "@/lib/explained/registry/manifestFacts";
import type { ManifestSectionEntries } from "@/lib/explained/registry/formalFacts";
import { plain, rich, type RichValues } from "@/components/explained/rich";
import { printers } from "@/components/explained/facts/printers";

/**
 * What every part of How sure shares: its copy (explained.tdh.sure.*), the
 * fact printers, and the manifest read once: its sections in order, each
 * with its counts and entries.
 */
export type SureKey = Extract<MessageKey, `explained.tdh.sure.${string}`>;

export interface SureSection {
  readonly id: string;
  readonly title: string | null;
  /** The rules the section is about: "P26 §7.1", "D131". */
  readonly refs: readonly string[];
  readonly counts: ManifestSection | null;
  readonly entries: ManifestSectionEntries["entries"];
  /** The fact the section's entries come from. */
  readonly fact: Fact<ManifestSectionEntries>;
}

export interface SureContext {
  readonly book: FactBook;
  readonly locale: SupportedLocale;
  readonly m: (key: SureKey, values?: RichValues) => ReactNode;
  readonly s: (
    key: SureKey,
    params?: Readonly<Record<string, string | number>>
  ) => string;
  readonly p: ReturnType<typeof printers>;
  /** The manifest's sections, in its order; empty when it cannot be read. */
  readonly sections: readonly SureSection[];
  /** The manifest describes the rules under their old name (before D136, D137). */
  readonly olderRules: boolean;
  /**
   * The record has the Lean model at a newer commit than the manifest's: its
   * counts here are the manifest's until the feed serves the new one.
   */
  readonly leanMoved: boolean;
}

function readSections(book: FactBook): SureSection[] {
  const ids = book.maybe<string[]>("manifest.sectionIds")?.value ?? [];
  const counts = book.maybe<ManifestSection[]>("manifest.sections")?.value;
  return ids.flatMap((id) => {
    const fact = book.maybe<ManifestSectionEntries>(`manifest.section.${id}`);
    if (!fact) {
      return [];
    }
    return [
      {
        id,
        title: fact.value.title,
        refs: fact.value.refs,
        counts: counts?.find((section) => section.id === id) ?? null,
        entries: fact.value.entries,
        fact,
      },
    ];
  });
}

export function sureContext(
  book: FactBook,
  locale: SupportedLocale
): SureContext {
  const manifestRules = book.maybe<string>("manifest.ruleVersion")?.value;
  const rules = book.maybe<string>("rules.version")?.value;
  const manifestCommit = book.maybe<string>("manifest.commit")?.value;
  const leanCommit = book.maybe<string>("rules.leanCommit")?.value;
  return {
    book,
    locale,
    m: (key, values) => rich(locale, key, values),
    s: (key, params) => plain(locale, key, params),
    p: printers(book, locale),
    sections: readSections(book),
    olderRules:
      manifestRules !== undefined &&
      rules !== undefined &&
      manifestRules !== rules,
    leanMoved:
      manifestCommit !== undefined &&
      leanCommit !== undefined &&
      !manifestCommit.startsWith(leanCommit.slice(0, 7)) &&
      !leanCommit.startsWith(manifestCommit.slice(0, 7)),
  };
}

/** A count taken from a list fact, carrying that fact's source. */
export function countOf(base: Fact | null, value: number): Fact | null {
  return base ? { ...base, value, format: "count" } : null;
}

/** "H" from "1.case-H": a counterexample's letter, when it has one. */
export function caseLetter(id: string): string | null {
  return /\.case-([A-Z])$/.exec(id)?.[1] ?? null;
}
