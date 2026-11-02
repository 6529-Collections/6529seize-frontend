import { Fragment, type ReactNode } from "react";
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
/** Up to this many characters with no space, a value is one token. */
const TOKEN_MAX = 24;

/**
 * A long path (design/tdh-lean/tools/manifest.py) breaks only after a
 * slash: each part stays whole, so a hyphen never ends a line.
 */
function pathParts(text: string): ReactNode[] | null {
  if (text.length <= TOKEN_MAX || /\s/.test(text) || !text.includes("/")) {
    return null;
  }
  const parts = text.split("/");
  return parts.map((part, index) => (
    // The parts of one path, in order.
    <Fragment key={index}>
      <span className="tw-whitespace-nowrap">
        {index < parts.length - 1 ? `${part}/` : part}
      </span>
      {index < parts.length - 1 && <wbr />}
    </Fragment>
  ));
}

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
  const text = fmt(fact, locale, style);
  // A short token (a rule ID such as tdh-v1.0, a commit, a date with a
  // hyphen) never breaks at its hyphen; a long hash may still wrap.
  const token = text.length <= TOKEN_MAX && !/\s/.test(text);
  const classes = [className, token ? "tw-whitespace-nowrap" : ""]
    .filter(Boolean)
    .join(" ");
  return (
    <span
      className={classes || undefined}
      data-fact={fact.id}
      title={kt(locale, "explained.kit.facts.source", {
        source: sourceLine(fact, locale),
      })}
    >
      {pathParts(text) ?? text}
    </span>
  );
}
