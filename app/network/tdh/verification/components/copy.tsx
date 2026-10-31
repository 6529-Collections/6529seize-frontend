import { Fragment, type ReactNode } from "react";
import { fill, kt } from "@/components/explained/i18n";
import { getNodeEnv } from "@/config/env";
import type { SupportedLocale } from "@/i18n/locales";
import { tRich, type MessageKey } from "@/i18n/messages";
import { sourceLine, type Fact } from "@/lib/explained/facts";

/**
 * The daily check's and a day's receipt's words (TDH-DESIGN.md §2): every
 * string a message key in its page's namespace, every number an argument
 * filled from a fact, never typed into the copy.
 */
export type CheckKey = Extract<MessageKey, `explained.tdh.check.${string}`>;
export type DayKey = Extract<MessageKey, `explained.tdh.day.${string}`>;
type PageKey = CheckKey | DayKey;

type Params = Readonly<Record<string, string | number>>;

/** A page string with its placeholders filled. */
export function pt(
  locale: SupportedLocale,
  key: PageKey,
  params: Params = {}
): string {
  return fill(locale, key, params);
}

const PLACEHOLDER = /^\{\w+\}$/;

/**
 * A page sentence whose placeholders hold nodes: facts, marks, links. A
 * placeholder left unfilled is a bug, so outside production it throws, as
 * the kit's `fill` does for plain strings.
 */
export function rich(
  locale: SupportedLocale,
  key: PageKey,
  params: Readonly<Record<string, ReactNode>>
): ReactNode {
  const parts = tRich<ReactNode>(locale, key, params);
  const unfilled = parts.find(
    (part): part is string => typeof part === "string" && PLACEHOLDER.test(part)
  );
  if (unfilled !== undefined && getNodeEnv() !== "production") {
    throw new Error(`${key}: no value for ${unfilled}`);
  }
  return parts.map((part, index) => (
    // The parts are the message's fixed segments, in order.
    <Fragment key={index}>{part}</Fragment>
  ));
}

/**
 * A value derived from a fact and printed in a form `fmt` does not have
 * ("Oct 18, 2026", "00:50 UTC on Oct 19", "32"): it carries the fact's id
 * and source like FactValue, so the gates and the reader can trace it.
 */
export function FactText({
  fact,
  locale,
  children,
  className,
}: {
  readonly fact: Fact | null;
  readonly locale: SupportedLocale;
  readonly children: string;
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
  return (
    <span
      className={className}
      data-fact={fact.id}
      title={kt(locale, "explained.kit.facts.source", {
        source: sourceLine(fact, locale),
      })}
    >
      {children}
    </span>
  );
}
