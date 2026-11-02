import type { ReactNode } from "react";
import FactValue from "@/components/explained/facts/FactValue";
import { formatUtcDay } from "@/lib/explained/format";
import type { SupportedLocale } from "@/i18n/locales";
import {
  isFact,
  type FactEntry,
  type FactId,
  type FactSnapshot,
  type FactStyle,
  type FactValue as FactValueType,
} from "@/lib/explained/facts";

/**
 * The page's facts, for printing, in server and client components alike
 * (no hooks: a client component passes `useFactSnapshot()`). A fact prints
 * through FactValue, so every number carries its id and its source; an
 * unavailable one prints "not available" and still names its id. Nothing
 * here holds a value typed by hand.
 */
export interface PageFacts {
  /** A fact printed: `print("proofs.day.steps")`. */
  readonly print: (
    id: FactId,
    style?: FactStyle,
    className?: string
  ) => ReactNode;
  /** The entry itself, for kit components that take one. */
  readonly entry: (id: FactId) => FactEntry | null;
  /** A count's value, or null when its source is down. */
  readonly num: (id: FactId) => number | null;
  /** A list of strings (hex words), or null when its source is down. */
  readonly strings: (id: FactId) => readonly string[] | null;
  /** Any value, or null when its source is down; the caller narrows it. */
  readonly raw: (id: FactId) => FactValueType | null;
  /** The UTC day a cycle fact's number stands for (cycle N starts N days after 1970-01-01). */
  readonly cycleDate: (id: FactId) => ReactNode;
}

const DAY_MS = 86_400_000;

export function pageFacts(
  snapshot: FactSnapshot,
  locale: SupportedLocale
): PageFacts {
  const entry = (id: FactId): FactEntry | null => {
    const found = snapshot.facts[id];
    if (found === undefined) {
      throw new Error(
        `Fact "${id}" was not resolved on the server for this page.`
      );
    }
    return found;
  };
  const raw = (id: FactId): FactValueType | null => {
    const found = entry(id);
    return found && isFact(found) ? found.value : null;
  };
  return {
    entry,
    cycleDate: (id) => {
      const cycle = raw(id);
      return typeof cycle === "number" ? (
        <span data-fact={id}>
          {formatUtcDay(locale, new Date(cycle * DAY_MS).toISOString())}
        </span>
      ) : (
        <FactValue fact={entry(id)} locale={locale} />
      );
    },
    print: (id, style, className) => (
      <FactValue
        fact={entry(id)}
        locale={locale}
        {...(style === undefined ? {} : { style })}
        {...(className === undefined ? {} : { className })}
      />
    ),
    raw,
    num: (id) => {
      const value = raw(id);
      return typeof value === "number" ? value : null;
    },
    strings: (id) => {
      const value = raw(id);
      return Array.isArray(value) &&
        value.every((item) => typeof item === "string")
        ? (value as readonly string[])
        : null;
    },
  };
}
