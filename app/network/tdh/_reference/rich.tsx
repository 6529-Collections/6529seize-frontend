import { Fragment, type ReactNode } from "react";
import FactValue from "@/components/explained/facts/FactValue";
import { fill, kt } from "@/components/explained/i18n";
import { getNodeEnv } from "@/config/env";
import type { SupportedLocale } from "@/i18n/locales";
import { tRich, type MessageKey } from "@/i18n/messages";
import { EN_US_MESSAGES } from "@/i18n/messages/en-US";
import {
  fmt,
  sourceLine,
  type Fact,
  type FactBook,
  type FactId,
  type FactStyle,
} from "@/lib/explained/facts";

/**
 * Message keys with facts and marks inside them (TDH-DESIGN.md §2): a key
 * never contains a number, so each `{placeholder}` is filled with a node,
 * most often a fact printed with its source (`FactValue`), sometimes a code
 * name set in mono. Outside production an unfilled placeholder throws, as
 * the kit's `fill` does for plain strings.
 */
export type RichValues = Readonly<Record<string, ReactNode>>;

export function rich(
  locale: SupportedLocale,
  key: MessageKey,
  values: RichValues = {}
): ReactNode {
  const parts = tRich<ReactNode>(locale, key, values);
  return parts.map((part, index) => {
    if (
      typeof part === "string" &&
      /^\{\w+\}$/.test(part) &&
      getNodeEnv() !== "production"
    ) {
      throw new Error(`${key}: no value for ${part}`);
    }
    // The parts of one message are fixed in order.
    return <Fragment key={index}>{part}</Fragment>;
  });
}

/** Whether a key built from data (a section id, an item id) has copy. */
export function isMessageKey(key: string): key is MessageKey {
  return Object.hasOwn(EN_US_MESSAGES, key);
}

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

/** A plain message (for an attribute or a label that takes a string). */
export function plain(
  locale: SupportedLocale,
  key: MessageKey,
  params: Readonly<Record<string, string | number>> = {}
): string {
  return fill(locale, key, params);
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

/**
 * Text derived from a fact that its format does not print (a duration from
 * minutes, a source line), carried with the fact's id and source.
 */
export function FactText({
  fact,
  locale,
  children,
}: {
  readonly fact: Fact | null;
  readonly locale: SupportedLocale;
  readonly children: ReactNode;
}) {
  if (!fact) {
    return (
      <span className="tw-text-iron-400" data-fact-unavailable="">
        {kt(locale, "explained.kit.facts.unavailable")}
      </span>
    );
  }
  return (
    <span
      data-fact={fact.id}
      title={kt(locale, "explained.kit.facts.source", {
        source: sourceLine(fact, locale),
      })}
    >
      {children}
    </span>
  );
}
