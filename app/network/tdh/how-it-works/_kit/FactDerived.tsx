import type { ReactNode } from "react";
import { kt } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import { sourceLine, type FactEntry } from "@/lib/explained/facts";

/**
 * A number the page prints that is computed from a fact (a date one day
 * earlier, a count without its sign) or by the engine from facts, rather
 * than the fact's own value. It carries the fact's id, like `FactValue`,
 * and its source says how the value was derived, so the gates and a reader
 * can trace it.
 *
 * Built for the How it works and Your wallets pages; a candidate for the
 * kit (`components/explained/facts/`).
 */
export default function FactDerived({
  fact,
  locale,
  how,
  children,
  className,
}: {
  /** The fact the value is derived from. */
  readonly fact: FactEntry;
  readonly locale: SupportedLocale;
  /** How the value is derived: "one day before it", "by the engine". */
  readonly how?: string;
  readonly children: ReactNode;
  readonly className?: string;
}) {
  const line = sourceLine(fact, locale);
  return (
    <span
      className={className}
      data-fact={fact.id}
      data-fact-derived=""
      title={kt(locale, "explained.kit.facts.source", {
        source: how ? `${line} · ${how}` : line,
      })}
    >
      {children}
    </span>
  );
}

/**
 * A value from a record the facts layer does not hold yet (the engine's
 * conformance record, a row of the decision record), printed with its id
 * and its source like a fact. Each use is listed for promotion into
 * `lib/explained/registry`.
 */
export function RecordValue({
  id,
  source,
  locale,
  children,
}: {
  readonly id: string;
  readonly source: string;
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
}) {
  return (
    <span
      data-fact={id}
      data-fact-record=""
      title={kt(locale, "explained.kit.facts.source", { source })}
    >
      {children}
    </span>
  );
}
