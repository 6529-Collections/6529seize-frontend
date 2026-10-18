import type { SupportedLocale } from "@/i18n/locales";
import {
  fmt,
  isFact,
  sourceLine,
  type FactEntry,
  type FactStyle,
} from "@/lib/explained/facts";
import { kt } from "../i18n";

/**
 * A number on the page, printed through its fact (EXPLAINED.md §6.1). It
 * carries the fact's id and its source, so the gates can check that every
 * number on a page came from the registry, and a reader can see where it
 * came from. An unavailable fact prints "not available", never a number.
 */
export default function FactValue({
  fact,
  locale,
  style = "short",
  className,
}: {
  readonly fact: FactEntry | null;
  readonly locale: SupportedLocale;
  readonly style?: FactStyle;
  readonly className?: string;
}) {
  if (fact === null || !isFact(fact)) {
    return (
      <span
        className={className ?? "tw-text-iron-400"}
        data-fact={fact?.id ?? ""}
        data-fact-unavailable=""
      >
        {kt(locale, "explained.kit.facts.unavailable")}
      </span>
    );
  }
  return (
    <span
      className={className}
      data-fact={fact.id}
      title={kt(locale, "explained.kit.facts.source", {
        source: sourceLine(fact, locale),
      })}
    >
      {fmt(fact, locale, style)}
    </span>
  );
}
