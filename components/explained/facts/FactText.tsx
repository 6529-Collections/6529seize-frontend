import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import { sourceLine, type FactEntry, type FactId } from "@/lib/explained/facts";
import { kt } from "../i18n";

/**
 * A value derived from a fact and printed in a form `fmt` does not have
 * ("Oct 18, 2026", "00:50 UTC on Oct 19", a duration from minutes): it
 * carries the fact's id and source like `FactValue`, so the gates and the
 * reader can trace it. `how` says how it was derived ("one day before it").
 * With no fact (its source is down) it prints "not available".
 */
export function FactText({
  fact,
  locale,
  children,
  how,
  className,
}: {
  readonly fact: FactEntry | null;
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
  readonly how?: string;
  readonly className?: string;
}) {
  if (fact === null) {
    return (
      <span
        className={className ?? "tw-text-iron-400"}
        data-fact=""
        data-fact-unavailable=""
      >
        {kt(locale, "explained.kit.facts.unavailable")}
      </span>
    );
  }
  const line = sourceLine(fact, locale);
  return (
    <span
      className={className}
      data-fact={fact.id}
      title={kt(locale, "explained.kit.facts.source", {
        source: how ? `${line} · ${how}` : line,
      })}
    >
      {children}
    </span>
  );
}

/**
 * A block whose labels print facts as text (the kit's marks and part
 * headings take strings): it names those facts, so the gates and a reader
 * can trace every number in it.
 */
export function FactScope({
  ids,
  children,
  className,
}: {
  readonly ids: readonly FactId[];
  readonly children: ReactNode;
  readonly className?: string;
}) {
  return (
    <div className={className} data-fact={ids.join(" ")}>
      {children}
    </div>
  );
}
