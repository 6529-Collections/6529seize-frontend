import { Fragment, type ReactNode } from "react";
import { getNodeEnv } from "@/config/env";
import type { SupportedLocale } from "@/i18n/locales";
import { tRich, type MessageKey } from "@/i18n/messages";

/**
 * A message whose placeholders are filled with nodes: a fact printed by
 * FactValue (so its number carries its source), a link, a code name. The
 * kit's `fill` returns text only; this is its rich twin, and like `fill` it
 * throws outside production when a placeholder is left unfilled.
 *
 * Promotion candidate for the kit (lane P1 has the same helper).
 */
type RichParams = Readonly<Record<string, ReactNode>>;

const PLACEHOLDER = /\{(\w+)\}/;

export function rich(
  locale: SupportedLocale,
  key: MessageKey,
  params: RichParams = {}
): ReactNode {
  const parts = tRich<ReactNode>(
    locale,
    key,
    params as Record<string, string | number | ReactNode>
  );
  return parts.map((part, index) => {
    if (typeof part === "string") {
      const missing = PLACEHOLDER.exec(part);
      if (missing && getNodeEnv() !== "production") {
        throw new Error(`${key}: no value for {${missing[1] ?? ""}}`);
      }
    }
    // A message's parts are fixed in number and order.
    return <Fragment key={index}>{part}</Fragment>;
  });
}
