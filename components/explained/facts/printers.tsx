import type { ReactNode } from "react";
import type { SupportedLocale } from "@/i18n/locales";
import {
  fmt,
  type FactBook,
  type FactId,
  type FactStyle,
} from "@/lib/explained/facts";
import { kt } from "../i18n";
import FactValue from "./FactValue";

/**
 * A page's printers for one fact book:
 * - `v(id)`: the fact for running text, with its source (`FactValue`);
 * - `f(id)`: its text, for a label that takes a string (a mark, a part
 *   heading); the block around it names the facts with `FactScope`;
 * - `text(id)`, `num(id)`: its raw value, or null when its source is down
 *   (a list is read from the book itself).
 */
export function printers(book: FactBook, locale: SupportedLocale) {
  const v = (id: FactId, style: FactStyle = "short"): ReactNode => (
    <FactValue fact={book.maybe(id)} locale={locale} style={style} />
  );
  const f = (id: FactId, style: FactStyle = "short"): string => {
    const fact = book.maybe(id);
    return fact
      ? fmt(fact, locale, style)
      : kt(locale, "explained.kit.facts.unavailable");
  };
  const text = (id: FactId): string | null => {
    const raw = book.maybe(id)?.value;
    return typeof raw === "string" ? raw : null;
  };
  const num = (id: FactId): number | null => {
    const raw = book.maybe(id)?.value;
    return typeof raw === "number" ? raw : null;
  };
  return { v, f, text, num };
}

/** The printers' type, for components that take them from their page. */
export type Printers = ReturnType<typeof printers>;
