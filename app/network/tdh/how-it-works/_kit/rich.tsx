import { Fragment, type ReactNode } from "react";
import { fill } from "@/components/explained/i18n";
import type { SupportedLocale } from "@/i18n/locales";
import { tRich, type MessageKey } from "@/i18n/messages";

/**
 * A message whose placeholders are filled with elements: a fact, a link, a
 * bold value. Numbers stay out of the message itself (TDH-DESIGN.md §2);
 * every placeholder must be filled, as `fill` checks for plain strings.
 */
export function rich(
  locale: SupportedLocale,
  key: MessageKey,
  params: Readonly<Record<string, ReactNode>>
): ReactNode {
  const parts = tRich<ReactNode>(locale, key, { ...params } as Record<
    string,
    string | number | ReactNode
  >);
  return parts.map((part, index) => {
    if (typeof part === "string" && /^\{\w+\}$/.test(part)) {
      // Fail loudly outside production, as fill() does.
      fill(locale, key, {});
    }
    // The parts are a fixed sequence of one message.
    return <Fragment key={index}>{part}</Fragment>;
  });
}
